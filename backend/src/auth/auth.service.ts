import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CredentialsDto, RegisterDto } from './auth.dto.js';
import { FAILURE_WINDOW_MS, LoginBlockedException, nextFailure } from './login-throttle.js';

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const refreshLifetime = 30 * 24 * 60 * 60 * 1000;
const reuseCode = 'REFRESH_TOKEN_REUSE';

function reusedToken() {
  return new UnauthorizedException({ code: reuseCode, message: 'Refresh token reuse detected. Sign in again.' });
}

async function passwordHash(password: string, salt = randomBytes(16).toString('hex')) {
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    const encoded = await passwordHash(input.password);
    try {
      const user = await this.prisma.db.orm.public.User.create({ id: randomUUID(), email, name: input.name.trim(), passwordHash: encoded });
      return { id: user.id, email: user.email, name: user.name };
    } catch (error) {
      if ((error as { sqlState?: string }).sqlState === '23505') throw new ConflictException('Email is already registered');
      throw error;
    }
  }

  async login(input: CredentialsDto) {
    const email = input.email.trim().toLowerCase();
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required');
    const accountKey = createHmac('sha256', secret).update(email).digest('hex');
    const db = this.prisma.db;

    // Opportunistic bounded cleanup avoids retaining abandoned counters indefinitely.
    if (randomInt(128) === 0) {
      const cutoff = new Date(Date.now() - FAILURE_WINDOW_MS).toISOString();
      await db.execute(db.raw.sql`DELETE FROM "public"."LoginAttempt" WHERE "accountKey" IN (SELECT "accountKey" FROM "public"."LoginAttempt" WHERE "lastFailedAt" < ${cutoff} LIMIT 500)`.affectedCount().build());
    }

    const result = await db.transaction(async (tx) => {
      // Lock one account's row before checking credentials so requests from different IPs cannot race past the limit.
      await tx.execute(db.raw.sql`INSERT INTO "public"."LoginAttempt" ("accountKey", "failedAttempts", "lastFailedAt", "lockedUntil") VALUES (${accountKey}, 0, NULL, NULL) ON CONFLICT ("accountKey") DO NOTHING`.affectedCount().build());
      await tx.query(db.raw.sql`SELECT "accountKey" FROM "public"."LoginAttempt" WHERE "accountKey" = ${accountKey} FOR UPDATE`.returnsRow({ accountKey: 'pg/text@1' }).build());
      const attempt = await tx.orm.public.LoginAttempt.where({ accountKey }).first();
      if (!attempt) throw new Error('Login attempt row missing');
      const now = Date.now();
      const lockedUntil = attempt.lockedUntil ? Date.parse(attempt.lockedUntil) : 0;
      if (lockedUntil > now) return { status: 'blocked' as const, retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000) };

      const user = await tx.orm.public.User.where({ email }).first();
      // Derive a key for nonexistent accounts too, so the result does not disclose account existence.
      const stored = user?.passwordHash ?? '00000000000000000000000000000000:' + '00'.repeat(64);
      const [salt, expected] = stored.split(':');
      const actual = (await passwordHash(input.password, salt)).split(':')[1];
      if (!user || !expected || !actual || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))) {
        await tx.orm.public.LoginAttempt.where({ accountKey }).update(nextFailure(attempt.failedAttempts, attempt.lastFailedAt, Date.now()));
        return { status: 'invalid' as const };
      }

      const id = randomUUID();
      const token = `${id}.${randomBytes(32).toString('base64url')}`;
      await tx.orm.public.AuthSession.create({ id, userId: user.id, familyId: id, revokedAt: null, revocationReason: null, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + refreshLifetime).toISOString() });
      await tx.orm.public.LoginAttempt.where({ accountKey }).delete();
      return { status: 'ok' as const, userId: user.id, id, token };
    });

    if (result.status === 'blocked') throw new LoginBlockedException(result.retryAfterSeconds);
    if (result.status === 'invalid') throw new UnauthorizedException('Invalid credentials');
    return this.tokens(result.userId, result.id, result.token);
  }

  async refresh(token: string) {
    const id = token.split('.')[0];
    const tokenHash = hashToken(token);
    const next = `${id}.${randomBytes(32).toString('base64url')}`;
    const result = await this.prisma.db.transaction(async (tx) => {
      const sessions = tx.orm.public.AuthSession;
      const session = await sessions.where({ id }).first();
      if (!session || Date.parse(session.expiresAt) <= Date.now()) return { status: 'invalid' as const };

      const familyId = session.familyId ?? session.id;
      const changed = await sessions.where({ id, tokenHash, revokedAt: null }).updateAndCount({ tokenHash: hashToken(next), familyId });
      if (changed === 1) {
        await tx.orm.public.UsedRefreshToken.create({ id: randomUUID(), sessionId: id, tokenHash });
        return { status: 'ok' as const, userId: session.userId };
      }

      // Only a genuine previously issued token can trigger a family-wide revocation.
      const current = await sessions.where({ id }).first();
      const used = await tx.orm.public.UsedRefreshToken.where({ sessionId: id, tokenHash }).first();
      if (!current || (!used && current.tokenHash !== tokenHash)) return { status: 'invalid' as const };
      if (current.revocationReason === 'reuse') return { status: 'reuse' as const };
      if (used && !current.revokedAt) {
        await sessions.where({ userId: current.userId, familyId: current.familyId ?? current.id }).updateAndCount({ revokedAt: new Date().toISOString(), revocationReason: 'reuse' });
        // Legacy sessions have no familyId until their first successful rotation.
        if (!current.familyId) await sessions.where({ id: current.id }).updateAndCount({ familyId: current.id, revokedAt: new Date().toISOString(), revocationReason: 'reuse' });
        return { status: 'reuse' as const };
      }
      return { status: 'invalid' as const };
    });
    if (result.status === 'reuse') throw reusedToken();
    if (result.status !== 'ok') throw new UnauthorizedException('Invalid refresh token');
    return this.tokens(result.userId, id, next);
  }

  async logout(sessionId: string, userId: string) {
    await this.prisma.db.orm.public.AuthSession.where({ id: sessionId, userId }).deleteAndCount();
  }

  async logoutAll(userId: string) {
    await this.prisma.db.orm.public.AuthSession.where({ userId }).deleteAndCount();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.db.orm.public.User.where({ id: userId }).first();
    if (!user) throw new UnauthorizedException();
    const [salt, expected] = user.passwordHash.split(':');
    const actual = (await passwordHash(currentPassword, salt)).split(':')[1];
    if (!expected || !actual || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const nextHash = await passwordHash(newPassword);
    await this.prisma.db.transaction(async (tx) => {
      const updated = await tx.orm.public.User.where({ id: userId, passwordHash: user.passwordHash }).updateAndCount({ passwordHash: nextHash });
      if (updated !== 1) throw new UnauthorizedException('Credentials changed');
      await tx.orm.public.AuthSession.where({ userId }).deleteAndCount();
    });
  }

  async authenticate(userId: string, sessionId: string) {
    const session = await this.prisma.db.orm.public.AuthSession.where({ id: sessionId, userId }).first();
    if (session?.revocationReason === 'reuse') throw reusedToken();
    if (!session || session.revokedAt || Date.parse(session.expiresAt) <= Date.now()) throw new UnauthorizedException();
    const user = await this.prisma.db.orm.public.User.where({ id: userId }).first();
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name, sessionId };
  }

  private async tokens(userId: string, sessionId: string, refreshToken: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, sid: sessionId });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900 };
  }
}

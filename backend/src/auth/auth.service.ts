import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CredentialsDto } from './auth.dto.js';

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const refreshLifetime = 30 * 24 * 60 * 60 * 1000;

async function passwordHash(password: string, salt = randomBytes(16).toString('hex')) {
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: CredentialsDto) {
    const email = input.email.trim().toLowerCase();
    const encoded = await passwordHash(input.password);
    try {
      const user = await this.prisma.db.orm.public.User.create({ id: randomUUID(), email, passwordHash: encoded });
      return { id: user.id, email: user.email };
    } catch (error) {
      if ((error as { sqlState?: string }).sqlState === '23505') throw new ConflictException('Email is already registered');
      throw error;
    }
  }

  async login(input: CredentialsDto) {
    const user = await this.prisma.db.orm.public.User.where({ email: input.email.trim().toLowerCase() }).first();
    // Perform the same expensive derivation for nonexistent accounts.
    const stored = user?.passwordHash ?? '00000000000000000000000000000000:' + '00'.repeat(64);
    const [salt, expected] = stored.split(':');
    const actual = (await passwordHash(input.password, salt)).split(':')[1];
    if (!user || !expected || !actual || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const id = randomUUID();
    const token = `${id}.${randomBytes(32).toString('base64url')}`;
    await this.prisma.db.orm.public.AuthSession.create({ id, userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + refreshLifetime).toISOString() });
    return this.tokens(user.id, id, token);
  }

  async refresh(token: string) {
    const id = token.split('.')[0];
    const sessions = this.prisma.db.orm.public.AuthSession;
    const session = await sessions.where({ id, tokenHash: hashToken(token) }).first();
    if (!session || Date.parse(session.expiresAt) <= Date.now()) throw new UnauthorizedException('Invalid refresh token');
    const next = `${id}.${randomBytes(32).toString('base64url')}`;
    // Compare-and-swap makes a refresh token usable only once, even with concurrent requests.
    const changed = await sessions.where({ id, tokenHash: hashToken(token) }).updateAndCount({ tokenHash: hashToken(next) });
    if (changed !== 1) throw new UnauthorizedException('Invalid refresh token');
    return this.tokens(session.userId, id, next);
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
    if (!session || Date.parse(session.expiresAt) <= Date.now()) throw new UnauthorizedException();
    const user = await this.prisma.db.orm.public.User.where({ id: userId }).first();
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, sessionId };
  }

  private async tokens(userId: string, sessionId: string, refreshToken: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, sid: sessionId });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900 };
  }
}

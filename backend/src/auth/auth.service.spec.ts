import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

function fixture() {
  const id = 'session-id';
  const token = `${id}.${'a'.repeat(43)}`;
  const row = { id, userId: 'user-id', familyId: id as string | null, tokenHash: digest(token), revokedAt: null as string | null, revocationReason: null as string | null, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const used: { sessionId: string; tokenHash: string }[] = [];
  const matches = (record: object, filter: object) => Object.entries(filter).every(([key, value]) => (record as Record<string, unknown>)[key] === value);
  const sessions = {
    where: (filter: object) => ({
      first: async () => matches(row, filter) ? { ...row } : null,
      updateAndCount: async (data: Partial<typeof row>) => {
        if (!matches(row, filter)) return 0;
        Object.assign(row, data);
        return 1;
      },
    }),
  };
  const usedTokens = {
    where: (filter: object) => ({ first: async () => used.find((entry) => matches(entry, filter)) ?? null }),
    create: async (entry: { sessionId: string; tokenHash: string }) => { used.push(entry); return entry; },
  };
  const db = { orm: { public: { AuthSession: sessions, UsedRefreshToken: usedTokens } }, transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(db) };
  const prisma = { db } as unknown as PrismaService;
  const jwt = { signAsync: async () => 'access-token' } as unknown as JwtService;
  return { service: new AuthService(prisma, jwt), row, token, used };
}

describe('refresh token reuse', () => {
  it('rotates tokens and revokes the family when an old token is presented', async () => {
    const { service, token, row, used } = fixture();
    const rotated = await service.refresh(token);
    expect(used[0].tokenHash).toBe(digest(token));
    expect(row.tokenHash).toBe(digest(rotated.refreshToken));
    await expect(service.refresh(token)).rejects.toMatchObject({ response: { code: 'REFRESH_TOKEN_REUSE' } });
    expect(row.revokedAt).not.toBeNull();
    expect(row.revocationReason).toBe('reuse');
    await expect(service.refresh(rotated.refreshToken)).rejects.toMatchObject({ response: { code: 'REFRESH_TOKEN_REUSE' } });
    await expect(service.authenticate('user-id', row.id)).rejects.toMatchObject({ response: { code: 'REFRESH_TOKEN_REUSE' } });
  });

  it('does not revoke a session for a fabricated token', async () => {
    const { service, token, row } = fixture();
    await expect(service.refresh(`session-id.${'x'.repeat(43)}`)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(row.revokedAt).toBeNull();
    await expect(service.refresh(token)).resolves.toHaveProperty('refreshToken');
  });

  it('upgrades legacy sessions when they rotate', async () => {
    const { service, token, row } = fixture();
    row.familyId = null;
    await service.refresh(token);
    expect(row.familyId).toBe(row.id);
    await expect(service.refresh(token)).rejects.toMatchObject({ response: { code: 'REFRESH_TOKEN_REUSE' } });
    expect(row.revokedAt).not.toBeNull();
  });
});

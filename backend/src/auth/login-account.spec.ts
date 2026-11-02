import { createHmac, scryptSync } from 'node:crypto';
import type { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginBlockedException } from './login-throttle.js';

type Counter = { accountKey: string; failedAttempts: number; lastFailedAt: string | null; lockedUntil: string | null };
type Plan = { sql: string; values: unknown[] };

function fixture() {
  const counters = new Map<string, Counter>();
  const salt = 'test-salt';
  const passwordHash = `${salt}:${scryptSync('correct-password', salt, 64).toString('hex')}`;
  const raw = (parts: TemplateStringsArray, ...values: unknown[]) => {
    const plan = { sql: parts.join('?'), values };
    return { affectedCount: () => ({ build: () => plan }), returnsRow: () => ({ build: () => plan }) };
  };
  const tx = {
    execute: async (plan: Plan) => {
      if (plan.sql.startsWith('INSERT')) {
        const key = String(plan.values[0]);
        if (!counters.has(key)) counters.set(key, { accountKey: key, failedAttempts: 0, lastFailedAt: null, lockedUntil: null });
      }
    },
    query: async () => [],
    orm: { public: {
      LoginAttempt: { where: ({ accountKey }: { accountKey: string }) => ({
        first: async () => counters.get(accountKey) ?? null,
        update: async (data: Partial<Counter>) => Object.assign(counters.get(accountKey)!, data),
        delete: async () => { counters.delete(accountKey); },
      }) },
      User: { where: ({ email }: { email: string }) => ({ first: async () => email === 'ana@example.com' ? { id: 'user-id', passwordHash } : null }) },
      AuthSession: { create: async () => ({}) },
    } },
  };
  let previous = Promise.resolve();
  const db = { raw: { sql: raw }, execute: async () => ({}), transaction: async (callback: (arg: typeof tx) => Promise<unknown>) => {
    const current = previous.then(() => callback(tx));
    previous = current.then(() => undefined, () => undefined);
    return current;
  } };
  const auth = new AuthService({ db } as unknown as PrismaService, { signAsync: async () => 'access-token' } as unknown as JwtService);
  return { auth, counters };
}

describe('per-account login throttling', () => {
  const originalSecret = process.env.JWT_SECRET;
  beforeEach(() => { process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'; vi.useFakeTimers(); });
  afterEach(() => { if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret; vi.useRealTimers(); });

  it('serializes failures for a normalized account, backs off and resets on success', async () => {
    const { auth, counters } = fixture();
    const failures = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => auth.login({ email: i % 2 ? 'ANA@EXAMPLE.COM' : 'ana@example.com', password: 'wrong-password' })));
    expect(failures.filter((result) => result.status === 'rejected' && result.reason.getStatus() === 401)).toHaveLength(5);
    expect(failures.filter((result) => result.status === 'rejected' && result.reason.getStatus() === 429)).toHaveLength(1);
    const key = createHmac('sha256', process.env.JWT_SECRET!).update('ana@example.com').digest('hex');
    expect(counters.get(key)?.failedAttempts).toBe(5);
    await expect(auth.login({ email: 'ana@example.com', password: 'correct-password' })).rejects.toMatchObject({ response: { code: 'LOGIN_RATE_LIMITED' } });
    vi.advanceTimersByTime(1001);
    await expect(auth.login({ email: 'ana@example.com', password: 'wrong-password' })).rejects.toMatchObject({ status: 401 });
    expect(counters.get(key)?.failedAttempts).toBe(6);
    await expect(auth.login({ email: 'ana@example.com', password: 'correct-password' })).rejects.toMatchObject({ response: { retryAfterSeconds: 2 } });
    vi.advanceTimersByTime(2001);
    await expect(auth.login({ email: 'ana@example.com', password: 'correct-password' })).resolves.toHaveProperty('accessToken');
    expect(counters.has(key)).toBe(false);
  });

  it('applies identical responses to missing accounts without affecting other accounts', async () => {
    const { auth } = fixture();
    for (let i = 0; i < 5; i++) await expect(auth.login({ email: 'missing@example.com', password: 'wrong-password' })).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
    await expect(auth.login({ email: 'missing@example.com', password: 'wrong-password' })).rejects.toMatchObject({ response: { code: 'LOGIN_RATE_LIMITED' } });
    await expect(auth.login({ email: 'ana@example.com', password: 'correct-password' })).resolves.toHaveProperty('accessToken');
  });

  it('sends Retry-After when the account is blocked', async () => {
    const exception = new LoginBlockedException(3);
    const controller = new AuthController({ login: async () => { throw exception; } } as unknown as AuthService);
    const setHeader = vi.fn();
    const response = { setHeader } as unknown as Response;
    await expect(controller.login({ email: 'x@example.com', password: 'wrong-password' }, response)).rejects.toBe(exception);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', 3);
  });
});

import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

function fixture(seed = true) {
  const users: { id: string; email: string; name: string; passwordHash: string }[] = [];
  const memberships: { userId: string; roleId: string }[] = [];
  const sql = () => ({ returnsRow: () => ({ build: () => ({}) }) });
  const tx = { query: async () => [], orm: { public: {
    User: { first: async () => users[0] ?? null, create: async (user: typeof users[number]) => { users.push(user); return user; } },
    Role: { where: () => ({ first: async () => seed ? { id: 'super-role' } : null }) },
    UserRole: { create: async (membership: typeof memberships[number]) => { memberships.push(membership); } },
  } } };
  let pending = Promise.resolve();
  const db = { raw: { sql }, orm: tx.orm, transaction: async <T>(fn: (value: typeof tx) => Promise<T>): Promise<T> => {
    const result = pending.then(() => fn(tx));
    pending = result.then(() => undefined, () => undefined);
    return result;
  } };
  return { service: new AuthService({ db } as unknown as PrismaService, {} as JwtService), users, memberships };
}
const input = { email: 'ADMIN@example.com', name: ' Ana ', password: 'secure-password-123' };

describe('initial setup', () => {
  it('creates one super administrator and then disables setup', async () => {
    const { service, users, memberships } = fixture();
    expect(await service.setupStatus()).toEqual({ setupRequired: true });
    await expect(service.register(input)).rejects.toMatchObject({ response: { code: 'SETUP_REQUIRED' } });
    const attempts = await Promise.allSettled([service.setup(input), service.setup(input)]);
    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('admin@example.com');
    expect(memberships).toEqual([{ id: expect.any(String), userId: users[0].id, roleId: 'super-role' }]);
    expect(await service.setupStatus()).toEqual({ setupRequired: false });
    await expect(service.setup(input)).rejects.toMatchObject({ response: { code: 'SETUP_ALREADY_COMPLETE' } });
  });

  it('does not create a user when the RBAC seed is missing', async () => {
    const { service, users } = fixture(false);
    await expect(service.setup(input)).rejects.toMatchObject({ status: 503 });
    expect(users).toHaveLength(0);
  });
});

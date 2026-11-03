import { describe, expect, it } from 'vitest';
import { AccessControlService } from './access-control.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AccessControlService', () => {
  it('combines role permissions and reflects revocation on the next check', async () => {
    const memberships = [{ roleId: 'one' }, { roleId: 'two' }];
    const grants = [{ roleId: 'one', permissionId: 'view' }, { roleId: 'two', permissionId: 'edit' }];
    const db = { orm: { public: {
      UserRole: { where: () => ({ all: () => Promise.resolve(memberships) }) },
      Role: { where: ({ id }: { id: string }) => ({ first: () => Promise.resolve({ id, name: id }) }) },
      RolePermission: { where: ({ roleId }: { roleId: string }) => ({ all: () => Promise.resolve(grants.filter((grant) => grant.roleId === roleId)) }) },
      Permission: { where: ({ id }: { id: string }) => ({ first: () => Promise.resolve({ key: `users.${id}` }) }) },
    } } };
    const service = new AccessControlService({ db } as unknown as PrismaService);
    expect(await service.hasPermissions('user', ['users.view', 'users.edit'])).toBe(true);
    expect(await service.hasPermissions('user', [])).toBe(false);
    grants.pop();
    expect(await service.hasPermissions('user', ['users.view', 'users.edit'])).toBe(false);
    expect(await service.hasPermissions('user', ['users.view'])).toBe(true);
  });
});

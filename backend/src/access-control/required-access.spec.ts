import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdministrationService } from './administration.service.js';

function fixture() {
  const permission = { id: 'p', key: 'custom.view', isRequired: false, description: null as string | null, updatedAt: '' };
  const role = { id: 'r', name: 'custom', isRequired: false, description: null as string | null, updatedAt: '' };
  const collection = <T extends { isRequired: boolean }>(value: T) => ({
    where: () => ({ forNoKeyUpdate: () => ({ first: async () => value }), update: async (changes: Partial<T>) => { for (const [key, item] of Object.entries(changes)) if (item !== undefined) Object.assign(value, { [key]: item }); return value; }, delete: async () => value }),
  });
  const tx = { orm: { public: { Permission: collection(permission), Role: collection(role), RolePermission: { where: () => ({ first: async () => null }) }, UserRole: { where: () => ({ first: async () => null }) } } } };
  const db = { transaction: async <T>(fn: (value: typeof tx) => Promise<T>) => fn(tx) };
  return { service: new AdministrationService({ db } as unknown as PrismaService), permission, role };
}

describe('required roles and permissions', () => {
  it('allows a custom permission to be protected and unprotected, blocking rename and deletion while protected', async () => {
    const { service, permission } = fixture();
    await service.updatePermission('p', { isRequired: true });
    await expect(service.deletePermission('p')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.updatePermission('p', { key: 'custom.edit', isRequired: false })).rejects.toBeInstanceOf(ConflictException);
    await service.updatePermission('p', { isRequired: false });
    await service.updatePermission('p', { key: 'custom.edit' });
    expect(permission.key).toBe('custom.edit');
    await expect(service.deletePermission('p')).resolves.toBeUndefined();
  });
  it('protects roles and never allows system entries to be unprotected', async () => {
    const { service, role, permission } = fixture();
    await service.updateRole('r', { isRequired: true });
    await expect(service.deleteRole('r')).rejects.toBeInstanceOf(ConflictException);
    role.name = 'super_admin'; permission.key = 'users.view';
    await expect(service.updateRole('r', { isRequired: false })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.updatePermission('p', { isRequired: false })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.deletePermission('p')).rejects.toBeInstanceOf(ConflictException);
  });
});

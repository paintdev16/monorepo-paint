import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async effectivePermissions(userId: string) {
    const db = this.prisma.db;
    const memberships = await db.orm.public.UserRole.where({ userId }).all();
    const roles: { id: string; name: string }[] = [];
    const permissions = new Set<string>();
    for (const membership of memberships) {
      const role = await db.orm.public.Role.where({ id: membership.roleId }).first();
      if (!role) continue;
      roles.push({ id: role.id, name: role.name });
      const grants = await db.orm.public.RolePermission.where({ roleId: role.id }).all();
      for (const grant of grants) {
        const permission = await db.orm.public.Permission.where({ id: grant.permissionId }).first();
        if (permission) permissions.add(permission.key);
      }
    }
    if (roles.some((role) => role.name === 'super_admin')) {
      for (const permission of await db.orm.public.Permission.all()) permissions.add(permission.key);
    }
    return { roles, permissions: [...permissions].sort() };
  }

  async hasPermissions(userId: string, required: readonly string[]) {
    if (!required.length) return false;
    const effective = await this.effectivePermissions(userId);
    return required.every((permission) => effective.permissions.includes(permission));
  }

  async isSuperAdmin(userId: string) {
    return (await this.effectivePermissions(userId)).roles.some((role) => role.name === 'super_admin');
  }
}

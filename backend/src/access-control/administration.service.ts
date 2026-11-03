import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from './access.constants.js';
import type { PageDto, PermissionCreateDto, PermissionUpdateDto, RoleCreateDto, RoleUpdateDto } from './access.dto.js';

@Injectable()
export class AdministrationService {
  constructor(private readonly prisma: PrismaService) {}

  private async conflict<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch (error) {
      if ((error as { sqlState?: string }).sqlState === '23505') throw new ConflictException('Name or key already exists');
      if ((error as { sqlState?: string }).sqlState === '23503') throw new ConflictException('Resource is in use');
      throw error;
    }
  }

  async listRoles(query: PageDto) {
    let collection = this.prisma.db.orm.public.Role;
    if (query.search) collection = collection.where((r) => r.name.ilike(`%${query.search}%`));
    const data = await collection.orderBy((r) => r.name.asc()).limit(query.limit).offset((query.page - 1) * query.limit).all();
    return { data, page: query.page, limit: query.limit };
  }
  async role(id: string) {
    const role = await this.prisma.db.orm.public.Role.where({ id }).first();
    if (!role) throw new NotFoundException('Role not found');
    const grants = await this.prisma.db.orm.public.RolePermission.where({ roleId: id }).all();
    const permissions = await Promise.all(grants.map((grant) => this.prisma.db.orm.public.Permission.where({ id: grant.permissionId }).first()));
    return { ...role, permissions: permissions.filter((value) => value !== null) };
  }
  createRole(input: RoleCreateDto) {
    if (SYSTEM_ROLES.includes(input.name)) throw new ConflictException('Reserved role name');
    const now = new Date().toISOString();
    return this.conflict(() => this.prisma.db.orm.public.Role.create({ id: randomUUID(), name: input.name, description: input.description ?? null, createdAt: now, updatedAt: now }));
  }
  async updateRole(id: string, input: RoleUpdateDto) {
    const role = await this.role(id);
    if (SYSTEM_ROLES.includes(role.name) || (input.name && SYSTEM_ROLES.includes(input.name))) throw new ForbiddenSystemResource();
    return this.conflict(() => this.prisma.db.orm.public.Role.where({ id }).update({ name: input.name, description: input.description, updatedAt: new Date().toISOString() }));
  }
  async deleteRole(id: string) {
    const db = this.prisma.db;
    return db.transaction(async (tx) => {
      const role = await tx.orm.public.Role.where({ id }).forNoKeyUpdate().first();
      if (!role) throw new NotFoundException('Role not found');
      if (SYSTEM_ROLES.includes(role.name)) throw new ForbiddenSystemResource();
      if (await tx.orm.public.UserRole.where({ roleId: id }).first()) throw new ConflictException('Role is assigned to users');
      await tx.orm.public.Role.where({ id }).delete();
    });
  }
  async syncPermissions(roleId: string, ids: string[]) {
    const db = this.prisma.db;
    return db.transaction(async (tx) => {
      const role = await tx.orm.public.Role.where({ id: roleId }).forNoKeyUpdate().first();
      if (!role) throw new NotFoundException('Role not found');
      if (role.name === 'super_admin') throw new ForbiddenSystemResource();
      for (const id of ids) if (!await tx.orm.public.Permission.where({ id }).first()) throw new BadRequestException('Permission not found');
      await tx.orm.public.RolePermission.where({ roleId }).deleteAndCount();
      for (const permissionId of ids) await tx.orm.public.RolePermission.create({ id: randomUUID(), roleId, permissionId });
      return { ids };
    });
  }
  async listPermissions(query: PageDto) {
    let collection = this.prisma.db.orm.public.Permission;
    if (query.search) collection = collection.where((p) => p.key.ilike(`%${query.search}%`));
    const data = await collection.orderBy((p) => p.key.asc()).limit(query.limit).offset((query.page - 1) * query.limit).all();
    return { data, page: query.page, limit: query.limit };
  }
  async permission(id: string) {
    const db = this.prisma.db;
    const permission = await db.orm.public.Permission.where({ id }).first();
    if (!permission) throw new NotFoundException('Permission not found');
    const grants = await db.orm.public.RolePermission.where({ permissionId: id }).all();
    const roles = await Promise.all(grants.map((grant) => db.orm.public.Role.where({ id: grant.roleId }).first()));
    return { ...permission, roles: roles.filter((value) => value !== null) };
  }
  createPermission(input: PermissionCreateDto) {
    if (SYSTEM_PERMISSIONS.includes(input.key)) throw new ConflictException('Reserved permission key');
    const now = new Date().toISOString();
    return this.conflict(() => this.prisma.db.orm.public.Permission.create({ id: randomUUID(), key: input.key, description: input.description ?? null, createdAt: now, updatedAt: now }));
  }
  async updatePermission(id: string, input: PermissionUpdateDto) {
    const permission = await this.permission(id);
    if (SYSTEM_PERMISSIONS.includes(permission.key) || (input.key && SYSTEM_PERMISSIONS.includes(input.key))) throw new ForbiddenSystemResource();
    return this.conflict(() => this.prisma.db.orm.public.Permission.where({ id }).update({ key: input.key, description: input.description, updatedAt: new Date().toISOString() }));
  }
  async deletePermission(id: string) {
    const db = this.prisma.db;
    return db.transaction(async (tx) => {
      const permission = await tx.orm.public.Permission.where({ id }).forNoKeyUpdate().first();
      if (!permission) throw new NotFoundException('Permission not found');
      if (SYSTEM_PERMISSIONS.includes(permission.key)) throw new ForbiddenSystemResource();
      if (await tx.orm.public.RolePermission.where({ permissionId: id }).first()) throw new ConflictException('Permission is assigned to roles');
      await tx.orm.public.Permission.where({ id }).delete();
    });
  }
  async userRoles(userId: string) {
    const db = this.prisma.db;
    if (!await db.orm.public.User.where({ id: userId }).first()) throw new NotFoundException('User not found');
    const memberships = await db.orm.public.UserRole.where({ userId }).all();
    const roles = await Promise.all(memberships.map((membership) => db.orm.public.Role.where({ id: membership.roleId }).first()));
    return { roles: roles.filter((role) => role !== null) };
  }
  async syncRoles(userId: string, ids: string[]) {
    const db = this.prisma.db;
    return db.transaction(async (tx) => {
      const user = await tx.orm.public.User.where({ id: userId }).forNoKeyUpdate().first();
      if (!user) throw new NotFoundException('User not found');
      const superRole = await tx.orm.public.Role.where({ name: 'super_admin' }).first();
      if (superRole && (ids.includes(superRole.id) || await tx.orm.public.UserRole.where({ userId, roleId: superRole.id }).first())) {
        throw new ForbiddenSystemResource();
      }
      for (const id of ids) if (!await tx.orm.public.Role.where({ id }).first()) throw new BadRequestException('Role not found');
      await tx.orm.public.UserRole.where({ userId }).deleteAndCount();
      for (const roleId of ids) await tx.orm.public.UserRole.create({ id: randomUUID(), userId, roleId });
      return { ids };
    });
  }
}

class ForbiddenSystemResource extends ConflictException {
  constructor() { super('System role or permission is protected'); }
}

import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES } from '../dist/access-control/access.constants.js';

const [command, userId] = process.argv.slice(2);
if (!['seed', 'bootstrap'].includes(command) || (command === 'bootstrap' && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId ?? ''))) {
  throw new Error('Usage: pnpm rbac:seed OR pnpm rbac:bootstrap <existing-user-uuid>');
}
const prisma = new PrismaService();
const db = prisma.db;
try {
  await db.transaction(async (tx) => {
    // Serialize seed/bootstrap across processes; never expose bootstrap over HTTP.
    await tx.query(db.raw.sql`SELECT pg_advisory_xact_lock(734928100) IS NULL AS "locked"`.returnsRow({ locked: 'pg/bool@1' }).build());
    if (command === 'seed') {
      const now = new Date().toISOString();
      for (const key of SYSTEM_PERMISSIONS) {
        const existing = await tx.orm.public.Permission.where({ key }).first();
        if (!existing) await tx.orm.public.Permission.create({ id: randomUUID(), key, isRequired: true, description: null, createdAt: now, updatedAt: now });
        else if (!existing.isRequired) await tx.orm.public.Permission.where({ id: existing.id }).update({ isRequired: true, updatedAt: now });
      }
      for (const name of SYSTEM_ROLES) {
        if (!await tx.orm.public.Role.where({ name }).first()) {
          const role = await tx.orm.public.Role.create({ id: randomUUID(), name, isRequired: true, description: null, createdAt: now, updatedAt: now });
          if (name === 'admin') {
            for (const key of SYSTEM_PERMISSIONS.filter((value) => value.endsWith('.view'))) {
              const permission = await tx.orm.public.Permission.where({ key }).first();
              if (!permission) throw new Error('Seed permission missing');
              await tx.orm.public.RolePermission.create({ id: randomUUID(), roleId: role.id, permissionId: permission.id });
            }
          }
        } else await tx.orm.public.Role.where({ name }).update({ isRequired: true });
      }
      return;
    }
    const user = await tx.orm.public.User.where({ id: userId }).first();
    if (!user) throw new Error('User not found');
    const role = await tx.orm.public.Role.where({ name: 'super_admin' }).first();
    if (!role) throw new Error('Run rbac:seed first');
    if (await tx.orm.public.UserRole.where({ roleId: role.id }).first()) throw new Error('A super administrator already exists');
    await tx.orm.public.UserRole.create({ id: randomUUID(), roleId: role.id, userId });
  });
  console.log(command === 'seed' ? 'RBAC seed complete' : 'Initial super administrator assigned');
} finally {
  await prisma.onApplicationShutdown();
}

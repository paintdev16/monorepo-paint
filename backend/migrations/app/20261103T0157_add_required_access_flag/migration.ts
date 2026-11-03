#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/41ef212cbb99ab9848b71440ef657f90a6b739e60328d01ebfe832fc6ee0ef21/contract';
import startContract from '../../snapshots/41ef212cbb99ab9848b71440ef657f90a6b739e60328d01ebfe832fc6ee0ef21/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/7440cfd67ab41999f99308312ccea3beffd2142fe285ad7284f8ce6c267593e0/contract';
import endContract from '../../snapshots/7440cfd67ab41999f99308312ccea3beffd2142fe285ad7284f8ce6c267593e0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';

const { sql: db, contract } = postgres({ contract: contractFromJson<End>(endContract) });
const protectedRoles = ['super_admin', 'admin', 'client'];
const protectedPermissions = ['users', 'roles', 'permissions'].flatMap((resource) => ['view', 'create', 'update', 'delete'].map((action) => `${resource}.${action}`));
const removedPermissions = ['orders.view', 'orders.create', 'orders.update', 'orders.delete'];

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Permission',
        column: col('isRequired', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Role',
        column: col('isRequired', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      ...protectedRoles.map((name) => this.dataTransform(contract, `require-role-${name}`, {
        check: () => db.public.Role.select('id').where((f, fn) => fn.eq(f.name, name)).where((f, fn) => fn.eq(f.isRequired, false)).limit(1),
        run: () => db.public.Role.update({ isRequired: true }).where((f, fn) => fn.eq(f.name, name)),
      })),
      ...protectedPermissions.map((key) => this.dataTransform(contract, `require-permission-${key}`, {
        check: () => db.public.Permission.select('id').where((f, fn) => fn.eq(f.key, key)).where((f, fn) => fn.eq(f.isRequired, false)).limit(1),
        run: () => db.public.Permission.update({ isRequired: true }).where((f, fn) => fn.eq(f.key, key)),
      })),
      ...removedPermissions.map((key) => this.dataTransform(contract, `remove-permission-${key}`, {
        check: () => db.public.Permission.select('id').where((f, fn) => fn.eq(f.key, key)).limit(1),
        run: () => db.public.Permission.delete().where((f, fn) => fn.eq(f.key, key)),
      })),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

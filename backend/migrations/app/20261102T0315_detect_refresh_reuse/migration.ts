#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/314de7a79e2a12b8661fa442983df9841d909ec4de14617c5dd5a4b95672b279/contract';
import startContract from '../../snapshots/314de7a79e2a12b8661fa442983df9841d909ec4de14617c5dd5a4b95672b279/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8870d2952100bc6c88841d0297fd86993420012c26ea0304899003a807bf7917/contract';
import endContract from '../../snapshots/8870d2952100bc6c88841d0297fd86993420012c26ea0304899003a807bf7917/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'UsedRefreshToken',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sessionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'AuthSession',
        column: col('familyId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'AuthSession',
        column: col('revocationReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'AuthSession',
        column: col('revokedAt', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'UsedRefreshToken',
        constraint: 'UsedRefreshToken_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuthSession',
        index: 'AuthSession_familyId_idx_3d03045e',
        columns: ['familyId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UsedRefreshToken',
        index: 'UsedRefreshToken_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'UsedRefreshToken',
        foreignKey: {
          name: 'UsedRefreshToken_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'AuthSession', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

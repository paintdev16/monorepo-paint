#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/47e37d55f177da50a82b669f5f6eed155208401d181dd97fd42fac7d95188b2d/contract';
import endContract from '../../snapshots/47e37d55f177da50a82b669f5f6eed155208401d181dd97fd42fac7d95188b2d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8870d2952100bc6c88841d0297fd86993420012c26ea0304899003a807bf7917/contract';
import startContract from '../../snapshots/8870d2952100bc6c88841d0297fd86993420012c26ea0304899003a807bf7917/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'LoginAttempt',
        columns: [
          col('accountKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('failedAttempts', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastFailedAt', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lockedUntil', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['accountKey'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'LoginAttempt',
        index: 'LoginAttempt_lastFailedAt_idx_a58cb70e',
        columns: ['lastFailedAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

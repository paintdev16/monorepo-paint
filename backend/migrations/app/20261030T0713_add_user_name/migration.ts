#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/314de7a79e2a12b8661fa442983df9841d909ec4de14617c5dd5a4b95672b279/contract';
import endContract from '../../snapshots/314de7a79e2a12b8661fa442983df9841d909ec4de14617c5dd5a4b95672b279/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fb8093903576f072c5bce7129038e93245e5091d3081aefa1ea9407530fc7c39/contract';
import startContract from '../../snapshots/fb8093903576f072c5bce7129038e93245e5091d3081aefa1ea9407530fc7c39/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

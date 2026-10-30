import 'dotenv/config';
import 'temporal-polyfill/full/global';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d.js';
import contractJson from './contract.json' with { type: 'json' };

const contract = contractFromJson<Contract>(contractJson);

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  private client?: ReturnType<typeof createClient>;

  get db() {
    if (!this.client) {
      const url = process.env.DATABASE_URL;
      if (!url) throw new Error('DATABASE_URL is required to use PostgreSQL');
      this.client = createClient(url);
    }
    return this.client;
  }

  async onApplicationShutdown() {
    await this.client?.close();
  }
}

function createClient(url: string) {
  return postgres({ contract, url });
}

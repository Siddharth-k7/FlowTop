import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Env } from '../../config/env.validation';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * The database client. Inject it into repositories only: services and
 * controllers never touch Prisma directly.
 *
 * Connects lazily on the first query, so the API can boot and report an
 * unhealthy database through /health instead of crashing.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

import { PrismaPg } from '@prisma/adapter-pg';
import { PasswordHasher } from '../auth/password-hasher';
import { PrismaClient } from '../generated/prisma/client';
import { SETTING_SEEDS } from '../settings/setting-definitions';
import { seedMissingSettings } from '../settings/settings.repository';
import { syncPermissionsAndRoles } from './seed-permissions';

/**
 * Seeds what every environment needs:
 * - the permission list and the three v1 roles, from src/auth/permissions.ts
 *   (adds, updates and removes until the database matches the code)
 * - any missing setting keys (existing settings are never overwritten)
 * - optionally, a super admin, when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD
 *   are set (an existing user is never overwritten)
 *
 * Safe to run again. Compiled into dist/, so it runs in the production image:
 *   development: npm run db:seed
 *   staging:     node dist/database/seed.cli.js
 */
export async function seedFromEnvironment(env: NodeJS.ProcessEnv, log: (line: string) => void): Promise<void> {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. See .env.example.');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

  try {
    await syncPermissionsAndRoles(prisma, log);
    const added = await seedMissingSettings(prisma, SETTING_SEEDS);
    log(`  settings: ${added} missing key(s) added, existing values left unchanged`);
    await createAdminIfRequested(prisma, env, log);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdminIfRequested(prisma: PrismaClient, env: NodeJS.ProcessEnv, log: (line: string) => void): Promise<void> {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    log('  no SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD set, skipping the admin user');
    return;
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    log(`  admin ${email} already exists, left unchanged`);
    return;
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
  await prisma.user.create({
    data: {
      name: env.SEED_ADMIN_NAME?.trim() || 'Flowtop Admin',
      email,
      passwordHash: await new PasswordHasher().hash(password),
      roles: { create: { roleId: role.id } },
    },
  });
  log(`  created super_admin ${email}`);
}

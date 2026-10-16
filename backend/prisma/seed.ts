/**
 * Seeds what every environment needs: the permission list and the three v1 roles,
 * plus any missing setting keys (existing settings are never overwritten),
 * taken from src/auth/permissions.ts, the single source of truth. Safe to run
 * again: it adds, updates and removes until the database matches the code.
 *
 * Optionally creates a super admin to log in with, when SEED_ADMIN_EMAIL and
 * SEED_ADMIN_PASSWORD are set. It never overwrites an existing user.
 *
 *   npm run db:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PasswordHasher } from '../src/auth/password-hasher';
import { PrismaClient } from '../src/generated/prisma/client';
import { SETTING_SEEDS } from '../src/settings/setting-definitions';
import { seedMissingSettings } from '../src/settings/settings.repository';
import { syncPermissionsAndRoles } from './seed-permissions';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See .env.example.');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    await syncPermissionsAndRoles(prisma, console.log);
    const added = await seedMissingSettings(prisma, SETTING_SEEDS);
    console.log(`  settings: ${added} missing key(s) added, existing values left unchanged`);
    await createAdminIfRequested(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdminIfRequested(prisma: PrismaClient): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('  no SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD set, skipping the admin user');
    return;
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    console.log(`  admin ${email} already exists, left unchanged`);
    return;
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } });
  await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME?.trim() || 'Flowtop Admin',
      email,
      passwordHash: await new PasswordHasher().hash(password),
      roles: { create: { roleId: role.id } },
    },
  });
  console.log(`  created super_admin ${email}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

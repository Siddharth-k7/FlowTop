import { PrismaService } from '../src/common/prisma/prisma.service';

/** Empties every application table. Only ever pointed at the test database. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map(({ tablename }) => `"${tablename}"`).join(', ')} CASCADE`);
  }
}

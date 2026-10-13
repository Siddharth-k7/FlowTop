import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read directly, not via env(), so `prisma generate` (run on every install,
    // including CI) works without a database. Migrate commands still need it.
    url: process.env.DATABASE_URL,
  },
});

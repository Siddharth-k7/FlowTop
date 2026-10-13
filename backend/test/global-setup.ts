import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { TEST_DATABASE_URL } from './test-env';

/** Creates the test database if it is missing, then applies every migration to it. */
export default async function globalSetup(): Promise<void> {
  const target = new URL(TEST_DATABASE_URL);
  const databaseName = target.pathname.slice(1);
  if (!/^\w+$/.test(databaseName)) {
    throw new Error(`Refusing to use test database name "${databaseName}"`);
  }

  const maintenance = new URL(TEST_DATABASE_URL);
  maintenance.pathname = '/postgres';
  const client = new Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'ignore',
  });
}

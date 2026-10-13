import { config } from 'dotenv';

// Lets a developer keep TEST_DATABASE_URL in backend/.env. Real environment variables (CI) win.
config({ quiet: true });

/**
 * The e2e suites run against a real Postgres, in a separate database from
 * development, because they wipe it between tests. There is no fallback
 * connection string in source: set TEST_DATABASE_URL (see .env.example).
 */
export const TEST_DATABASE_URL = requireTestDatabaseUrl();

function requireTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set. Add it to backend/.env; see .env.example.');
  }
  const databaseName = new URL(url).pathname.slice(1);
  if (!/^\w*test\w*$/.test(databaseName)) {
    throw new Error(`TEST_DATABASE_URL must name a test database (got "${databaseName}"). The e2e suites wipe it.`);
  }
  return url;
}

/**
 * The e2e suites run against a real Postgres, in a separate database from
 * development so tests can wipe it freely. Start it with `docker compose up -d`.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://flowtop:flowtop@localhost:5433/flowtop_test';

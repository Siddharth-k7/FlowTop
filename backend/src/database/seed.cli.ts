// Entry point for the seed: `node dist/database/seed.cli.js` in staging and production.
// The admin password comes from the environment for this one run; it is never logged.
import 'dotenv/config';
import { seedFromEnvironment } from './seed';

seedFromEnvironment(process.env, (line) => console.log(line)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

// `npm run db:seed` in development. The seed itself lives in src/database/seed.ts so it is
// compiled into dist/ and can run in the production image too.
import '../src/database/seed.cli';

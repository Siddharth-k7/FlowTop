import { randomBytes, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TEST_DATABASE_URL } from './test-env';

// Config is validated when AppModule is imported, so the e2e environment is set before any test file loads.
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
process.env.ADMIN_URL = 'http://localhost:3001';
// Fresh keys per test run, so no key-shaped literal lives in source.
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString('base64');

// Local storage in a throwaway folder per test file.
process.env.MEDIA_STORAGE_DRIVER = 'local';
process.env.MEDIA_LOCAL_DIR = join(tmpdir(), `flowtop-media-test-${randomUUID()}`);
process.env.MEDIA_PUBLIC_BASE_URL = 'http://localhost:4000/api/v1/files/public';
process.env.MEDIA_LOCAL_PRIVATE_BASE_URL = 'http://localhost:4000/api/v1/files/private';
process.env.MEDIA_URL_SIGNING_KEY = randomBytes(32).toString('base64');

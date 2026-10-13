import { TEST_DATABASE_URL } from './test-env';

// Config is validated when AppModule is imported, so the e2e environment is set before any test file loads.
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
process.env.ADMIN_URL = 'http://localhost:3001';
// A fixed key for tests only. Never use it anywhere else.
process.env.MFA_ENCRYPTION_KEY = 'dGVzdC1vbmx5LWtleS1kby1ub3QtdXNlLWFueXdoZXI=';

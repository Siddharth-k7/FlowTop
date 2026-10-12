// Config is validated when AppModule is imported, so the e2e environment is set before any test file loads.
// The database URL is never connected to: tests replace the repositories that would use it.
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/flowtop_test';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

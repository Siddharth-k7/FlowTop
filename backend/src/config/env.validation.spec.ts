import { randomBytes, randomUUID } from 'node:crypto';
import { NodeEnv, validateEnv } from './env.validation';

// Secret-shaped values are generated per run, so none lives in source.
const fakeSecret = `fake-${randomUUID()}`;

const validEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: `postgresql://test-user:${fakeSecret}@localhost:5432/flowtop`,
  CORS_ORIGINS: 'http://localhost:3000, http://localhost:3001',
  ADMIN_URL: 'http://localhost:3001',
  MFA_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  MEDIA_STORAGE_DRIVER: 'local',
  MEDIA_PUBLIC_BASE_URL: 'http://localhost:4000/api/v1/files/public',
  MEDIA_LOCAL_DIR: '.media',
  MEDIA_LOCAL_PRIVATE_BASE_URL: 'http://localhost:4000/api/v1/files/private',
  MEDIA_URL_SIGNING_KEY: randomBytes(32).toString('base64'),
};

const s3Env = {
  ...validEnv,
  MEDIA_STORAGE_DRIVER: 's3',
  MEDIA_PUBLIC_BASE_URL: 'https://cdn.example.com',
  MEDIA_LOCAL_DIR: undefined,
  MEDIA_LOCAL_PRIVATE_BASE_URL: undefined,
  MEDIA_URL_SIGNING_KEY: undefined,
  S3_REGION: 'ap-south-1',
  S3_PUBLIC_BUCKET: 'flowtop-public',
  S3_PRIVATE_BUCKET: 'flowtop-private',
};

describe('validateEnv: media storage', () => {
  it('needs only the s3 settings with the s3 driver, and credentials are optional', () => {
    expect(validateEnv(s3Env).S3_PRIVATE_BUCKET).toBe('flowtop-private');
  });

  it.each(['S3_REGION', 'S3_PUBLIC_BUCKET', 'S3_PRIVATE_BUCKET'])('s3 driver fails fast without %s', (key) => {
    expect(() => validateEnv({ ...s3Env, [key]: undefined })).toThrow(new RegExp(key));
  });

  it('reads S3_FORCE_PATH_STYLE=false as false, not as a truthy string', () => {
    expect(validateEnv({ ...s3Env, S3_FORCE_PATH_STYLE: 'false' }).S3_FORCE_PATH_STYLE).toBe(false);
    expect(validateEnv({ ...s3Env, S3_FORCE_PATH_STYLE: 'true' }).S3_FORCE_PATH_STYLE).toBe(true);
  });

  it('refuses the local driver in production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(/must be s3 in production/);
    expect(validateEnv({ ...s3Env, NODE_ENV: 'production' }).NODE_ENV).toBe(NodeEnv.PRODUCTION);
  });
});

describe('validateEnv', () => {
  it('accepts a complete environment and converts types', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe(NodeEnv.DEVELOPMENT);
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });

  it.each(Object.keys(validEnv))('fails fast when %s is missing', (key) => {
    const env: Record<string, unknown> = { ...validEnv };
    delete env[key];

    expect(() => validateEnv(env)).toThrow(new RegExp(key));
  });

  it('rejects an unknown NODE_ENV, so production can never fall back to development behaviour', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'prod' })).toThrow(/NODE_ENV/);
  });

  it('rejects a DATABASE_URL that is not a postgres connection string', () => {
    expect(() => validateEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/flowtop' })).toThrow(/DATABASE_URL/);
  });

  it('defaults TRUST_PROXY_HOPS to 0 and converts it when set', () => {
    expect(validateEnv(validEnv).TRUST_PROXY_HOPS).toBe(0);
    expect(validateEnv({ ...validEnv, TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS).toBe(1);
  });

  it('rejects an MFA key that is not 32 base64 bytes', () => {
    expect(() => validateEnv({ ...validEnv, MFA_ENCRYPTION_KEY: 'too-short' })).toThrow(/MFA_ENCRYPTION_KEY/);
  });

  it('rejects a CORS origin that is not a URL', () => {
    expect(() => validateEnv({ ...validEnv, CORS_ORIGINS: 'http://localhost:3000,*' })).toThrow(/CORS_ORIGINS/);
  });

  it('never includes a variable value in the error message', () => {
    const run = () => validateEnv({ ...validEnv, PORT: fakeSecret, DATABASE_URL: `mysql://u:${fakeSecret}@h/db` });

    expect(run).toThrow(/PORT/);
    expect(run).toThrow(expect.objectContaining({ message: expect.not.stringContaining(fakeSecret) as unknown }) as Error);
  });
});

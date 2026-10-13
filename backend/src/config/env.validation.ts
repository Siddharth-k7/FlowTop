import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

export enum MediaStorageDriver {
  /** Files on this machine's disk, served by the API. Development and tests only. */
  LOCAL = 'local',
  /** Any S3-compatible service: AWS S3, Cloudflare R2, MinIO. Staging and production. */
  S3 = 's3',
}

const isLocal = (env: Env) => env.MEDIA_STORAGE_DRIVER === MediaStorageDriver.LOCAL;
const isS3 = (env: Env) => env.MEDIA_STORAGE_DRIVER === MediaStorageDriver.S3;
const URL_OPTIONS = { require_tld: false, require_protocol: true };

export class Env {
  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @Matches(/^postgres(ql)?:\/\/.+/, { message: 'DATABASE_URL must be a postgresql:// connection string' })
  DATABASE_URL!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').map((origin) => origin.trim()) : value,
  )
  @IsUrl({ require_tld: false, require_protocol: true }, { each: true })
  CORS_ORIGINS!: string[];

  /** Base URL of the admin app. Password reset links point here. */
  @IsUrl({ require_tld: false, require_protocol: true })
  ADMIN_URL!: string;

  /** 32 random bytes, base64. Encrypts MFA secrets at rest. Generate with: openssl rand -base64 32 */
  @Matches(/^[A-Za-z0-9+/]{43}=$/, {
    message: 'MFA_ENCRYPTION_KEY must be 32 random bytes, base64 encoded (openssl rand -base64 32)',
  })
  MFA_ENCRYPTION_KEY!: string;

  /** Reverse proxies in front of the API. Without this, every client behind a load balancer shares one IP for rate limiting. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY_HOPS: number = 0;

  // ─── Media storage ───────────────────────────────────────────────────────
  // Two buckets: public (product photos, CDN, permanent URLs) and private
  // (customer documents, 15-minute signed URLs only). Never one bucket.

  @IsEnum(MediaStorageDriver)
  MEDIA_STORAGE_DRIVER!: MediaStorageDriver;

  /** Where public files are served from: the CDN in production. A public file's URL is this plus its key. */
  @IsUrl(URL_OPTIONS)
  MEDIA_PUBLIC_BASE_URL!: string;

  /** local driver: folder holding the public/ and private/ subfolders. */
  @ValidateIf(isLocal)
  @IsString()
  @IsNotEmpty()
  MEDIA_LOCAL_DIR?: string;

  /** local driver: base of the API route that serves private files behind a signed URL. */
  @ValidateIf(isLocal)
  @IsUrl(URL_OPTIONS)
  MEDIA_LOCAL_PRIVATE_BASE_URL?: string;

  /** local driver: 32 random bytes, base64. Signs private file URLs. */
  @ValidateIf(isLocal)
  @Matches(/^[A-Za-z0-9+/]{43}=$/, {
    message: 'MEDIA_URL_SIGNING_KEY must be 32 random bytes, base64 encoded (openssl rand -base64 32)',
  })
  MEDIA_URL_SIGNING_KEY?: string;

  @ValidateIf(isS3)
  @IsString()
  @IsNotEmpty()
  S3_REGION?: string;

  /** s3 driver: set for R2, MinIO and other non-AWS services. Leave unset for AWS. */
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  S3_ENDPOINT?: string;

  /** s3 driver: path-style URLs, needed by MinIO. */
  @IsOptional()
  // Read the raw string: implicit conversion would turn any non-empty string, "false" included, into true.
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj.S3_FORCE_PATH_STYLE;
    return raw === undefined || raw === '' ? undefined : raw === 'true' || raw === true;
  })
  @IsBoolean()
  S3_FORCE_PATH_STYLE?: boolean;

  @ValidateIf(isS3)
  @IsString()
  @IsNotEmpty()
  S3_PUBLIC_BUCKET?: string;

  @ValidateIf(isS3)
  @IsString()
  @IsNotEmpty()
  S3_PRIVATE_BUCKET?: string;

  /** s3 driver: optional. Without them the AWS SDK uses its default chain (an IAM role, for example). */
  @IsOptional()
  @IsString()
  S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  S3_SECRET_ACCESS_KEY?: string;
}

/**
 * Validates the process environment at boot. Throws, and so stops the app, on
 * any missing or malformed variable. Messages name the variable, never its value.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(Env, config, { enableImplicitConversion: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  const problems = errors.map(
    (error) => `  ${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`,
  );

  // A container's disk is wiped on every deploy, so production files must live in real buckets.
  if (env.NODE_ENV === NodeEnv.PRODUCTION && env.MEDIA_STORAGE_DRIVER === MediaStorageDriver.LOCAL) {
    problems.push('  MEDIA_STORAGE_DRIVER: must be s3 in production; local is for development and tests');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }

  return env;
}

import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUrl, Matches, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

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
}

/**
 * Validates the process environment at boot. Throws, and so stops the app, on
 * any missing or malformed variable. Messages name the variable, never its value.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(Env, config, { enableImplicitConversion: true });
  const errors = validateSync(env, { skipMissingProperties: false });

  if (errors.length > 0) {
    const problems = errors
      .map((error) => `  ${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  return env;
}

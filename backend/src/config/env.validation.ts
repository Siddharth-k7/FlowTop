import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsUrl, Matches, Max, Min, validateSync } from 'class-validator';

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

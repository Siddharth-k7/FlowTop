import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { PrismaModule } from './common/prisma/prisma.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { createValidationPipe } from './common/validation/validation.pipe';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    PrismaModule,
    RateLimitModule,
    AuditModule,
    HealthModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}

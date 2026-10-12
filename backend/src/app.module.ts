import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { PrismaModule } from './common/prisma/prisma.module';
import { createValidationPipe } from './common/validation/validation.pipe';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }), PrismaModule, HealthModule],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}

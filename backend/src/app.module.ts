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
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CollectionsModule } from './collections/collections.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JournalModule } from './journal/journal.module';
import { NavigationModule } from './navigation/navigation.module';
import { OrdersModule } from './orders/orders.module';
import { PagesModule } from './pages/pages.module';
import { PlacementsModule } from './placements/placements.module';
import { ProductsModule } from './products/products.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    PrismaModule,
    RateLimitModule,
    AuditModule,
    HealthModule,
    AuthModule,
    MediaModule,
    SettingsModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CollectionsModule,
    PlacementsModule,
    PagesModule,
    JournalModule,
    NavigationModule,
    OrdersModule,
    SubmissionsModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { SecretBox } from '../common/crypto/secret-box';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { PasswordHasher } from './password-hasher';
import { DevFilePasswordResetMailer, PasswordResetMailer } from './password-reset.mailer';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetService } from './password-reset.service';
import { PermissionGuard } from './permission.guard';
import { SessionService } from './session.service';

/**
 * Global, so any controller can use @UseGuards(AuthGuard, PermissionGuard)
 * without importing AuthModule into its own module.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    AuthGuard,
    PermissionGuard,
    SessionService,
    PasswordHasher,
    PasswordResetService,
    PasswordResetRepository,
    SecretBox,
    { provide: PasswordResetMailer, useClass: DevFilePasswordResetMailer },
  ],
  exports: [AuthGuard, PermissionGuard, SessionService, PasswordHasher, SecretBox],
})
export class AuthModule {}

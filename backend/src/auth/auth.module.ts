import { Global, Module } from '@nestjs/common';
import { SecretBox } from '../common/crypto/secret-box';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { MfaController } from './mfa/mfa.controller';
import { MfaRepository } from './mfa/mfa.repository';
import { MfaService } from './mfa/mfa.service';
import { PasswordHasher } from './password-hasher';
import { AuthMailer, DevFileAuthMailer } from './auth.mailer';
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
  controllers: [AuthController, MfaController],
  providers: [
    AuthService,
    AuthRepository,
    MfaService,
    MfaRepository,
    AuthGuard,
    PermissionGuard,
    SessionService,
    PasswordHasher,
    PasswordResetService,
    PasswordResetRepository,
    SecretBox,
    { provide: AuthMailer, useClass: DevFileAuthMailer },
  ],
  exports: [AuthGuard, PermissionGuard, SessionService, PasswordHasher, SecretBox, AuthMailer],
})
export class AuthModule {}

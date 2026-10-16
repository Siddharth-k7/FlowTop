import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../../audit';
import { SecretBox } from '../../common/crypto/secret-box';
import { ApiException } from '../../common/errors/api.exception';
import { RateLimitedException } from '../../common/errors/rate-limited.exception';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { AUTH_MESSAGES, AUTH_RATE_LIMITS, MFA_ISSUER, MFA_SETUP_TTL_MS } from '../auth.constants';
import type { AuthUser } from '../auth-user';
import { PasswordHasher } from '../password-hasher';
import { hashToken } from '../secret-token';
import { base32Encode, matchTotpStep, totpProvisioningUri } from '../totp';
import { MfaDisableDto, MfaEnabledResponse, MfaSetupResponse, SecondFactorDto } from './mfa.dto';
import { MfaRepository, MfaState } from './mfa.repository';
import { generateRecoveryCodes, hashRecoveryCode } from './recovery-codes';

@Injectable()
export class MfaService {
  constructor(
    private readonly repository: MfaRepository,
    private readonly secretBox: SecretBox,
    private readonly hasher: PasswordHasher,
    private readonly rateLimiter: RateLimiter,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * A fresh secret, held as pending until a code from it is confirmed. Nothing
   * changes for the account until then, so an abandoned setup is harmless.
   */
  async setup(user: AuthUser, password: string): Promise<MfaSetupResponse> {
    const state = await this.requireState(user.id);
    if (state.mfaEnabled) {
      throw new ApiException('CONFLICT', AUTH_MESSAGES.mfaAlreadyOn);
    }
    // A stolen session must not be enough to enrol the thief's authenticator. Wrong
    // passwords count towards the same lock as wrong codes, so this cannot be brute-forced.
    this.assertNotLocked(user.id);
    if (!(await this.hasher.verify(state.passwordHash, password))) {
      this.recordFailure(user.id);
      throw new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.mfaSetupPasswordInvalid, {
        password: AUTH_MESSAGES.mfaSetupPasswordInvalid,
      });
    }
    const secret = base32Encode(randomBytes(20));
    const expiresAt = new Date(Date.now() + MFA_SETUP_TTL_MS);
    await this.repository.savePendingSecret(user.id, this.secretBox.seal(secret), expiresAt);
    return { secret, otpauthUri: totpProvisioningUri(secret, state.email, MFA_ISSUER), expiresAt: expiresAt.toISOString() };
  }

  /** Confirms the pending secret with a code, turns MFA on, and returns recovery codes once. */
  async verify(user: AuthUser, code: string, sessionToken: string): Promise<MfaEnabledResponse> {
    const state = await this.requireState(user.id);
    if (state.mfaEnabled) {
      throw new ApiException('CONFLICT', AUTH_MESSAGES.mfaAlreadyOn);
    }
    if (!state.mfaPendingSecret || !state.mfaPendingExpiresAt || state.mfaPendingExpiresAt <= new Date()) {
      throw new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.mfaSetupExpired, { code: AUTH_MESSAGES.mfaSetupExpired });
    }
    this.assertNotLocked(user.id);
    if (!(await this.claimTotp(user.id, this.secretBox.open(state.mfaPendingSecret), code))) {
      this.recordFailure(user.id);
      throw new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.mfaCodeInvalid, { code: AUTH_MESSAGES.mfaCodeInvalid });
    }

    const recoveryCodes = generateRecoveryCodes();
    await this.prisma.$transaction(async (tx) => {
      await this.repository.enable(
        user.id,
        state.mfaPendingSecret ?? '',
        recoveryCodes.map(hashRecoveryCode),
        hashToken(sessionToken),
        tx,
      );
      await this.audit.record({ actorId: user.id, action: 'update', entityType: 'user', entityId: user.id, metadata: { mfa: 'enabled' } }, tx);
    });
    return { recoveryCodes };
  }

  /** Needs the current password and a valid code. Super admins are refused outright. */
  async disable(user: AuthUser, dto: MfaDisableDto, sessionToken: string): Promise<void> {
    const state = await this.requireState(user.id);
    if (!state.mfaEnabled || !state.mfaSecret) {
      throw new ApiException('CONFLICT', AUTH_MESSAGES.mfaNotOn);
    }
    if (state.isSuperAdmin) {
      throw new ApiException('FORBIDDEN', AUTH_MESSAGES.mfaRequiredForSuperAdmin);
    }
    assertOneFactor(dto);
    this.assertNotLocked(user.id);

    // The factor is only checked, and a recovery code only spent, once the password is right.
    const passwordOk = await this.hasher.verify(state.passwordHash, dto.password);
    const factorOk = passwordOk && (await this.spendFactor(user.id, state.mfaSecret, dto));
    if (!factorOk) {
      this.recordFailure(user.id);
      throw new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.mfaDisableInvalid, {
        password: AUTH_MESSAGES.mfaDisableInvalid,
        code: AUTH_MESSAGES.mfaDisableInvalid,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.repository.disable(user.id, hashToken(sessionToken), tx);
      await this.audit.record({ actorId: user.id, action: 'update', entityType: 'user', entityId: user.id, metadata: { mfa: 'disabled' } }, tx);
    });
  }

  /**
   * The second step of login. True when the code or recovery code is valid,
   * and it is then spent. Throws 429 while the account is locked, and 422 if
   * not exactly one factor was given.
   */
  async checkSecondFactor(userId: string, sealedSecret: string, factor: SecondFactorDto): Promise<boolean> {
    assertOneFactor(factor);
    this.assertNotLocked(userId);
    const ok = await this.spendFactor(userId, sealedSecret, factor);
    if (!ok) {
      this.recordFailure(userId);
    }
    return ok;
  }

  private async spendFactor(userId: string, sealedSecret: string, factor: SecondFactorDto): Promise<boolean> {
    if (factor.code) {
      return this.claimTotp(userId, this.secretBox.open(sealedSecret), factor.code);
    }
    return this.repository.consumeRecoveryCode(userId, hashRecoveryCode(factor.recoveryCode ?? ''));
  }

  /** Valid only for a step not used before: the same code never works twice. */
  private async claimTotp(userId: string, secret: string, code: string): Promise<boolean> {
    const step = matchTotpStep(secret, code);
    return step !== null && (await this.repository.claimTotpStep(userId, step));
  }

  private assertNotLocked(userId: string): void {
    const result = this.rateLimiter.check(lockKey(userId), AUTH_RATE_LIMITS.mfaFailuresPerUser);
    if (!result.allowed) {
      throw new RateLimitedException(result.retryAfterSeconds, AUTH_MESSAGES.mfaLocked);
    }
  }

  private recordFailure(userId: string): void {
    this.rateLimiter.hit(lockKey(userId), AUTH_RATE_LIMITS.mfaFailuresPerUser);
  }

  private async requireState(userId: string): Promise<MfaState> {
    const state = await this.repository.findState(userId);
    if (!state) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.signInRequired);
    }
    return state;
  }
}

function lockKey(userId: string): string {
  return `mfa:user:${userId}`;
}

function assertOneFactor(factor: SecondFactorDto): void {
  if (Boolean(factor.code) === Boolean(factor.recoveryCode)) {
    throw new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.mfaOneFactor, { code: AUTH_MESSAGES.mfaOneFactor });
  }
}

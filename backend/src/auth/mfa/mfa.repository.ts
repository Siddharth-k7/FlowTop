import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export interface MfaState {
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaPendingSecret: string | null;
  mfaPendingExpiresAt: Date | null;
  isSuperAdmin: boolean;
}

type Client = Prisma.TransactionClient;

@Injectable()
export class MfaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findState(userId: string): Promise<MfaState | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        passwordHash: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaPendingSecret: true,
        mfaPendingExpiresAt: true,
        roles: { where: { role: { name: 'super_admin' } }, select: { roleId: true } },
      },
    });
    if (!user) {
      return null;
    }
    const { roles, ...state } = user;
    return { ...state, isSuperAdmin: roles.length > 0 };
  }

  async savePendingSecret(userId: string, sealedSecret: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaPendingSecret: sealedSecret, mfaPendingExpiresAt: expiresAt },
    });
  }

  /**
   * Records that a TOTP step was used. Atomic: succeeds only if no equal or
   * later step was used before, so a code works once, even under a race.
   */
  async claimTotpStep(userId: string, step: number): Promise<boolean> {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, OR: [{ mfaLastUsedStep: null }, { mfaLastUsedStep: { lt: step } }] },
      data: { mfaLastUsedStep: step },
    });
    return count === 1;
  }

  /** Burns one unused recovery code. Atomic, so the same code cannot be used twice at once. */
  async consumeRecoveryCode(userId: string, codeHash: string): Promise<boolean> {
    const { count } = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return count === 1;
  }

  /**
   * Turns MFA on with the confirmed secret, replaces any recovery codes, and
   * ends every other session so a session stolen before enrolment is useless.
   */
  async enable(userId: string, sealedSecret: string, recoveryCodeHashes: string[], keepSessionHash: string, tx: Client): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: sealedSecret, mfaPendingSecret: null, mfaPendingExpiresAt: null },
    });
    await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    await tx.mfaRecoveryCode.createMany({ data: recoveryCodeHashes.map((codeHash) => ({ userId, codeHash })) });
    await tx.session.deleteMany({ where: { userId, tokenHash: { not: keepSessionHash } } });
  }

  /** Turns MFA off, forgets the secret and recovery codes, and ends every other session. */
  async disable(userId: string, keepSessionHash: string, tx: Client): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaPendingExpiresAt: null, mfaLastUsedStep: null },
    });
    await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    await tx.mfaChallenge.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId, tokenHash: { not: keepSessionHash } } });
  }
}

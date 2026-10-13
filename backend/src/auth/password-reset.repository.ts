import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface PasswordResetTokenRow {
  id: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveUserIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({ where: { email, isActive: true }, select: { id: true } });
    return user?.id ?? null;
  }

  /** Issues a new token and retires any earlier unused one, so only the latest email works. */
  async issueToken(userId: string, tokenHash: string, expiresAt: Date, now: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  findToken(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, consumedAt: true },
    });
  }

  /**
   * In one transaction: burn the token (atomically, so a replay or a race
   * loses), set the new password, end every session, and void any pending
   * MFA challenge. Returns false if the token was no longer usable.
   */
  redeemToken(tokenId: string, userId: string, passwordHash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (count !== 1) {
        return false;
      }
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.mfaChallenge.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
      return true;
    });
  }
}

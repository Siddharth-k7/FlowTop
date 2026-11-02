import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AuthUser } from './auth-user';

const AUTH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  mfaEnabled: true,
  roles: {
    orderBy: { role: { name: 'asc' } },
    select: {
      role: {
        select: { name: true, permissions: { select: { permission: { select: { key: true } } } } },
      },
    },
  },
} satisfies Prisma.UserSelect;

type AuthUserRow = Prisma.UserGetPayload<{ select: typeof AUTH_USER_SELECT }>;

export interface LoginCandidate {
  id: string;
  passwordHash: string;
  isActive: boolean;
  mfaEnabled: boolean;
}

export interface MfaChallengeRow {
  id: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
  user: { isActive: boolean; mfaSecret: string | null };
}

/** Users, sessions and MFA challenges, as the auth module needs them. */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLoginCandidate(email: string): Promise<LoginCandidate | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, isActive: true, mfaEnabled: true },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async findActiveAuthUser(userId: string): Promise<AuthUser | null> {
    const row = await this.prisma.user.findFirst({ where: { id: userId, isActive: true }, select: AUTH_USER_SELECT });
    return row ? toAuthUser(row) : null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  }

  /** The user behind a live session, or null if the session is unknown, expired, or the user is deactivated. */
  async findSessionUser(tokenHash: string, now: Date): Promise<AuthUser | null> {
    const session = await this.prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: now }, user: { isActive: true } },
      select: { user: { select: AUTH_USER_SELECT } },
    });
    return session ? toAuthUser(session.user) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }

  async createMfaChallenge(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.mfaChallenge.create({ data: { userId, tokenHash, expiresAt } });
  }

  findMfaChallenge(tokenHash: string): Promise<MfaChallengeRow | null> {
    return this.prisma.mfaChallenge.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
        user: { select: { isActive: true, mfaSecret: true } },
      },
    });
  }

  /**
   * Marks the challenge used. The WHERE clause makes this atomic: when two
   * requests race with the same mfaToken, exactly one sees count === 1.
   */
  async consumeMfaChallenge(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.mfaChallenge.updateMany({
      where: { id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    return count === 1;
  }

  /** Counts a wrong code. The challenge is burned once it reaches maxFailures. */
  async recordMfaFailure(id: string, maxFailures: number, now: Date): Promise<void> {
    const { failedAttempts } = await this.prisma.mfaChallenge.update({
      where: { id },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });
    if (failedAttempts >= maxFailures) {
      await this.prisma.mfaChallenge.updateMany({ where: { id, consumedAt: null }, data: { consumedAt: now } });
    }
  }
}

function toAuthUser(row: AuthUserRow): AuthUser {
  const permissions = new Set(row.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)));
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.roles[0]?.role.name ?? null,
    permissions: [...permissions].sort(),
    mfaEnabled: row.mfaEnabled,
    mfaSetupRequired: !row.mfaEnabled && row.roles.some(({ role }) => role.name === 'super_admin'),
  };
}

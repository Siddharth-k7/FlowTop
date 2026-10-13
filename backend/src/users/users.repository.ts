import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  mfaEnabled: true,
  createdAt: true,
  roles: { orderBy: { role: { name: 'asc' } }, select: { role: { select: { name: true } } } },
} satisfies Prisma.UserSelect;

export type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export interface NewInvitedUser {
  name: string;
  email: string;
  /** An unguessable placeholder: the user cannot log in until they set a password from the invite. */
  passwordHash: string;
  roleId: string;
  inviteTokenHash: string;
  inviteExpiresAt: Date;
}

/** Outcome of a change that could leave the system without an active super admin. */
export type GuardedChange = 'done' | 'last_super_admin';

type Client = Prisma.TransactionClient;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(page: { skip: number; take: number }, search?: string): Promise<[UserRow[], number]> {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: USER_SELECT, orderBy: [{ name: 'asc' }, { id: 'asc' }], ...page }),
      this.prisma.user.count({ where }),
    ]);
  }

  findById(id: string): Promise<UserRow | null> {
    return this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  }

  async emailTaken(email: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { email } })) > 0;
  }

  async roleIdByName(name: string): Promise<string | null> {
    return (await this.prisma.role.findUnique({ where: { name }, select: { id: true } }))?.id ?? null;
  }

  /** The user, their role and their single-use invite token, together or not at all. */
  createInvited(data: NewInvitedUser, tx: Client): Promise<UserRow> {
    return tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        roles: { create: { roleId: data.roleId } },
        passwordResetTokens: { create: { tokenHash: data.inviteTokenHash, expiresAt: data.inviteExpiresAt } },
      },
      select: USER_SELECT,
    });
  }

  /** Gives the user exactly one role. Refuses to remove the last active super admin. */
  async replaceRole(userId: string, roleId: string, roleName: string, tx: Client): Promise<GuardedChange> {
    if (roleName !== 'super_admin' && (await this.isLastActiveSuperAdmin(userId, tx))) {
      return 'last_super_admin';
    }
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.userRole.create({ data: { userId, roleId } });
    return 'done';
  }

  /**
   * Deactivates the user and ends their access at once: sessions deleted,
   * pending MFA challenges and reset or invite links voided. History stays.
   */
  async deactivate(userId: string, tx: Client): Promise<GuardedChange> {
    if (await this.isLastActiveSuperAdmin(userId, tx)) {
      return 'last_super_admin';
    }
    const now = new Date();
    await tx.user.update({ where: { id: userId }, data: { isActive: false } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.mfaChallenge.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
    await tx.passwordResetToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
    return 'done';
  }

  /**
   * Locks the super_admin role row first, so two admins demoting or
   * deactivating each other at the same moment are handled one after the
   * other, and the second sees the first's change. Without the lock both
   * could pass the count and leave nobody able to manage users.
   */
  private async isLastActiveSuperAdmin(userId: string, tx: Client): Promise<boolean> {
    await tx.$queryRaw`SELECT id FROM "role" WHERE name = 'super_admin' FOR UPDATE`;
    const activeSuperAdmins = await tx.user.findMany({
      where: { isActive: true, roles: { some: { role: { name: 'super_admin' } } } },
      select: { id: true },
    });
    return activeSuperAdmins.length === 1 && activeSuperAdmins[0].id === userId;
  }
}

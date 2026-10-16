import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit';
import { requireRecordAccess } from '../auth';
import type { AuthUser, RoleName } from '../auth';
import { AuthMailer } from '../auth/auth.mailer';
import { PasswordHasher } from '../auth/password-hasher';
import { newSecretToken } from '../auth/secret-token';
import { pageToSkipTake, paginate } from '../common/dto/pagination';
import type { Paginated } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Env } from '../config/env.validation';
import { InviteUserDto, ListUsersQuery, UserSummary } from './dto/users.dto';
import { UserRow, UsersRepository } from './users.repository';

/** Invite links last longer than password resets: the person may not see the email the same day. */
export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

const LAST_SUPER_ADMIN = 'There must always be at least one active super admin.';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly hasher: PasswordHasher,
    private readonly mailer: AuthMailer,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async list(query: ListUsersQuery): Promise<Paginated<UserSummary>> {
    const [rows, total] = await this.repository.list(pageToSkipTake(query), query.search?.trim() || undefined);
    return paginate(rows.map(toSummary), total, query);
  }

  /**
   * The route already required user:read_self. Here, the scope: your own
   * account always, anyone else's only with user:read.
   */
  async get(viewer: AuthUser, id: string): Promise<UserSummary> {
    const user = requireRecordAccess(viewer, await this.repository.findById(id), {
      allWith: ['user:read'],
      ownedBy: (me, record) => record.id === me.id,
    });
    return toSummary(user);
  }

  /**
   * Creates the account with an unusable password and emails a single-use
   * link to set one. The response says plainly whether the email went out:
   * an account that exists but was never told about is not a success.
   */
  async invite(actor: AuthUser, dto: InviteUserDto): Promise<{ user: UserSummary; inviteSent: boolean }> {
    if (await this.repository.emailTaken(dto.email)) {
      throw new ApiException('CONFLICT', 'A user with this email already exists.', {
        email: 'A user with this email already exists.',
      });
    }
    const roleId = await this.requireRoleId(dto.role);
    const passwordHash = await this.hasher.hash(randomBytes(32).toString('hex'));
    const { token, tokenHash } = newSecretToken();

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.createInvited(
        {
          name: dto.name.trim(),
          email: dto.email,
          passwordHash,
          roleId,
          inviteTokenHash: tokenHash,
          inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
        tx,
      );
      await this.audit.record(
        { actorId: actor.id, action: 'invite', entityType: 'user', entityId: created.id, metadata: { email: dto.email, role: dto.role } },
        tx,
      );
      return created;
    });

    const acceptUrl = new URL('/accept-invite', this.config.get('ADMIN_URL', { infer: true }));
    acceptUrl.searchParams.set('token', token);
    let inviteSent = true;
    try {
      await this.mailer.sendInvite(user.email, user.name, acceptUrl.toString());
    } catch (error) {
      inviteSent = false;
      this.logger.error(`Invite email to user ${user.id} failed`, error instanceof Error ? error.stack : undefined);
    }
    return { user: toSummary(user), inviteSent };
  }

  async changeRole(actor: AuthUser, id: string, role: RoleName): Promise<UserSummary> {
    if (id === actor.id) {
      throw new ApiException('FORBIDDEN', 'You cannot change your own role. Ask another super admin.');
    }
    const target = await this.requireUser(id);
    const from = target.roles[0]?.role.name ?? null;
    if (from === role && target.roles.length === 1) {
      return toSummary(target);
    }
    const roleId = await this.requireRoleId(role);

    await this.prisma.$transaction(async (tx) => {
      if ((await this.repository.replaceRole(id, roleId, role, tx)) === 'last_super_admin') {
        throw new ApiException('CONFLICT', LAST_SUPER_ADMIN);
      }
      await this.audit.record(
        { actorId: actor.id, action: 'role_change', entityType: 'user', entityId: id, metadata: { from, to: role } },
        tx,
      );
    });
    return toSummary(await this.requireUser(id));
  }

  /** Idempotent: deactivating an already inactive user changes nothing and writes no audit row. */
  async deactivate(actor: AuthUser, id: string): Promise<UserSummary> {
    if (id === actor.id) {
      throw new ApiException('FORBIDDEN', 'You cannot deactivate your own account. Ask another super admin.');
    }
    const target = await this.requireUser(id);
    if (!target.isActive) {
      return toSummary(target);
    }

    await this.prisma.$transaction(async (tx) => {
      if ((await this.repository.deactivate(id, tx)) === 'last_super_admin') {
        throw new ApiException('CONFLICT', LAST_SUPER_ADMIN);
      }
      await this.audit.record(
        { actorId: actor.id, action: 'deactivate', entityType: 'user', entityId: id, metadata: { email: target.email } },
        tx,
      );
    });
    return toSummary(await this.requireUser(id));
  }

  private async requireUser(id: string): Promise<UserRow> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new ApiException('NOT_FOUND', 'The requested record was not found.');
    }
    return user;
  }

  private async requireRoleId(role: RoleName): Promise<string> {
    const roleId = await this.repository.roleIdByName(role);
    if (!roleId) {
      // The role is valid in code but missing from the database: the seed has not run.
      throw new ApiException('VALIDATION_FAILED', 'That role is not set up yet.', { role: 'That role is not set up yet.' });
    }
    return roleId;
  }
}

function toSummary(row: UserRow): UserSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.roles[0]?.role.name ?? null,
    isActive: row.isActive,
    mfaEnabled: row.mfaEnabled,
    createdAt: row.createdAt.toISOString(),
  };
}

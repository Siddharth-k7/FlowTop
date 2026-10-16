import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import type { RoleName } from '../src/auth';
import { PasswordHasher } from '../src/auth/password-hasher';
import { base32Encode, generateTotp } from '../src/auth/totp';
import { SecretBox } from '../src/common/crypto/secret-box';
import { PrismaService } from '../src/common/prisma/prisma.service';

export interface TestAccount {
  id: string;
  email: string;
  /** "flowtop_session=..." ready for .set('Cookie', ...). */
  cookie: string;
  /** Base32 TOTP secret, when the account has MFA on. */
  mfaSecret?: string;
}

interface AccountOptions {
  email: string;
  password: string;
  name?: string;
  /**
   * Super admins get MFA by default, because IAM-04 requires it and without it
   * they are confined to the MFA setup routes. Pass false to create exactly
   * that confined super admin.
   */
  mfa?: boolean;
}

/**
 * Creates a user with one of the seeded roles and signs them in, completing
 * the MFA step when the account has MFA. Needs syncPermissionsAndRoles first.
 */
export async function createAccount(app: NestExpressApplication, role: RoleName, options: AccountOptions): Promise<TestAccount> {
  const prisma = app.get(PrismaService);
  const withMfa = options.mfa ?? role === 'super_admin';
  const mfaSecret = withMfa ? base32Encode(randomBytes(20)) : undefined;
  const { id: roleId } = await prisma.role.findUniqueOrThrow({ where: { name: role } });
  const user = await prisma.user.create({
    data: {
      name: options.name ?? role,
      email: options.email,
      passwordHash: await app.get(PasswordHasher).hash(options.password),
      mfaEnabled: withMfa,
      mfaSecret: mfaSecret ? app.get(SecretBox).seal(mfaSecret) : null,
      roles: { create: { roleId } },
    },
  });
  const cookie = await signIn(app, options.email, options.password, mfaSecret);
  return { id: user.id, email: options.email, cookie, mfaSecret };
}

/** Logs in, and completes the MFA step with a fresh code when the account needs one. */
export async function signIn(app: NestExpressApplication, email: string, password: string, mfaSecret?: string): Promise<string> {
  const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password }).expect(200);
  const body = login.body as { data: { requiresMfa: boolean; mfaToken?: string } };
  if (!body.data.requiresMfa) {
    return sessionCookie(login.headers);
  }
  if (!mfaSecret) {
    throw new Error(`${email} has MFA on, but no secret was given to sign in with`);
  }
  const mfa = await request(app.getHttpServer())
    .post('/api/v1/auth/mfa')
    .send({ mfaToken: body.data.mfaToken, code: generateTotp(mfaSecret) })
    .expect(200);
  return sessionCookie(mfa.headers);
}

function sessionCookie(headers: Record<string, unknown>): string {
  const cookies = headers['set-cookie'] as string[] | undefined;
  const session = cookies?.find((cookie) => cookie.startsWith('flowtop_session='));
  if (!session) {
    throw new Error('No session cookie was set');
  }
  return session.split(';')[0];
}

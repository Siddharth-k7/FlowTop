import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes, randomUUID } from 'node:crypto';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AUTH_MESSAGES } from '../src/auth/auth.constants';
import { PasswordHasher } from '../src/auth/password-hasher';
import { AuthMailer } from '../src/auth/auth.mailer';
import { PasswordResetService } from '../src/auth/password-reset.service';
import { hashToken } from '../src/auth/secret-token';
import { base32Encode, generateTotp } from '../src/auth/totp';
import { SecretBox } from '../src/common/crypto/secret-box';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { resetDatabase } from './database';

// Generated per run, so no password-shaped literal lives in source.
const PASSWORD = `test-only-${randomUUID()}`;
const NEW_PASSWORD = `test-only-${randomUUID()}`;
const OTHER_PASSWORD = `test-only-${randomUUID()}`;
const LOGIN = '/api/v1/auth/login';
const MFA = '/api/v1/auth/mfa';
const ME = '/api/v1/auth/me';
const LOGOUT = '/api/v1/auth/logout';
const RESET = '/api/v1/auth/password-reset';
const RESET_CONFIRM = '/api/v1/auth/password-reset/confirm';

interface LoginBody {
  data: {
    requiresMfa: boolean;
    mfaToken?: string;
    user?: { id: string; email: string; role: string | null; permissions: string[]; mfaEnabled: boolean };
  };
}

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const mailer = { sendPasswordReset: jest.fn<Promise<void>, [string, string]>(), sendInvite: jest.fn<Promise<void>, [string, string, string]>() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthMailer)
      .useValue(mailer)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    app.get(RateLimiter).clear();
    mailer.sendPasswordReset.mockReset().mockResolvedValue(undefined);
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function createUser(options: { email?: string; mfaSecret?: string; isActive?: boolean } = {}) {
    const role = await prisma.role.create({
      data: {
        // Not super_admin: this suite is about login and sessions, and a super admin without MFA
        // is confined to MFA setup (tested in mfa.e2e-spec.ts).
        name: 'marketing_admin',
        permissions: { create: [{ permission: { create: { key: 'settings:write' } } }] },
      },
    });
    return prisma.user.create({
      data: {
        name: 'Priya Nair',
        email: options.email ?? 'priya@flowtop.in',
        passwordHash: await app.get(PasswordHasher).hash(PASSWORD),
        isActive: options.isActive ?? true,
        mfaEnabled: options.mfaSecret !== undefined,
        mfaSecret: options.mfaSecret ? app.get(SecretBox).seal(options.mfaSecret) : null,
        roles: { create: { roleId: role.id } },
      },
    });
  }

  function sessionCookie(res: Response): string | undefined {
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    return cookies?.find((cookie) => cookie.startsWith('flowtop_session='));
  }

  async function signIn(email = 'priya@flowtop.in', password = PASSWORD): Promise<string> {
    const res = await http().post(LOGIN).send({ email, password }).expect(200);
    const cookie = sessionCookie(res);
    if (!cookie) throw new Error('No session cookie');
    return cookie.split(';')[0];
  }

  describe('POST /auth/login', () => {
    it('signs in with the right password: user in the body, session only in an httpOnly Secure Lax cookie', async () => {
      const user = await createUser();

      const res = await http().post(LOGIN).send({ email: 'Priya@Flowtop.in ', password: PASSWORD }).expect(200);
      const body = res.body as LoginBody;
      const cookie = sessionCookie(res) ?? '';

      expect(body.data).toEqual({
        requiresMfa: false,
        user: {
          id: user.id,
          name: 'Priya Nair',
          email: 'priya@flowtop.in',
          role: 'marketing_admin',
          permissions: ['settings:write'],
          mfaEnabled: false,
          mfaSetupRequired: false,
        },
      });
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Lax/);
      const token = cookie.split(';')[0].split('=')[1];
      expect(JSON.stringify(res.body)).not.toContain(token);
    });

    it('stores only a hash of the session token', async () => {
      await createUser();
      const token = (await signIn()).split('=')[1];

      const sessions = await prisma.session.findMany();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tokenHash).toBe(hashToken(token));
      expect(sessions[0].tokenHash).not.toContain(token);
    });

    it('rejects a wrong password with 401 and no cookie', async () => {
      await createUser();

      const res = await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: 'wrong password' }).expect(401);

      expect((res.body as ErrorBody).error).toEqual({
        code: 'UNAUTHENTICATED',
        message: AUTH_MESSAGES.invalidCredentials,
      });
      expect(sessionCookie(res)).toBeUndefined();
    });

    it('answers an unknown email exactly like a wrong password, after the same argon2 work', async () => {
      await createUser();
      const verify = jest.spyOn(app.get(PasswordHasher), 'verify');

      const wrongPassword = await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: 'nope' }).expect(401);
      expect(verify).toHaveBeenCalledTimes(1);

      const unknownEmail = await http().post(LOGIN).send({ email: 'nobody@flowtop.in', password: 'nope' }).expect(401);
      expect(verify).toHaveBeenCalledTimes(2);

      expect(unknownEmail.body).toEqual(wrongPassword.body);
      expect(sessionCookie(unknownEmail)).toBeUndefined();
    });

    it('rejects a deactivated user with the same message, even with the right password', async () => {
      await createUser({ isActive: false });

      const res = await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: PASSWORD }).expect(401);

      expect((res.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.invalidCredentials);
    });

    it('rate limits by IP: the 11th attempt in a minute gets 429 with Retry-After', async () => {
      for (let i = 0; i < 10; i += 1) {
        await http().post(LOGIN).send({ email: `nobody${i}@flowtop.in`, password: 'nope' }).expect(401);
      }

      const res = await http().post(LOGIN).send({ email: 'another@flowtop.in', password: 'nope' }).expect(429);

      expect((res.body as ErrorBody).error.code).toBe('RATE_LIMITED');
      expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('rate limits by email: after 5 failures even the right password is refused', async () => {
      await createUser();
      for (let i = 0; i < 5; i += 1) {
        await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: 'wrong' }).expect(401);
      }

      await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: PASSWORD }).expect(429);
    });

    it('rejects a malformed body with 422 and never reaches the database', async () => {
      const res = await http().post(LOGIN).send({ email: 'not-an-email', password: PASSWORD, role: 'super_admin' });

      expect(res.status).toBe(422);
      expect(Object.keys((res.body as ErrorBody).error.fields ?? {}).sort()).toEqual(['email', 'role']);
    });
  });

  describe('MFA login', () => {
    const secret = base32Encode(randomBytes(20));

    async function startMfaLogin(): Promise<string> {
      const res = await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: PASSWORD }).expect(200);
      const body = res.body as LoginBody;
      expect(body.data).toEqual({ requiresMfa: true, mfaToken: expect.any(String) as string });
      expect(sessionCookie(res)).toBeUndefined();
      return body.data.mfaToken ?? '';
    }

    beforeEach(async () => {
      await createUser({ mfaSecret: secret });
    });

    it('stores the TOTP secret encrypted, never in plain text', async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: 'priya@flowtop.in' } });

      expect(user.mfaSecret).not.toContain(secret);
    });

    it('a password alone is not enough: no session until the code is verified', async () => {
      await startMfaLogin();

      expect(await prisma.session.count()).toBe(0);
    });

    it('signs in with a valid code', async () => {
      const mfaToken = await startMfaLogin();

      const res = await http().post(MFA).send({ mfaToken, code: generateTotp(secret) }).expect(200);

      expect((res.body as LoginBody).data.user?.mfaEnabled).toBe(true);
      expect(sessionCookie(res)).toMatch(/HttpOnly/);
    });

    it('rejects a replayed mfaToken, even with a valid code', async () => {
      const mfaToken = await startMfaLogin();
      await http().post(MFA).send({ mfaToken, code: generateTotp(secret) }).expect(200);

      const replay = await http().post(MFA).send({ mfaToken, code: generateTotp(secret) }).expect(401);

      expect((replay.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaChallengeInvalid);
      expect(sessionCookie(replay)).toBeUndefined();
      expect(await prisma.session.count()).toBe(1);
    });

    it('lets exactly one of two simultaneous uses of the same mfaToken through', async () => {
      const mfaToken = await startMfaLogin();
      const code = generateTotp(secret);

      const results = await Promise.all([
        http().post(MFA).send({ mfaToken, code }),
        http().post(MFA).send({ mfaToken, code }),
      ]);

      expect(results.map((res) => res.status).sort()).toEqual([200, 401]);
      expect(await prisma.session.count()).toBe(1);
    });

    it('rejects a wrong code, and burns the mfaToken after 5 wrong codes', async () => {
      const mfaToken = await startMfaLogin();
      const wrong = generateTotp(secret) === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i += 1) {
        const res = await http().post(MFA).send({ mfaToken, code: wrong }).expect(401);
        expect((res.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaCodeInvalid);
      }

      await http().post(MFA).send({ mfaToken, code: generateTotp(secret) }).expect(401);
    });

    it('rejects an expired mfaToken', async () => {
      const mfaToken = await startMfaLogin();
      await prisma.mfaChallenge.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

      await http().post(MFA).send({ mfaToken, code: generateTotp(secret) }).expect(401);
    });

    it('rejects a made-up mfaToken', async () => {
      await http().post(MFA).send({ mfaToken: 'made-up', code: generateTotp(secret) }).expect(401);
    });
  });

  describe('sessions: GET /auth/me and POST /auth/logout', () => {
    it('returns the user for a live session', async () => {
      await createUser();
      const cookie = await signIn();

      const res = await http().get(ME).set('Cookie', cookie).expect(200);

      expect((res.body as LoginBody).data.user?.email).toBe('priya@flowtop.in');
    });

    it('rejects no session, a forged session and an expired session with 401', async () => {
      await createUser();
      const cookie = await signIn();

      await http().get(ME).expect(401);
      await http().get(ME).set('Cookie', 'flowtop_session=forged').expect(401);

      await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
      const res = await http().get(ME).set('Cookie', cookie).expect(401);
      expect((res.body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
    });

    it('ends the session on the server at once when the user is deactivated', async () => {
      const user = await createUser();
      const cookie = await signIn();

      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

      await http().get(ME).set('Cookie', cookie).expect(401);
    });

    it('logout deletes the session server side and clears the cookie', async () => {
      await createUser();
      const cookie = await signIn();

      const res = await http().post(LOGOUT).set('Cookie', cookie).expect(204);

      expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
      await http().get(ME).set('Cookie', cookie).expect(401);
      expect(await prisma.session.count()).toBe(0);
    });
  });

  describe('password reset', () => {
    /** The reset request finishes in the background; wait for it before asserting. */
    async function requestReset(email: string): Promise<Response> {
      const spy = jest.spyOn(app.get(PasswordResetService), 'request');
      const res = await http().post(RESET).send({ email }).expect(202);
      await (spy.mock.results[0].value as Promise<void>);
      spy.mockRestore();
      return res;
    }

    function tokenFromEmail(call = 0): string {
      const url = new URL(mailer.sendPasswordReset.mock.calls[call][1]);
      return url.searchParams.get('token') ?? '';
    }

    it('emails a reset link for a known account and stores only the token hash', async () => {
      await createUser();

      const res = await requestReset('priya@flowtop.in');

      expect(res.body).toEqual({ data: { message: AUTH_MESSAGES.resetRequested } });
      expect(mailer.sendPasswordReset).toHaveBeenCalledWith(
        'priya@flowtop.in',
        expect.stringMatching(/^http:\/\/localhost:3001\/reset-password\?token=/) as string,
      );
      const stored = await prisma.passwordResetToken.findFirstOrThrow();
      expect(stored.tokenHash).toBe(hashToken(tokenFromEmail()));
      expect(stored.expiresAt.getTime() - stored.createdAt.getTime()).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
    });

    it('answers an unknown email identically and sends nothing', async () => {
      await createUser();

      const known = await requestReset('priya@flowtop.in');
      const unknown = await requestReset('nobody@flowtop.in');

      expect(unknown.status).toBe(known.status);
      expect(unknown.body).toEqual(known.body);
      expect(mailer.sendPasswordReset).toHaveBeenCalledTimes(1);
    });

    it('sets the new password, ends existing sessions, and refuses the old password', async () => {
      await createUser();
      const oldSession = await signIn();
      await requestReset('priya@flowtop.in');

      await http().post(RESET_CONFIRM).send({ token: tokenFromEmail(), password: NEW_PASSWORD }).expect(204);

      await http().get(ME).set('Cookie', oldSession).expect(401);
      await http().post(LOGIN).send({ email: 'priya@flowtop.in', password: PASSWORD }).expect(401);
      await signIn('priya@flowtop.in', NEW_PASSWORD);
    });

    it('rejects an expired reset token', async () => {
      await createUser();
      await requestReset('priya@flowtop.in');
      await prisma.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

      const res = await http()
        .post(RESET_CONFIRM)
        .send({ token: tokenFromEmail(), password: NEW_PASSWORD })
        .expect(422);

      expect((res.body as ErrorBody).error.fields).toEqual({ token: AUTH_MESSAGES.resetTokenInvalid });
      await signIn();
    });

    it('rejects a reset token used a second time', async () => {
      await createUser();
      await requestReset('priya@flowtop.in');
      const token = tokenFromEmail();
      await http().post(RESET_CONFIRM).send({ token, password: NEW_PASSWORD }).expect(204);

      await http().post(RESET_CONFIRM).send({ token, password: OTHER_PASSWORD }).expect(422);
      await signIn('priya@flowtop.in', NEW_PASSWORD);
    });

    it('retires an earlier token when a new one is requested', async () => {
      await createUser();
      await requestReset('priya@flowtop.in');
      await requestReset('priya@flowtop.in');

      await http().post(RESET_CONFIRM).send({ token: tokenFromEmail(0), password: NEW_PASSWORD }).expect(422);
      await http().post(RESET_CONFIRM).send({ token: tokenFromEmail(1), password: NEW_PASSWORD }).expect(204);
    });

    it('rejects a password shorter than 12 characters', async () => {
      const res = await http().post(RESET_CONFIRM).send({ token: 'anything', password: 'short' }).expect(422);

      expect((res.body as ErrorBody).error.fields).toHaveProperty('password');
    });
  });
});

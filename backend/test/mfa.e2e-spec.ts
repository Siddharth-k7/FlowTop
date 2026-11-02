import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request, { Response } from 'supertest';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { RoleName } from '../src/auth';
import { AUTH_MESSAGES } from '../src/auth/auth.constants';
import type { MfaEnabledResponse, MfaSetupResponse } from '../src/auth/mfa/mfa.dto';
import { hashRecoveryCode } from '../src/auth/mfa/recovery-codes';
import { generateTotp } from '../src/auth/totp';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { resetDatabase } from './database';
import { createAccount } from './accounts';

const PASSWORD = `test-only-${randomUUID()}`;
const SETUP = '/api/v1/auth/mfa/setup';
const VERIFY = '/api/v1/auth/mfa/verify';
const DISABLE = '/api/v1/auth/mfa/disable';
const LOGIN = '/api/v1/auth/login';
const LOGIN_MFA = '/api/v1/auth/mfa';

/**
 * Each TOTP time step works once per account (replay protection). Tests that
 * use several codes take them from successive steps, -1, 0, +1, each computed
 * just before use, the way a person waits for the next code.
 */
const codeAt = (secret: string, stepOffset: number) => generateTotp(secret, Date.now() + stepOffset * 30_000);

interface Account {
  id: string;
  email: string;
  cookie: string;
}

describe('MFA enrolment (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await syncPermissionsAndRoles(prisma);
    app.get(RateLimiter).clear();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const sessionOf = (res: Response) => (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];

  async function account(role: RoleName = 'product_manager'): Promise<Account> {
    const { id, email, cookie } = await createAccount(app, role, {
      email: `${role}-${randomUUID().slice(0, 8)}@flowtop.in`,
      password: PASSWORD,
      mfa: false,
    });
    return { id, email, cookie };
  }

  /** Runs setup and verify through the API, using the previous step's code. */
  async function enrol(who: Account): Promise<{ secret: string; recoveryCodes: string[] }> {
    const setup = await http().post(SETUP).set('Cookie', who.cookie).send({ password: PASSWORD }).expect(200);
    const { secret } = (setup.body as { data: MfaSetupResponse }).data;
    const verify = await http().post(VERIFY).set('Cookie', who.cookie).send({ code: codeAt(secret, -1) }).expect(200);
    return { secret, recoveryCodes: (verify.body as { data: MfaEnabledResponse }).data.recoveryCodes };
  }

  async function startLogin(email: string): Promise<string> {
    const res = await http().post(LOGIN).send({ email, password: PASSWORD }).expect(200);
    const body = res.body as { data: { requiresMfa: boolean; mfaToken?: string } };
    expect(body.data.requiresMfa).toBe(true);
    return body.data.mfaToken ?? '';
  }

  describe('POST /auth/mfa/setup', () => {
    it('returns a secret and an otpauth URI, stores the secret encrypted, and changes nothing yet', async () => {
      const priya = await account();

      const res = await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);
      const data = (res.body as { data: MfaSetupResponse }).data;

      expect(data.secret).toMatch(/^[A-Z2-7]{32}$/);
      expect(data.otpauthUri).toBe(
        `otpauth://totp/Flowtop%3A${encodeURIComponent(priya.email)}?secret=${data.secret}&issuer=Flowtop&algorithm=SHA1&digits=6&period=30`,
      );
      expect(res.headers['cache-control']).toBe('no-store');

      const user = await prisma.user.findUniqueOrThrow({ where: { id: priya.id } });
      expect(user.mfaEnabled).toBe(false);
      expect(user.mfaSecret).toBeNull();
      expect(user.mfaPendingSecret).not.toContain(data.secret);
    });

    it('needs a session', async () => {
      await http().post(SETUP).expect(401);
    });

    it('refuses while MFA is already on, so a secret cannot be swapped silently', async () => {
      const priya = await account();
      await enrol(priya);

      const res = await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(409);
      expect((res.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaAlreadyOn);
    });
  });

  describe('POST /auth/mfa/verify', () => {
    it('turns MFA on with a correct code and returns 8 recovery codes, stored only as hashes', async () => {
      const priya = await account();
      const setup = await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);
      const { secret } = (setup.body as { data: MfaSetupResponse }).data;

      const res = await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: codeAt(secret, 0) }).expect(200);
      const { recoveryCodes } = (res.body as { data: MfaEnabledResponse }).data;

      expect(res.headers['cache-control']).toBe('no-store');
      expect(recoveryCodes).toHaveLength(8);
      expect(new Set(recoveryCodes).size).toBe(8);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: priya.id } });
      expect(user).toMatchObject({ mfaEnabled: true, mfaPendingSecret: null });
      expect(user.mfaSecret).not.toContain(secret);

      const stored = await prisma.mfaRecoveryCode.findMany({ where: { userId: priya.id } });
      expect(stored.map((row) => row.codeHash).sort()).toEqual(recoveryCodes.map(hashRecoveryCode).sort());
      const dump = JSON.stringify(stored);
      for (const code of recoveryCodes) {
        expect(dump).not.toContain(code.replace(/-/g, ''));
      }
      expect(await prisma.auditEvent.findFirst({ where: { entityId: priya.id } })).toMatchObject({
        actorId: priya.id,
        action: 'update',
        metadata: { mfa: 'enabled' },
      });
    });

    it('shows recovery codes once: nothing returns them again', async () => {
      const priya = await account();
      const { recoveryCodes } = await enrol(priya);

      const again = await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: '123456' }).expect(409);
      const me = await http().get('/api/v1/auth/me').set('Cookie', priya.cookie).expect(200);

      for (const body of [again.body, me.body]) {
        expect(JSON.stringify(body)).not.toContain(recoveryCodes[0]);
      }
    });

    it('rejects a wrong code and leaves MFA off', async () => {
      const priya = await account();
      await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);

      const res = await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: '000000' }).expect(422);

      expect((res.body as ErrorBody).error.fields).toEqual({ code: AUTH_MESSAGES.mfaCodeInvalid });
      expect((await prisma.user.findUniqueOrThrow({ where: { id: priya.id } })).mfaEnabled).toBe(false);
    });

    it('rejects a setup older than 15 minutes, or one never started', async () => {
      const priya = await account();
      const setup = await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);
      const { secret } = (setup.body as { data: MfaSetupResponse }).data;
      await prisma.user.update({ where: { id: priya.id }, data: { mfaPendingExpiresAt: new Date(Date.now() - 1000) } });

      await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: codeAt(secret, 0) }).expect(422);

      const ravi = await account();
      await http().post(VERIFY).set('Cookie', ravi.cookie).send({ code: '123456' }).expect(422);
    });

    it('ends every other session when MFA is turned on, keeping the current one', async () => {
      const priya = await account();
      const otherDevice = sessionOf(await http().post(LOGIN).send({ email: priya.email, password: PASSWORD }).expect(200));

      await enrol(priya);

      await http().get('/api/v1/auth/me').set('Cookie', otherDevice).expect(401);
      await http().get('/api/v1/auth/me').set('Cookie', priya.cookie).expect(200);
    });
  });

  describe('login with MFA on', () => {
    it('accepts a recovery code instead of a code, typed loosely, and only once', async () => {
      const priya = await account();
      const { recoveryCodes } = await enrol(priya);
      const typed = recoveryCodes[3].toLowerCase().replace(/-/g, ' ');

      const first = await startLogin(priya.email);
      await http().post(LOGIN_MFA).send({ mfaToken: first, recoveryCode: typed }).expect(200);

      const second = await startLogin(priya.email);
      await http().post(LOGIN_MFA).send({ mfaToken: second, recoveryCode: recoveryCodes[3] }).expect(401);
      expect((await prisma.mfaRecoveryCode.findFirstOrThrow({ where: { codeHash: hashRecoveryCode(recoveryCodes[3]) } })).usedAt).not.toBeNull();
    });

    it('refuses the same TOTP code a second time, even in a new login', async () => {
      const priya = await account();
      const { secret } = await enrol(priya);
      const code = codeAt(secret, 0);

      const firstToken = await startLogin(priya.email);
      await http().post(LOGIN_MFA).send({ mfaToken: firstToken, code }).expect(200);
      const secondToken = await startLogin(priya.email);
      const replay = await http().post(LOGIN_MFA).send({ mfaToken: secondToken, code }).expect(401);

      expect((replay.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaCodeInvalid);
    });

    it('needs exactly one of code or recoveryCode', async () => {
      const priya = await account();
      const { secret, recoveryCodes } = await enrol(priya);
      const mfaToken = await startLogin(priya.email);

      await http().post(LOGIN_MFA).send({ mfaToken }).expect(422);
      const both = await http().post(LOGIN_MFA).send({ mfaToken, code: codeAt(secret, 0), recoveryCode: recoveryCodes[0] }).expect(422);
      expect((both.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaOneFactor);
    });
  });

  describe('POST /auth/mfa/disable', () => {
    it('turns MFA off with the current password and a code, and audits it', async () => {
      const priya = await account();
      const { secret } = await enrol(priya);

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, code: codeAt(secret, 0) }).expect(204);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: priya.id } });
      expect(user).toMatchObject({ mfaEnabled: false, mfaSecret: null });
      expect(await prisma.mfaRecoveryCode.count({ where: { userId: priya.id } })).toBe(0);
      const login = await http().post(LOGIN).send({ email: priya.email, password: PASSWORD }).expect(200);
      expect((login.body as { data: { requiresMfa: boolean } }).data.requiresMfa).toBe(false);
      expect(await prisma.auditEvent.count({ where: { entityId: priya.id, metadata: { equals: { mfa: 'disabled' } } } })).toBe(1);
    });

    it('also accepts a recovery code, for someone who lost their phone', async () => {
      const priya = await account();
      const { recoveryCodes } = await enrol(priya);

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, recoveryCode: recoveryCodes[0] }).expect(204);
    });

    it('refuses a wrong password or a wrong code, and MFA stays on', async () => {
      const priya = await account();
      const { secret } = await enrol(priya);

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: 'wrong password', code: codeAt(secret, 0) }).expect(422);
      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, code: '000000' }).expect(422);

      expect((await prisma.user.findUniqueOrThrow({ where: { id: priya.id } })).mfaEnabled).toBe(true);
    });

    it('does not spend a recovery code when the password is wrong', async () => {
      const priya = await account();
      const { recoveryCodes } = await enrol(priya);

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: 'wrong password', recoveryCode: recoveryCodes[0] }).expect(422);

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, recoveryCode: recoveryCodes[0] }).expect(204);
    });

    it('refuses a super admin outright, even with the right password and code', async () => {
      const admin = await account('super_admin');
      const { secret } = await enrol(admin);

      const res = await http().post(DISABLE).set('Cookie', admin.cookie).send({ password: PASSWORD, code: codeAt(secret, 0) }).expect(403);

      expect((res.body as ErrorBody).error.message).toBe(AUTH_MESSAGES.mfaRequiredForSuperAdmin);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).mfaEnabled).toBe(true);
    });

    it('answers 409 when MFA is not on', async () => {
      const priya = await account();

      await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, code: '123456' }).expect(409);
    });
  });

  describe('lock after 5 wrong codes in 15 minutes', () => {
    it('refuses even the correct code after 5 failures, with 429 and Retry-After', async () => {
      const priya = await account();
      const setup = await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);
      const { secret } = (setup.body as { data: MfaSetupResponse }).data;

      for (let i = 0; i < 5; i += 1) {
        await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: '000000' }).expect(422);
      }
      const res = await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: codeAt(secret, 0) }).expect(429);

      expect((res.body as ErrorBody).error).toMatchObject({ code: 'RATE_LIMITED', message: AUTH_MESSAGES.mfaLocked });
      expect(Number(res.headers['retry-after'])).toBeGreaterThan(14 * 60);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: priya.id } })).mfaEnabled).toBe(false);
    });

    it('counts failures across endpoints: wrong codes at disable then at login lock the login', async () => {
      const priya = await account();
      const { secret } = await enrol(priya);

      for (let i = 0; i < 3; i += 1) {
        await http().post(DISABLE).set('Cookie', priya.cookie).send({ password: PASSWORD, code: '000000' }).expect(422);
      }
      const mfaToken = await startLogin(priya.email);
      for (let i = 0; i < 2; i += 1) {
        await http().post(LOGIN_MFA).send({ mfaToken, code: '000000' }).expect(401);
      }

      await http().post(LOGIN_MFA).send({ mfaToken, code: codeAt(secret, 0) }).expect(429);
    });

    it('locks one account only: another user is unaffected', async () => {
      const priya = await account();
      await http().post(SETUP).set('Cookie', priya.cookie).send({ password: PASSWORD }).expect(200);
      for (let i = 0; i < 5; i += 1) {
        await http().post(VERIFY).set('Cookie', priya.cookie).send({ code: '000000' }).expect(422);
      }

      const ravi = await account();
      await enrol(ravi);
    });
  });

  describe('IAM-04: a super admin without MFA is confined to MFA setup', () => {
    /** Routes anyone may call without a session; they are not behind AuthGuard. */
    const PUBLIC_ROUTES = new Set([
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/mfa',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/password-reset',
      'POST /api/v1/auth/password-reset/confirm',
      'GET /api/v1/settings/public',
      'GET /health',
    ]);
    const SETUP_ROUTES = new Set(['POST /api/v1/auth/mfa/setup', 'POST /api/v1/auth/mfa/verify']);

    it('signs in, but says so: the user carries mfaSetupRequired', async () => {
      const admin = await account('super_admin');
      const login = await http().post(LOGIN).send({ email: admin.email, password: PASSWORD }).expect(200);

      expect((login.body as { data: { user: { mfaSetupRequired: boolean } } }).data.user.mfaSetupRequired).toBe(true);
    });

    it('gets 403 MFA_SETUP_REQUIRED on every other route in the API, found from the live route list', async () => {
      const admin = await account('super_admin');
      const docs = await http().get('/docs-json').expect(200);
      const paths = (docs.body as { paths: Record<string, Record<string, unknown>> }).paths;

      const checked: string[] = [];
      for (const [path, operations] of Object.entries(paths)) {
        for (const method of Object.keys(operations)) {
          const route = `${method.toUpperCase()} ${path}`;
          if (PUBLIC_ROUTES.has(route) || SETUP_ROUTES.has(route)) continue;
          const url = path.replace(/\{[^}]+\}/g, admin.id);
          const res = await http()[method as 'get' | 'post' | 'put' | 'patch' | 'delete'](url).set('Cookie', admin.cookie).send({});
          expect({ route, status: res.status, code: (res.body as ErrorBody).error?.code }).toEqual({
            route,
            status: 403,
            code: 'MFA_SETUP_REQUIRED',
          });
          checked.push(route);
        }
      }
      // Guards against a vacuous pass: the admin routes really were found and tried.
      expect(checked).toEqual(expect.arrayContaining(['GET /api/v1/auth/me', 'GET /api/v1/admin/settings', 'POST /api/v1/admin/users/invite', 'DELETE /api/v1/admin/media/{id}']));
      expect(checked.length).toBeGreaterThanOrEqual(15);
    });

    it('can still log out', async () => {
      const admin = await account('super_admin');

      await http().post('/api/v1/auth/logout').set('Cookie', admin.cookie).expect(204);
    });

    it('is released the moment MFA is on, in the same session', async () => {
      const admin = await account('super_admin');
      await http().get('/api/v1/admin/settings').set('Cookie', admin.cookie).expect(403);

      await enrol(admin);

      await http().get('/api/v1/admin/settings').set('Cookie', admin.cookie).expect(200);
      const me = await http().get('/api/v1/auth/me').set('Cookie', admin.cookie).expect(200);
      expect((me.body as { data: { user: { mfaSetupRequired: boolean } } }).data.user.mfaSetupRequired).toBe(false);
    });

    it('does not confine roles that are not super admin', async () => {
      const ravi = await account('product_manager');

      const me = await http().get('/api/v1/auth/me').set('Cookie', ravi.cookie).expect(200);
      expect((me.body as { data: { user: { mfaSetupRequired: boolean } } }).data.user.mfaSetupRequired).toBe(false);
    });
  });

  describe('setup needs the current password', () => {
    it('rejects setup without a password, or with the wrong one, and stores no secret', async () => {
      const ravi = await account();

      const missing = await http().post(SETUP).set('Cookie', ravi.cookie).send({}).expect(422);
      expect((missing.body as ErrorBody).error.fields).toHaveProperty('password');
      const wrong = await http().post(SETUP).set('Cookie', ravi.cookie).send({ password: 'not the password' }).expect(422);
      expect((wrong.body as ErrorBody).error.fields).toEqual({ password: AUTH_MESSAGES.mfaSetupPasswordInvalid });

      expect((await prisma.user.findUniqueOrThrow({ where: { id: ravi.id } })).mfaPendingSecret).toBeNull();
    });

    it('stops a stolen session guessing the password: wrong passwords count towards the 5-failure lock', async () => {
      const ravi = await account();
      for (let i = 0; i < 5; i += 1) {
        await http().post(SETUP).set('Cookie', ravi.cookie).send({ password: `guess-${i}` }).expect(422);
      }

      await http().post(SETUP).set('Cookie', ravi.cookie).send({ password: PASSWORD }).expect(429);
    });
  });
});

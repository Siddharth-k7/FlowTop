import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { RoleName } from '../src/auth';
import { AuthMailer } from '../src/auth/auth.mailer';
import type { Paginated } from '../src/common/dto/pagination';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import type { UserSummary } from '../src/users/dto/users.dto';
import { UsersRepository } from '../src/users/users.repository';
import { resetDatabase } from './database';
import { createAccount } from './accounts';

const PASSWORD = `test-only-${randomUUID()}`;
const NEW_PASSWORD = `test-only-${randomUUID()}`;
const USERS = '/api/v1/admin/users';

interface Account {
  id: string;
  email: string;
  cookie: string;
}

describe('Users (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const mailer = {
    sendPasswordReset: jest.fn<Promise<void>, [string, string]>(),
    sendInvite: jest.fn<Promise<void>, [string, string, string]>(),
  };

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
    await syncPermissionsAndRoles(prisma);
    app.get(RateLimiter).clear();
    mailer.sendInvite.mockReset().mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function account(role: RoleName, name: string = role): Promise<Account> {
    const { id, email, cookie } = await createAccount(app, role, { email: `${name}@flowtop.in`, name, password: PASSWORD });
    return { id, email, cookie };
  }

  async function login(email: string, password = PASSWORD): Promise<string> {
    const res = await http().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  }

  describe('object-level access: changing the id in the URL', () => {
    it("lets a user read their own record but answers someone else's exactly like a missing one", async () => {
      const priya = await account('marketing_admin', 'priya');
      const ravi = await account('product_manager', 'ravi');

      const own = await http().get(`${USERS}/${priya.id}`).set('Cookie', priya.cookie).expect(200);
      expect((own.body as { data: UserSummary }).data.email).toBe('priya@flowtop.in');

      const other = await http().get(`${USERS}/${ravi.id}`).set('Cookie', priya.cookie).expect(404);
      const missing = await http().get(`${USERS}/${randomUUID()}`).set('Cookie', priya.cookie).expect(404);

      expect(other.body).toEqual(missing.body);
      expect(JSON.stringify(other.body)).not.toContain('ravi');
    });

    it("lets a super admin, who holds user:read, read anyone's record", async () => {
      const admin = await account('super_admin', 'admin');
      const ravi = await account('product_manager', 'ravi');

      const res = await http().get(`${USERS}/${ravi.id}`).set('Cookie', admin.cookie).expect(200);

      expect((res.body as { data: UserSummary }).data.email).toBe('ravi@flowtop.in');
    });

    it('requires a session at all', async () => {
      const ravi = await account('product_manager', 'ravi');

      await http().get(`${USERS}/${ravi.id}`).expect(401);
    });

    it('checks user:read_self at the route: without it, not even your own record', async () => {
      const ravi = await account('product_manager', 'ravi');
      await prisma.rolePermission.deleteMany({ where: { role: { name: 'product_manager' }, permission: { key: 'user:read_self' } } });

      const res = await http().get(`${USERS}/${ravi.id}`).set('Cookie', ravi.cookie).expect(403);

      expect((res.body as ErrorBody).error.code).toBe('FORBIDDEN');
    });
  });

  describe('super_admin only', () => {
    it('refuses every management route to marketing_admin and product_manager with 403', async () => {
      const target = await account('product_manager', 'target');
      for (const role of ['marketing_admin', 'product_manager'] as const) {
        const { cookie } = await account(role);
        await http().get(USERS).set('Cookie', cookie).expect(403);
        await http().post(`${USERS}/invite`).set('Cookie', cookie).send({ name: 'X', email: 'x@flowtop.in', role: 'super_admin' }).expect(403);
        await http().post(`${USERS}/${target.id}/role`).set('Cookie', cookie).send({ role: 'super_admin' }).expect(403);
        await http().post(`${USERS}/${target.id}/deactivate`).set('Cookie', cookie).expect(403);
      }
      expect(await prisma.auditEvent.count()).toBe(0);
    });

    it('Phase 1 check 3: marketing_admin cannot make itself super_admin through the role endpoint', async () => {
      const priya = await account('marketing_admin', 'priya');

      await http().post(`${USERS}/${priya.id}/role`).set('Cookie', priya.cookie).send({ role: 'super_admin' }).expect(403);

      const me = await http().get('/api/v1/auth/me').set('Cookie', priya.cookie).expect(200);
      expect((me.body as { data: { user: { role: string } } }).data.user.role).toBe('marketing_admin');
    });

    it('has no public registration route', async () => {
      for (const path of ['/api/v1/auth/register', '/api/v1/auth/signup', '/api/v1/users', USERS]) {
        const res = await http().post(path).send({ name: 'X', email: 'x@flowtop.in', password: NEW_PASSWORD });
        expect([401, 404]).toContain(res.status);
      }
      expect(await prisma.user.count()).toBe(0);
    });
  });

  it('lists users with the pagination envelope and search, never exposing credentials', async () => {
    const admin = await account('super_admin', 'admin');
    await account('marketing_admin', 'priya');
    await account('product_manager', 'ravi');

    const res = await http().get(`${USERS}?search=PRI`).set('Cookie', admin.cookie).expect(200);
    const body = res.body as Paginated<UserSummary>;

    expect(body.meta).toEqual({ page: 1, perPage: 25, total: 1, totalPages: 1 });
    expect(body.data[0]).toEqual({
      id: expect.any(String) as string,
      name: 'priya',
      email: 'priya@flowtop.in',
      role: 'marketing_admin',
      isActive: true,
      mfaEnabled: false,
      createdAt: expect.any(String) as string,
    });
    expect(JSON.stringify(body)).not.toMatch(/password|hash|secret|token/i);
  });

  describe('invite', () => {
    it('creates the account, emails a single-use link, audits it, and the link sets the password', async () => {
      const admin = await account('super_admin', 'admin');

      const res = await http()
        .post(`${USERS}/invite`)
        .set('Cookie', admin.cookie)
        .send({ name: 'Neha Rao', email: ' Neha@Flowtop.in ', role: 'product_manager' })
        .expect(201);
      const { user, inviteSent } = (res.body as { data: { user: UserSummary; inviteSent: boolean } }).data;

      expect(inviteSent).toBe(true);
      expect(user).toMatchObject({ name: 'Neha Rao', email: 'neha@flowtop.in', role: 'product_manager', isActive: true });
      const [to, name, link] = mailer.sendInvite.mock.calls[0];
      expect([to, name]).toEqual(['neha@flowtop.in', 'Neha Rao']);
      expect(link).toMatch(/^http:\/\/localhost:3001\/accept-invite\?token=/);
      expect(await prisma.auditEvent.findFirst({ where: { action: 'invite' } })).toMatchObject({
        actorId: admin.id,
        entityType: 'user',
        entityId: user.id,
        metadata: { email: 'neha@flowtop.in', role: 'product_manager' },
      });

      // Cannot log in before accepting: the placeholder password is unknowable.
      await http().post('/api/v1/auth/login').send({ email: 'neha@flowtop.in', password: PASSWORD }).expect(401);

      const token = new URL(link).searchParams.get('token');
      await http().post('/api/v1/auth/password-reset/confirm').send({ token, password: NEW_PASSWORD }).expect(204);
      await login('neha@flowtop.in', NEW_PASSWORD);
      await http().post('/api/v1/auth/password-reset/confirm').send({ token, password: NEW_PASSWORD }).expect(422);
    });

    it('tells the truth when the email fails: the account exists, inviteSent is false', async () => {
      const admin = await account('super_admin', 'admin');
      mailer.sendInvite.mockRejectedValueOnce(new Error('provider down'));

      const res = await http()
        .post(`${USERS}/invite`)
        .set('Cookie', admin.cookie)
        .send({ name: 'Neha Rao', email: 'neha@flowtop.in', role: 'product_manager' })
        .expect(201);

      expect((res.body as { data: { inviteSent: boolean } }).data.inviteSent).toBe(false);
      expect(await prisma.user.count({ where: { email: 'neha@flowtop.in' } })).toBe(1);
    });

    it('refuses a duplicate email, an unknown role and any extra field', async () => {
      const admin = await account('super_admin', 'admin');
      await account('marketing_admin', 'priya');

      const duplicate = await http()
        .post(`${USERS}/invite`)
        .set('Cookie', admin.cookie)
        .send({ name: 'P', email: 'PRIYA@flowtop.in', role: 'product_manager' })
        .expect(409);
      expect((duplicate.body as ErrorBody).error.fields).toHaveProperty('email');

      await http().post(`${USERS}/invite`).set('Cookie', admin.cookie).send({ name: 'X', email: 'x@flowtop.in', role: 'owner' }).expect(422);
      await http()
        .post(`${USERS}/invite`)
        .set('Cookie', admin.cookie)
        .send({ name: 'X', email: 'x@flowtop.in', role: 'product_manager', mfaEnabled: false })
        .expect(422);
    });
  });

  describe('change role', () => {
    it('changes the role, takes effect on the next request, and audits from and to', async () => {
      const admin = await account('super_admin', 'admin');
      const priya = await account('marketing_admin', 'priya');

      const res = await http().post(`${USERS}/${priya.id}/role`).set('Cookie', admin.cookie).send({ role: 'product_manager' }).expect(200);

      expect((res.body as { data: UserSummary }).data.role).toBe('product_manager');
      const me = await http().get('/api/v1/auth/me').set('Cookie', priya.cookie).expect(200);
      expect((me.body as { data: { user: { permissions: string[] } } }).data.user.permissions).toContain('placement:manage');
      expect(await prisma.auditEvent.findFirst({ where: { action: 'role_change' } })).toMatchObject({
        actorId: admin.id,
        entityId: priya.id,
        metadata: { from: 'marketing_admin', to: 'product_manager' },
      });
    });

    it('refuses to change your own role', async () => {
      const admin = await account('super_admin', 'admin');

      await http().post(`${USERS}/${admin.id}/role`).set('Cookie', admin.cookie).send({ role: 'product_manager' }).expect(403);
    });

    it('refuses to demote the last active super admin', async () => {
      const only = await account('super_admin', 'only');
      const { id: roleId } = await prisma.role.findUniqueOrThrow({ where: { name: 'marketing_admin' } });

      const outcome = await prisma.$transaction((tx) => app.get(UsersRepository).replaceRole(only.id, roleId, 'marketing_admin', tx));

      expect(outcome).toBe('last_super_admin');
    });

    /**
     * Two super admins demoting each other at the same moment. Over HTTP the
     * requests rarely truly overlap, so this forces the overlap: the first
     * transaction demotes and is held open, uncommitted, while the second runs.
     * Verified to fail with the row lock removed: both demotions go through and
     * nobody can manage users any more.
     */
    it('never leaves zero super admins when two demotions overlap', async () => {
      const first = await account('super_admin', 'first');
      const second = await account('super_admin', 'second');
      const { id: roleId } = await prisma.role.findUniqueOrThrow({ where: { name: 'marketing_admin' } });
      const repository = app.get(UsersRepository);
      const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      let commitFirst!: () => void;
      const firstMayCommit = new Promise<void>((resolve) => (commitFirst = resolve));
      const firstDemotion = prisma.$transaction(
        async (tx) => {
          const outcome = await repository.replaceRole(second.id, roleId, 'marketing_admin', tx);
          await firstMayCommit;
          return outcome;
        },
        { timeout: 10_000 },
      );
      await pause(300);
      const secondDemotion = prisma.$transaction((tx) => repository.replaceRole(first.id, roleId, 'marketing_admin', tx), {
        timeout: 10_000,
      });
      await pause(300);
      commitFirst();

      expect(await Promise.all([firstDemotion, secondDemotion])).toEqual(['done', 'last_super_admin']);
      const superAdmins = await prisma.user.count({ where: { isActive: true, roles: { some: { role: { name: 'super_admin' } } } } });
      expect(superAdmins).toBe(1);
    });
  });

  describe('deactivate', () => {
    it('ends access at once: live session refused, login refused, audited', async () => {
      const admin = await account('super_admin', 'admin');
      const priya = await account('marketing_admin', 'priya');

      const res = await http().post(`${USERS}/${priya.id}/deactivate`).set('Cookie', admin.cookie).expect(200);

      expect((res.body as { data: UserSummary }).data.isActive).toBe(false);
      await http().get('/api/v1/auth/me').set('Cookie', priya.cookie).expect(401);
      await http().post('/api/v1/auth/login').send({ email: priya.email, password: PASSWORD }).expect(401);
      expect(await prisma.session.count({ where: { userId: priya.id } })).toBe(0);
      expect(await prisma.auditEvent.count({ where: { action: 'deactivate', entityId: priya.id } })).toBe(1);
    });

    it('is idempotent: a second call changes nothing and writes no second audit row', async () => {
      const admin = await account('super_admin', 'admin');
      const priya = await account('marketing_admin', 'priya');

      await http().post(`${USERS}/${priya.id}/deactivate`).set('Cookie', admin.cookie).expect(200);
      await http().post(`${USERS}/${priya.id}/deactivate`).set('Cookie', admin.cookie).expect(200);

      expect(await prisma.auditEvent.count({ where: { action: 'deactivate' } })).toBe(1);
    });

    it('refuses to deactivate yourself, and 404s an unknown id', async () => {
      const admin = await account('super_admin', 'admin');

      await http().post(`${USERS}/${admin.id}/deactivate`).set('Cookie', admin.cookie).expect(403);
      await http().post(`${USERS}/${randomUUID()}/deactivate`).set('Cookie', admin.cookie).expect(404);
    });
  });
});

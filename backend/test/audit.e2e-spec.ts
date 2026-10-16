import { Controller, HttpCode, Module, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuditService } from '../src/audit';
import type { AuditEventResponse } from '../src/audit/dto/audit.dto';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../src/auth';
import type { AuthUser, RoleName } from '../src/auth';
import type { Paginated } from '../src/common/dto/pagination';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { resetDatabase } from './database';
import { createAccount } from './accounts';

const PASSWORD = `test-only-${randomUUID()}`;
const AUDIT = '/api/v1/admin/audit';

/**
 * There is no publish endpoint yet: publishing products is Dev B's module. This
 * stands in for it, written exactly as backend/AGENTS.md tells Dev B to.
 */
@Controller('probe/products')
class PublishProbeController {
  constructor(private readonly audit: AuditService) {}

  @Post(':id/publish')
  @HttpCode(204)
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:publish')
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.audit.record({ actorId: user.id, action: 'publish', entityType: 'product', entityId: id, metadata: { from: 'draft' } });
  }
}

@Module({ controllers: [PublishProbeController] })
class PublishProbeModule {}

interface Account {
  id: string;
  cookie: string;
}

describe('Audit log (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: Account;
  let ravi: Account;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, PublishProbeModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await syncPermissionsAndRoles(prisma);
    app.get(RateLimiter).clear();
    admin = await account('super_admin', 'Asha Admin', 'asha');
    ravi = await account('product_manager', 'Ravi Kumar', 'ravi');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const fetchAudit = (query = '') => http().get(`${AUDIT}${query}`).set('Cookie', admin.cookie);

  async function account(role: RoleName, name: string, handle: string): Promise<Account> {
    const { id, cookie } = await createAccount(app, role, { email: `${handle}@flowtop.in`, name, password: PASSWORD });
    return { id, cookie };
  }

  const publish = (productId: string, as: Account = ravi) =>
    http().post(`/api/v1/probe/products/${productId}/publish`).set('Cookie', as.cookie).expect(204);

  it('publish something, then find that exact row: actor, action, entity and timestamp', async () => {
    const productId = randomUUID();
    const before = Date.now();
    await publish(productId);
    const after = Date.now();

    const res = await fetchAudit(`?entityType=product&entityId=${productId}`).expect(200);
    const body = res.body as Paginated<AuditEventResponse>;

    expect(body.meta.total).toBe(1);
    const [row] = body.data;
    expect(row).toEqual({
      id: expect.any(String) as string,
      action: 'publish',
      entityType: 'product',
      entityId: productId,
      metadata: { from: 'draft' },
      createdAt: expect.any(String) as string,
      actor: { id: ravi.id, name: 'Ravi Kumar', email: 'ravi@flowtop.in' },
    });
    const at = new Date(row.createdAt).getTime();
    expect(at).toBeGreaterThanOrEqual(before - 1000);
    expect(at).toBeLessThanOrEqual(after + 1000);
  });

  it('also shows actions from real routes: a role change', async () => {
    await http().post(`/api/v1/admin/users/${ravi.id}/role`).set('Cookie', admin.cookie).send({ role: 'marketing_admin' }).expect(200);

    const res = await fetchAudit('?action=role_change').expect(200);
    const [row] = (res.body as Paginated<AuditEventResponse>).data;

    expect(row).toMatchObject({
      action: 'role_change',
      entityType: 'user',
      entityId: ravi.id,
      metadata: { from: 'product_manager', to: 'marketing_admin' },
      actor: { id: admin.id, name: 'Asha Admin', email: 'asha@flowtop.in' },
    });
  });

  it('lists newest first with the pagination envelope', async () => {
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    for (const id of ids) {
      await publish(id);
    }

    const res = await fetchAudit('?perPage=2').expect(200);
    const body = res.body as Paginated<AuditEventResponse>;

    expect(body.meta).toEqual({ page: 1, perPage: 2, total: 3, totalPages: 2 });
    expect(body.data.map((row) => row.entityId)).toEqual([ids[2], ids[1]]);
    const page2 = await fetchAudit('?perPage=2&page=2').expect(200);
    expect((page2.body as Paginated<AuditEventResponse>).data.map((row) => row.entityId)).toEqual([ids[0]]);
  });

  it('filters by actor and action, and they combine', async () => {
    await publish(randomUUID(), ravi);
    await publish(randomUUID(), admin);
    await http().post(`/api/v1/admin/users/${ravi.id}/deactivate`).set('Cookie', admin.cookie).expect(200);

    const byRavi = (await fetchAudit(`?actorId=${ravi.id}`).expect(200)).body as Paginated<AuditEventResponse>;
    expect(byRavi.meta.total).toBe(1);

    const byAdmin = (await fetchAudit(`?actorId=${admin.id}`).expect(200)).body as Paginated<AuditEventResponse>;
    expect(byAdmin.data.map((row) => row.action).sort()).toEqual(['deactivate', 'publish']);

    const adminPublishes = (await fetchAudit(`?actorId=${admin.id}&action=publish`).expect(200)).body as Paginated<AuditEventResponse>;
    expect(adminPublishes.meta.total).toBe(1);
  });

  it('filters by date range: from inclusive, to exclusive', async () => {
    const old = randomUUID();
    await publish(old);
    await prisma.$executeRaw`ALTER TABLE audit_event DISABLE TRIGGER audit_event_append_only`;
    await prisma.$executeRaw`UPDATE audit_event SET created_at = '2026-01-15T10:00:00Z' WHERE entity_id = ${old}`;
    await prisma.$executeRaw`ALTER TABLE audit_event ENABLE TRIGGER audit_event_append_only`;
    await publish(randomUUID());

    const january = await fetchAudit(`?from=${encodeURIComponent('2026-01-15T10:00:00Z')}&to=${encodeURIComponent('2026-02-01T00:00:00+05:30')}`).expect(200);
    expect((january.body as Paginated<AuditEventResponse>).data.map((row) => row.entityId)).toEqual([old]);

    const endsExactlyThere = await fetchAudit(`?to=${encodeURIComponent('2026-01-15T10:00:00Z')}`).expect(200);
    expect((endsExactlyThere.body as Paginated<AuditEventResponse>).meta.total).toBe(0);

    const recent = await fetchAudit(`?from=${encodeURIComponent('2026-02-01T00:00:00Z')}`).expect(200);
    expect((recent.body as Paginated<AuditEventResponse>).meta.total).toBe(1);
  });

  it('shows a system action with a null actor', async () => {
    await app.get(AuditService).record({ actorId: null, action: 'status_change', entityType: 'order', entityId: 'FT-2026-00001' });

    const [row] = ((await fetchAudit('?entityType=order').expect(200)).body as Paginated<AuditEventResponse>).data;

    expect(row.actor).toBeNull();
  });

  it('rejects invalid filters with 422', async () => {
    const fieldOf = async (query: string) => Object.keys(((await fetchAudit(query).expect(422)).body as ErrorBody).error.fields ?? {});

    expect(await fieldOf('?action=hack')).toEqual(['action']);
    expect(await fieldOf('?actorId=not-a-uuid')).toEqual(['actorId']);
    expect(await fieldOf('?from=2026-10-14')).toEqual(['from']);
    expect(await fieldOf(`?from=${encodeURIComponent('2026-10-15T00:00:00Z')}&to=${encodeURIComponent('2026-10-14T00:00:00Z')}`)).toEqual(['to']);
    expect(await fieldOf('?entityType=Product;DROP')).toEqual(['entityType']);
  });

  describe('super_admin only', () => {
    it('refuses product_manager and marketing_admin with 403, and no session with 401', async () => {
      await http().get(AUDIT).set('Cookie', ravi.cookie).expect(403);
      const priya = await account('marketing_admin', 'Priya', 'priya');
      await http().get(AUDIT).set('Cookie', priya.cookie).expect(403);
      await http().get(AUDIT).expect(401);
    });
  });

  describe('append only', () => {
    it('has no route that writes, edits or deletes history', async () => {
      await publish(randomUUID());
      const [row] = await prisma.auditEvent.findMany();

      await http().post(AUDIT).set('Cookie', admin.cookie).send({ action: 'publish' }).expect(404);
      await http().patch(`${AUDIT}/${row.id}`).set('Cookie', admin.cookie).send({ action: 'unpublish' }).expect(404);
      await http().put(`${AUDIT}/${row.id}`).set('Cookie', admin.cookie).send({ action: 'unpublish' }).expect(404);
      await http().delete(`${AUDIT}/${row.id}`).set('Cookie', admin.cookie).expect(404);

      expect(await prisma.auditEvent.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ action: 'publish' });
    });

    it('the database itself refuses an update or delete, even from inside the app', async () => {
      await publish(randomUUID());
      const [row] = await prisma.auditEvent.findMany();

      await expect(prisma.auditEvent.update({ where: { id: row.id }, data: { action: 'unpublish' } })).rejects.toThrow(/append only/);
      await expect(prisma.auditEvent.delete({ where: { id: row.id } })).rejects.toThrow(/append only/);
      await expect(prisma.auditEvent.deleteMany({})).rejects.toThrow(/append only/);

      expect(await prisma.auditEvent.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ action: 'publish' });
    });
  });
});

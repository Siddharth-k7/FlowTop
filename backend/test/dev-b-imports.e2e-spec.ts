import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { ProductsPublishRepository, ProductsPublishService } from '../src/_examples/audit.example';
import { ProductsListController, ProductsListRepository, ProductsListService } from '../src/_examples/pagination.example';
import { isKnownPermission, PRODUCT_EDITORS } from '../src/_examples/permission-list.example';
import { MediaUploadsRepository, MediaUploadsService } from '../src/_examples/record-access.example';
import { ProductsAdminController } from '../src/_examples/route-protection.example';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuditService } from '../src/audit';
import { ALL_PERMISSIONS, AuthGuard, PermissionGuard } from '../src/auth';
import type { AuthUser, RoleName } from '../src/auth';
import { ApiException } from '../src/common/errors/api.exception';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { createAccount } from './accounts';
import { resetDatabase } from './database';
import { ProductsModule } from '../src/products/products.module';

@Module({})
class EmptyProductsModule {}

const PASSWORD = `test-only-${randomUUID()}`;

/**
 * Proves the five examples in backend/AGENTS.md work exactly as written. The
 * controllers and services below are imported from src/_examples/, the same
 * files AGENTS.md embeds (src/_examples/agents-examples.spec.ts fails if the
 * two differ), so this tests the documentation, not a copy of it.
 *
 * Like Dev B's modules, this one imports neither AuthModule nor AuditModule.
 */
@Module({
  controllers: [ProductsAdminController, ProductsListController],
  providers: [ProductsPublishRepository, ProductsPublishService, ProductsListRepository, ProductsListService, MediaUploadsRepository, MediaUploadsService],
})
class AgentsExamplesModule {}

/** Not an example: the documented rule that PermissionGuard without @RequirePermission refuses everyone. */
@Controller('probe')
class FailsClosedProbeController {
  @Get('forgot-the-decorator')
  @UseGuards(AuthGuard, PermissionGuard)
  forgotDecorator(): { data: { ok: true } } {
    return { data: { ok: true } };
  }
}

@Module({ controllers: [FailsClosedProbeController] })
class FailsClosedProbeModule {}

describe("AGENTS.md: what Dev B imports from Dev A (e2e, the documented examples verbatim)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, AgentsExamplesModule, FailsClosedProbeModule] })
      .overrideModule(ProductsModule)
      .useModule(EmptyProductsModule)
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
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const account = (role: RoleName, options: { mfa?: boolean } = {}) =>
    createAccount(app, role, { email: `${role}-${randomUUID().slice(0, 8)}@flowtop.in`, password: PASSWORD, ...options });
  const product = (name: string) =>
    prisma.product.create({ data: { name, sku: `FT-${randomUUID().slice(0, 8)}`, slug: `p-${randomUUID().slice(0, 8)}`, price: 450000 } });

  async function viewerOf(cookie: string): Promise<AuthUser> {
    const me = await http().get('/api/v1/auth/me').set('Cookie', cookie).expect(200);
    return (me.body as { data: { user: AuthUser } }).data.user;
  }

  describe('1. Route protection (route-protection.example.ts)', () => {
    const route = (id: string) => `/api/v1/admin/products/${id}`;

    it('lets in a role with product:update, and returns what the example returns', async () => {
      const pm = await account('product_manager');
      const id = randomUUID();

      const res = await http().patch(route(id)).set('Cookie', pm.cookie).send({ name: 'Opel Basin Mixer' }).expect(200);

      expect(res.body).toEqual({ data: { id, changes: { name: 'Opel Basin Mixer' }, updatedBy: pm.id } });
    });

    it('answers no session with 401 and a role without product:update with 403', async () => {
      const marketing = await account('marketing_admin');

      expect(((await http().patch(route(randomUUID())).send({})).body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
      const res = await http().patch(route(randomUUID())).set('Cookie', marketing.cookie).send({}).expect(403);
      expect((res.body as ErrorBody).error.code).toBe('FORBIDDEN');
    });

    it('validates input: an unknown field is a 422 and a malformed id is a 400', async () => {
      const pm = await account('product_manager');

      await http().patch(route(randomUUID())).set('Cookie', pm.cookie).send({ price: 1 }).expect(422);
      await http().patch(route('not-a-uuid')).set('Cookie', pm.cookie).send({}).expect(400);
    });

    it('gives a super admin without MFA 403 MFA_SETUP_REQUIRED, as the bullet says', async () => {
      const admin = await account('super_admin', { mfa: false });

      const res = await http().patch(route(randomUUID())).set('Cookie', admin.cookie).send({}).expect(403);
      expect((res.body as ErrorBody).error.code).toBe('MFA_SETUP_REQUIRED');
    });

    it('applies a permission removed from a role on the very next request', async () => {
      const pm = await account('product_manager');
      await http().patch(route(randomUUID())).set('Cookie', pm.cookie).send({}).expect(200);

      await prisma.rolePermission.deleteMany({ where: { role: { name: 'product_manager' }, permission: { key: 'product:update' } } });

      await http().patch(route(randomUUID())).set('Cookie', pm.cookie).send({}).expect(403);
    });

    it('fails closed when @RequirePermission is forgotten, even for a super admin', async () => {
      const admin = await account('super_admin');

      await http().get('/api/v1/probe/forgot-the-decorator').set('Cookie', admin.cookie).expect(403);
    });
  });

  describe('2. The permission list (permission-list.example.ts)', () => {
    it('uses only agreed permission names, and recognises names at runtime', () => {
      expect(ALL_PERMISSIONS).toEqual(expect.arrayContaining([...PRODUCT_EDITORS]));
      expect(isKnownPermission('product:update')).toBe(true);
      expect(isKnownPermission('product:edit')).toBe(false);
    });
  });

  describe('3. Audit log (audit.example.ts)', () => {
    it('publishes and writes the audit row in the same transaction', async () => {
      const pm = await account('product_manager');
      const { id } = await product('Opel Basin Mixer');

      await app.get(ProductsPublishService).publish(pm.id, id);

      expect(await prisma.product.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'published', publishedAt: expect.any(Date) as Date });
      expect(await prisma.auditEvent.findFirstOrThrow()).toMatchObject({ actorId: pm.id, action: 'publish', entityType: 'product', entityId: id });
    });

    it('rolls the publish back if the audit row cannot be written', async () => {
      const pm = await account('product_manager');
      const { id } = await product('Opel Pillar Cock');
      jest.spyOn(app.get(AuditService), 'record').mockRejectedValueOnce(new Error('audit store down'));

      await expect(app.get(ProductsPublishService).publish(pm.id, id)).rejects.toThrow('audit store down');

      expect((await prisma.product.findUniqueOrThrow({ where: { id } })).status).toBe('draft');
      expect(await prisma.auditEvent.count()).toBe(0);
    });
  });

  describe('4. Pagination (pagination.example.ts)', () => {
    it('returns the contract envelope, searches, and refuses more than 100 per page', async () => {
      const pm = await account('product_manager');
      for (const name of ['Opel Basin Mixer', 'Opel Pillar Cock', 'Kitchen Faucet']) {
        await product(name);
      }

      const page = await http().get('/api/v1/admin/products?perPage=2').set('Cookie', pm.cookie).expect(200);
      expect(page.body).toEqual({
        data: [expect.objectContaining({ name: 'Kitchen Faucet' }), expect.objectContaining({ name: 'Opel Basin Mixer' })],
        meta: { page: 1, perPage: 2, total: 3, totalPages: 2 },
      });

      const search = await http().get('/api/v1/admin/products?search=opel').set('Cookie', pm.cookie).expect(200);
      expect((search.body as { meta: { total: number } }).meta.total).toBe(2);

      await http().get('/api/v1/admin/products?perPage=1000').set('Cookie', pm.cookie).expect(422);
    });
  });

  describe('5. Record-level access (record-access.example.ts)', () => {
    async function assetUploadedBy(userId: string) {
      return prisma.mediaAsset.create({
        data: { filename: 'photo.png', mimeType: 'image/png', sizeBytes: 1, bucket: 'public', storageKey: `${randomUUID()}.png`, uploadedBy: userId },
      });
    }

    async function rejection(promise: Promise<unknown>): Promise<string | undefined> {
      try {
        await promise;
        return undefined;
      } catch (error) {
        return error instanceof ApiException ? `${error.getStatus()} ${error.code}` : String(error);
      }
    }

    it("lets a product manager reach their own upload, and answers someone else's exactly like a missing one", async () => {
      const pm = await account('product_manager');
      const marketing = await account('marketing_admin');
      const own = await assetUploadedBy(pm.id);
      const theirs = await assetUploadedBy(marketing.id);
      const service = app.get(MediaUploadsService);
      const viewer = await viewerOf(pm.cookie);

      expect((await service.findRemovable(viewer, own.id)).id).toBe(own.id);
      expect(await rejection(service.findRemovable(viewer, theirs.id))).toBe('404 NOT_FOUND');
      expect(await rejection(service.findRemovable(viewer, randomUUID()))).toBe('404 NOT_FOUND');
    });

    it('lets a holder of the allWith permission (media:delete) reach anyone’s upload', async () => {
      const pm = await account('product_manager');
      const marketing = await account('marketing_admin');
      const pmUpload = await assetUploadedBy(pm.id);

      const reached = await app.get(MediaUploadsService).findRemovable(await viewerOf(marketing.cookie), pmUpload.id);

      expect(reached.id).toBe(pmUpload.id);
    });
  });
});

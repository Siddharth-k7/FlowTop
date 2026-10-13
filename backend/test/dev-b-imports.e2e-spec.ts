import { Controller, Get, Module, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { syncPermissionsAndRoles } from '../prisma/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuditService } from '../src/audit';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../src/auth';
import type { AuthUser, RoleName } from '../src/auth';
import { PasswordHasher } from '../src/auth/password-hasher';
import { paginate, PaginationQueryDto } from '../src/common/dto/pagination';
import type { Paginated } from '../src/common/dto/pagination';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { resetDatabase } from './database';

const PASSWORD = `test-only-${randomUUID()}`;

/**
 * Stands in for one of Dev B's controllers, written exactly as AGENTS.md tells him to.
 * Its module imports neither AuthModule nor AuditModule, like his will not.
 */
@Controller('probe')
class DevBProbeController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('product-edit')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:update')
  editProduct(): { data: { ok: true } } {
    return { data: { ok: true } };
  }

  @Get('settings-write')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('settings:write')
  writeSettings(): { data: { ok: true } } {
    return { data: { ok: true } };
  }

  @Get('forgot-the-decorator')
  @UseGuards(AuthGuard, PermissionGuard)
  forgotDecorator(): { data: { ok: true } } {
    return { data: { ok: true } };
  }

  @Post('publish/:id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:publish')
  async publish(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.audit.record({ actorId: user.id, action: 'publish', entityType: 'product', entityId: id, metadata: { from: 'draft' } });
  }

  @Post('publish-then-fail/:id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:publish')
  async publishThenFail(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.audit.record({ actorId: user.id, action: 'publish', entityType: 'product', entityId: id }, tx);
      throw new Error('the publish itself failed after the audit row was written');
    });
  }

  @Get('list')
  list(@Query() query: PaginationQueryDto): Paginated<number> {
    const all = Array.from({ length: 42 }, (_, i) => i + 1);
    const start = (query.page - 1) * query.perPage;
    return paginate(all.slice(start, start + query.perPage), all.length, query);
  }
}

@Module({ controllers: [DevBProbeController] })
class DevBProbeModule {}

describe("Dev B's imports from Dev A (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, DevBProbeModule] }).compile();
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

  async function signInAs(role: RoleName): Promise<{ cookie: string; userId: string }> {
    const email = `${role}@flowtop.in`;
    const { id } = await prisma.role.findUniqueOrThrow({ where: { name: role } });
    const user = await prisma.user.create({
      data: {
        name: role,
        email,
        passwordHash: await app.get(PasswordHasher).hash(PASSWORD),
        roles: { create: { roleId: id } },
      },
    });
    const res = await http().post('/api/v1/auth/login').send({ email, password: PASSWORD }).expect(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    return { cookie: cookies[0].split(';')[0], userId: user.id };
  }

  describe('@UseGuards(AuthGuard, PermissionGuard) + @RequirePermission', () => {
    it('rejects a request with no session: 401', async () => {
      const res = await http().get('/api/v1/probe/product-edit').expect(401);
      expect((res.body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
    });

    it('lets in a role that has the permission', async () => {
      const { cookie } = await signInAs('product_manager');
      await http().get('/api/v1/probe/product-edit').set('Cookie', cookie).expect(200);
    });

    it('rejects a signed-in role without the permission: 403', async () => {
      const { cookie } = await signInAs('marketing_admin');
      const res = await http().get('/api/v1/probe/product-edit').set('Cookie', cookie).expect(403);
      expect((res.body as ErrorBody).error.code).toBe('FORBIDDEN');
    });

    it('Phase 1 check 2: product_manager cannot reach a settings:write route', async () => {
      const { cookie } = await signInAs('product_manager');
      await http().get('/api/v1/probe/settings-write').set('Cookie', cookie).expect(403);
    });

    it('fails closed when @RequirePermission is forgotten, even for super_admin', async () => {
      const { cookie } = await signInAs('super_admin');
      await http().get('/api/v1/probe/forgot-the-decorator').set('Cookie', cookie).expect(403);
    });

    it('applies a permission removed from a role on the very next request', async () => {
      const { cookie } = await signInAs('product_manager');
      await http().get('/api/v1/probe/product-edit').set('Cookie', cookie).expect(200);

      await prisma.rolePermission.deleteMany({ where: { role: { name: 'product_manager' }, permission: { key: 'product:update' } } });

      await http().get('/api/v1/probe/product-edit').set('Cookie', cookie).expect(403);
    });
  });

  describe('auditService.record', () => {
    it('writes one row with actor, action, entity, metadata and timestamp', async () => {
      const { cookie, userId } = await signInAs('product_manager');
      const productId = randomUUID();

      await http().post(`/api/v1/probe/publish/${productId}`).set('Cookie', cookie).expect(201);

      const rows = await prisma.auditEvent.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        actorId: userId,
        action: 'publish',
        entityType: 'product',
        entityId: productId,
        metadata: { from: 'draft' },
      });
      expect(rows[0].createdAt).toBeInstanceOf(Date);
    });

    it('inside a transaction, rolls back with the change it describes', async () => {
      const { cookie } = await signInAs('product_manager');

      await http().post(`/api/v1/probe/publish-then-fail/${randomUUID()}`).set('Cookie', cookie).expect(500);

      expect(await prisma.auditEvent.count()).toBe(0);
    });
  });

  describe('pagination envelope', () => {
    it('returns { data, meta } as the contract specifies', async () => {
      const res = await http().get('/api/v1/probe/list?page=2&perPage=10').expect(200);

      expect(res.body).toEqual({
        data: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        meta: { page: 2, perPage: 10, total: 42, totalPages: 5 },
      });
    });

    it('defaults to page 1 of 25 and refuses perPage over 100', async () => {
      const res = await http().get('/api/v1/probe/list').expect(200);
      expect((res.body as Paginated<number>).meta).toEqual({ page: 1, perPage: 25, total: 42, totalPages: 2 });

      const tooMany = await http().get('/api/v1/probe/list?perPage=10000').expect(422);
      expect((tooMany.body as ErrorBody).error.fields).toHaveProperty('perPage');
    });
  });
});

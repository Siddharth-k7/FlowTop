/**
 * Extra cases beyond audit-break-d07742c. These failed on d07742c and must stay rejected.
 */
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { RoleName } from '../src/auth';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { createAccount } from './accounts';
import { resetDatabase } from './database';

const PASSWORD = `test-only-${randomUUID()}`;

describe('PR24 extra break cases', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let marketingAdmin: string;

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
    marketingAdmin = await signedIn('marketing_admin');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  async function signedIn(role: RoleName): Promise<string> {
    return (await createAccount(app, role, { email: `${role}-${randomUUID().slice(0, 8)}@flowtop.in`, password: PASSWORD })).cookie;
  }

  it('rejects an http button link and an http menu link, and stores an https video url', async () => {
    const page = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Extra', slug: `extra-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const pageId = (page.body as { data: { id: string } }).data.id;
    const httpLink = await http().post(`/api/v1/admin/pages/${pageId}/sections`).set('Cookie', marketingAdmin).send({
      type: 'cta', config: { heading: 'Go', cta: { label: 'Go', href: 'http://evil.com' } }, visible: true,
    });
    expect(httpLink.status).toBe(422);
    const video = await http().post(`/api/v1/admin/pages/${pageId}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', config: { headline: 'Hi', videoUrl: 'https://videos.example/a.mp4' }, visible: true,
    }).expect(201);
    expect((video.body as { data: { config: { videoUrl: string } } }).data.config.videoUrl).toBe('https://videos.example/a.mp4');

    await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Old', linkType: 'external', destination: 'https://flowtop.example/old', children: [] }],
      footer: [],
    }).expect(200);
    const slash = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Bad', linkType: 'external', destination: 'http://evil.com', children: [] }],
      footer: [],
    });
    expect(slash.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Bad' } })).toBe(0);
  });
});

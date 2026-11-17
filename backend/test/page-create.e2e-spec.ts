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

describe('page create with sections', () => {
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

  it('names videoUrl on a section save and does not use the layout-preset sentence', async () => {
    const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Launch', slug: `launch-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    const rejected = await http().post(`/api/v1/admin/pages/${id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', visible: true, config: { headline: 'Hi', videoUrl: 'javascript:alert(1)' },
    });
    const error = (rejected.body as { error: { message: string; fields: Record<string, string> } }).error;
    expect(rejected.status).toBe(422);
    expect(error.message).not.toBe('That layout is not one of the approved presets.');
    expect(error.message).toMatch(/videoUrl/);
    expect(error.fields.videoUrl).toMatch(/https/);
    expect(await prisma.section.count({ where: { pageId: id } })).toBe(0);
  });

  it('creates the page and its sections in one transaction', async () => {
    const slug = `together-${randomUUID().slice(0, 6)}`;
    const res = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Together',
      slug,
      sections: [
        { type: 'hero', visible: true, config: { headline: 'Hi', videoUrl: 'https://videos.example/a.mp4' } },
        { type: 'cta', visible: true, config: { heading: 'Go', cta: { label: 'Go', href: '/products' } } },
      ],
    });
    expect(res.status).toBe(201);
    const page = (res.body as { data: { id: string; sections: { type: string; position: number; config: { videoUrl?: string; href?: string } }[] } }).data;
    expect(page.sections.map((section) => section.type)).toEqual(['hero', 'cta']);
    expect(page.sections.map((section) => section.position)).toEqual([1, 2]);
    expect(page.sections[0]?.config.videoUrl).toBe('https://videos.example/a.mp4');
    expect(await prisma.page.count({ where: { slug } })).toBe(1);
    expect(await prisma.section.count({ where: { pageId: page.id } })).toBe(2);
  });

  it('writes no page when a section on that create is rejected', async () => {
    const slug = `orphan-${randomUUID().slice(0, 6)}`;
    const before = await prisma.page.count();
    const res = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Orphan',
      slug,
      sections: [
        { type: 'hero', visible: true, config: { headline: 'Keep me' } },
        { type: 'hero', visible: true, config: { headline: 'Hi', videoUrl: 'javascript:alert(1)' } },
      ],
    });
    const error = (res.body as { error: { message: string; fields?: Record<string, string> } }).error;
    expect(res.status).toBe(422);
    expect(error.message).toMatch(/videoUrl/);
    expect(error.message).not.toBe('That layout is not one of the approved presets.');
    expect(error.fields?.['sections[1].videoUrl']).toMatch(/https/);
    expect(await prisma.page.count()).toBe(before);
    expect(await prisma.page.count({ where: { slug } })).toBe(0);
  });

  it('names count and mediaType when a saved section sends an empty value', async () => {
    const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Fields', slug: `fields-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    const count = await http().post(`/api/v1/admin/pages/${id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'product_carousel', visible: true, config: { heading: 'Featured', count: null },
    });
    const countError = (count.body as { error: { message: string; fields: Record<string, string> } }).error;
    expect(count.status).toBe(422);
    expect(countError.message).toMatch(/count/);
    expect(countError.message).not.toMatch(/approved presets/);
    expect(countError.fields.count).toMatch(/whole number/);

    const media = await http().post(`/api/v1/admin/pages/${id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', visible: true, config: { headline: 'Hi', mediaType: '' },
    });
    const mediaError = (media.body as { error: { message: string; fields: Record<string, string> } }).error;
    expect(media.status).toBe(422);
    expect(mediaError.message).toMatch(/mediaType/);
    expect(mediaError.fields.mediaType).toMatch(/image, video/);
    expect(await prisma.section.count({ where: { pageId: id } })).toBe(0);
  });
});

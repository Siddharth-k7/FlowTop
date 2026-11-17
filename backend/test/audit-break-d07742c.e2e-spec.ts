/**
 * Break attempts for PR 24 head d07742c62adc1a1a57049725b09cae9181775dac.
 * Not part of the repository. Place at backend/test/audit-break-d07742c.e2e-spec.ts.
 * Expects the safe outcome. A failure is a remaining hole.
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

describe('PR24 d07742c break attempts', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let productManager: string;
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
    productManager = await signedIn('product_manager');
    marketingAdmin = await signedIn('marketing_admin');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  async function signedIn(role: RoleName): Promise<string> {
    return (await createAccount(app, role, { email: `${role}-${randomUUID().slice(0, 8)}@flowtop.in`, password: PASSWORD })).cookie;
  }

  async function page() {
    const res = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Break', slug: `break-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    return (res.body as { data: { id: string } }).data.id;
  }

  async function section(pageId: string, config: Record<string, unknown>, type = 'cta') {
    return http().post(`/api/v1/admin/pages/${pageId}/sections`).set('Cookie', marketingAdmin).send({ type, config, visible: true });
  }

  it('rejects script, data, protocol-relative, encoded, and backslash hrefs, and keeps a site path', async () => {
    const pageId = await page();
    const bad = [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'java\tscript:alert(1)',
      'javascript\t:alert(1)',
      ' \tjavascript:alert(1)',
      'javascript%3Aalert(1)',
      '%6Aavascript:alert(1)',
      'data:text/html,hi',
      'DATA:text/html,hi',
      'data :text/html,hi',
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      '\\\\evil.com',
      'vbscript:msgbox(1)',
    ];
    const got: Record<string, number> = {};
    for (const href of bad) {
      const res = await section(pageId, { heading: 'Go', layout: { background: 'white' }, cta: { label: 'Go', href } });
      got[href] = res.status;
    }
    expect(got).toEqual(Object.fromEntries(bad.map((href) => [href, 422])));
    expect(await prisma.section.count({ where: { pageId } })).toBe(0);
    const ok = await section(pageId, { heading: 'Go', layout: { background: 'white' }, cta: { label: 'Go', href: '/products' } });
    expect(ok.status).toBe(201);
    const external = await section(pageId, { heading: 'Go', layout: { background: 'white' }, cta: { label: 'Go', href: 'https://ok.example/a' } });
    expect(external.status).toBe(201);
  });

  it('rejects preset values nested in arrays, including dotted layout keys and href under another name', async () => {
    const pageId = await page();
    const cases: { name: string; type: string; config: Record<string, unknown> }[] = [
      { name: 'style-nested', type: 'hero', config: { headline: 'Hi', ctas: [[{ label: 'Go', href: '/products', style: true }]] } },
      { name: 'style-rainbow', type: 'hero', config: { headline: 'Hi', ctas: [{ label: 'Go', href: '/products', style: 'rainbow' }] } },
      { name: 'layout-in-array', type: 'hero', config: { headline: 'Hi', blocks: [{ layout: { background: true } }] } },
      { name: 'layout-rainbow-in-array', type: 'hero', config: { headline: 'Hi', blocks: [{ layout: { background: 'rainbow' } }] } },
      { name: 'variant-in-array', type: 'gallery', config: { heading: 'G', groups: [[{ variant: 'nope' }]] } },
      { name: 'viewAllHref', type: 'cta', config: { heading: 'Go', viewAllHref: 'javascript:alert(1)' } },
      { name: 'videoUrl', type: 'hero', config: { headline: 'Hi', videoUrl: 'javascript:alert(1)' } },
      { name: 'link-key', type: 'cta', config: { heading: 'Go', link: 'javascript:alert(1)' } },
      { name: 'nested-href', type: 'cta', config: { heading: 'Go', rows: [[{ href: 'javascript:alert(1)' }]] } },
    ];
    const got: Record<string, number> = {};
    for (const item of cases) {
      const res = await section(pageId, item.config, item.type);
      got[item.name] = res.status;
    }
    expect(got).toEqual({
      'style-nested': 422,
      'style-rainbow': 422,
      'layout-in-array': 422,
      'layout-rainbow-in-array': 422,
      'variant-in-array': 422,
      viewAllHref: 422,
      videoUrl: 422,
      'link-key': 422,
      'nested-href': 422,
    });
    expect(await prisma.section.count({ where: { pageId } })).toBe(0);
  });

  it('rejects a fourth menu level and an empty or partial placement reorder', async () => {
    await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Old', linkType: 'external', destination: 'https://flowtop.example/old', children: [] }],
      footer: [],
    }).expect(200);
    const four = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop', linkType: 'external', destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass', linkType: 'external', destination: 'https://flowtop.example/brass',
          children: [{
            label: 'Grand', linkType: 'external', destination: 'https://flowtop.example/grand',
            children: [{ label: 'Great', linkType: 'external', destination: 'https://flowtop.example/great', children: [] }],
          }],
        }],
      }],
      footer: [],
    });
    expect(four.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Great' } })).toBe(0);
    const three = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop', linkType: 'external', destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass', linkType: 'external', destination: 'https://flowtop.example/brass',
          children: [{ label: 'Grand', linkType: 'external', destination: 'https://flowtop.example/grand', children: [] }],
        }],
      }],
      footer: [],
    }).expect(200);
    const header = (three.body as { data: { header: { label: string; children: { children: { label: string }[] }[] }[] } }).data.header;
    expect(header[0]?.children[0]?.children[0]?.label).toBe('Grand');

    const category = await http().post('/api/v1/admin/categories').set('Cookie', productManager).send({
      name: 'Basin', slug: `basin-${randomUUID().slice(0, 6)}`, description: '',
    }).expect(201);
    const categoryId = (category.body as { data: { id: string } }).data.id;
    const make = async () => {
      const res = await http().post('/api/v1/admin/products').set('Cookie', productManager).send({
        name: 'Tap', sku: `FT-${randomUUID().slice(0, 8)}`, slug: `tap-${randomUUID().slice(0, 8)}`,
        shortDescription: 'Solid brass.', fullDescription: '', price: 450000, salePrice: null,
        isPurchasable: true, isAvailable: true, availabilityMessage: null, seoTitle: '', seoDescription: '', seoCanonical: null,
      }).expect(201);
      return (res.body as { data: { id: string } }).data.id;
    };
    const first = await make();
    const second = await make();
    await http().post(`/api/v1/admin/products/${first}/placements`).set('Cookie', productManager).send({ locationType: 'category', locationId: categoryId }).expect(201);
    await http().post(`/api/v1/admin/products/${second}/placements`).set('Cookie', productManager).send({ locationType: 'category', locationId: categoryId }).expect(201);
    const rows = await prisma.placement.findMany({ where: { locationId: categoryId }, orderBy: { position: 'asc' } });
    const partial = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: categoryId, ids: [rows[1].id],
    });
    expect(partial.status).toBe(422);
    const empty = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: categoryId, ids: [],
    });
    expect(empty.status).toBe(422);
    const after = await prisma.placement.findMany({ where: { locationId: categoryId }, orderBy: { position: 'asc' } });
    expect(after.map((row) => row.position)).toEqual([1, 2]);
  });

  it('does not turn a default-finish validation error into a retry, and concurrent defaults stay one', async () => {
    const product = await http().post('/api/v1/admin/products').set('Cookie', productManager).send({
      name: 'Tap', sku: `FT-${randomUUID().slice(0, 8)}`, slug: `tap-${randomUUID().slice(0, 8)}`,
      shortDescription: 'Solid brass.', fullDescription: '', price: 450000, salePrice: null,
      isPurchasable: true, isAvailable: true, availabilityMessage: null, seoTitle: '', seoDescription: '', seoCanonical: null,
    }).expect(201);
    const productId = (product.body as { data: { id: string } }).data.id;
    const chrome = await http().post(`/api/v1/admin/products/${productId}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
    }).expect(201);
    const black = await http().post(`/api/v1/admin/products/${productId}/variants`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: false,
    }).expect(201);
    const chromeId = (chrome.body as { data: { id: string } }).data.id;
    const blackId = (black.body as { data: { id: string } }).data.id;
    const cleared = await http().patch(`/api/v1/admin/variants/${chromeId}`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: false,
    });
    expect(cleared.status).toBe(422);
    expect((cleared.body as { error: { code: string; message: string } }).error.code).toBe('VALIDATION_FAILED');
    expect(await prisma.variant.count({ where: { productId, isDefault: true } })).toBe(1);

    const statuses: number[] = [];
    for (let i = 0; i < 15; i += 1) {
      const pair = await Promise.all([
        http().patch(`/api/v1/admin/variants/${chromeId}`).set('Cookie', productManager).send({
          name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
        }),
        http().patch(`/api/v1/admin/variants/${blackId}`).set('Cookie', productManager).send({
          name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: true,
        }),
      ]);
      statuses.push(pair[0].status, pair[1].status);
      expect(await prisma.variant.count({ where: { productId, isDefault: true } })).toBe(1);
    }
    expect(statuses.every((status) => status !== 500)).toBe(true);
  });
});

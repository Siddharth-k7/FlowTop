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
import { SETTING_SEEDS } from '../src/settings/setting-definitions';
import { seedMissingSettings } from '../src/settings/settings.repository';
import type { AdminProduct, Paginated, SettingItem } from '../../shared/types/src/index';
import { createAccount } from './accounts';
import { resetDatabase } from './database';

/**
 * What the admin app depends on, checked against the real API (no mock mode): the exact bodies it sends are
 * accepted, and what comes back has the shape of the shared types. The admin sends only the keys in
 * PRODUCT_BODY (admin/src/lib/product-body.ts, checked against the DTO by admin/src/__tests__/product-body.test.ts).
 */
const PASSWORD = `test-only-${randomUUID()}`;
const PRODUCTS = '/api/v1/admin/products';
const SETTINGS = '/api/v1/admin/settings';

/** The columns of the product row, i.e. the keys of AdminProduct. */
const ADMIN_PRODUCT_KEYS = [
  'id', 'name', 'sku', 'slug', 'categoryId', 'shortDescription', 'fullDescription', 'price', 'salePrice', 'taxClass', 'isPurchasable', 'isAvailable',
  'availabilityMessage', 'isFeatured', 'isNewArrival', 'isBestseller', 'status', 'publishedAt', 'seoTitle', 'seoDescription', 'seoCanonical',
  'seoShareImageId', 'modelUrl', 'videoUrl', 'createdAt', 'updatedAt',
] satisfies (keyof AdminProduct)[];

/** Exactly what ProductEditor's toBody builds for a new product. */
const body = (over: Record<string, unknown> = {}) => ({
  name: 'Opel Basin Mixer', sku: `FT-${randomUUID().slice(0, 8)}`, slug: `opel-${randomUUID().slice(0, 8)}`, shortDescription: 'Solid brass.', fullDescription: '',
  price: 450000, salePrice: null, isPurchasable: true, isAvailable: true, availabilityMessage: null, seoTitle: '', seoDescription: '', seoCanonical: null, ...over,
});

describe('admin app against the real API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let superAdmin: string;
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
    await seedMissingSettings(prisma, SETTING_SEEDS);
    app.get(RateLimiter).clear();
    superAdmin = await signedIn('super_admin');
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

  describe('products', () => {
    it('accepts the body the editor sends, and returns the whole row, with every AdminProduct key and no other', async () => {
      const res = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body()).expect(201);

      const product = (res.body as { data: AdminProduct }).data;
      expect(Object.keys(product).sort()).toEqual([...ADMIN_PRODUCT_KEYS].sort());
      expect(product).toMatchObject({ name: 'Opel Basin Mixer', price: 450000, salePrice: null, status: 'draft', publishedAt: null, categoryId: null });
      expect(typeof product.createdAt).toBe('string');
    });

    it('refuses a body with fields outside the DTO, which is why the editor never sends status or dates', async () => {
      const res = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body({ status: 'published' })).expect(422);

      expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED');
    });

    it('GET one adds the category summary and the counts the editor and the dashboard read', async () => {
      const created = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body()).expect(201);
      const id = (created.body as { data: AdminProduct }).data.id;

      const res = await http().get(`${PRODUCTS}/${id}`).set('Cookie', superAdmin).expect(200);

      expect((res.body as { data: AdminProduct }).data).toMatchObject({ id, category: null, _count: { specifications: 0, media: 0, variants: 0, placements: 0 } });
    });

    async function withCategory(over: Record<string, unknown> = {}) {
      const category = await prisma.category.create({ data: { name: 'Basin Mixers', slug: `basin-${randomUUID().slice(0, 8)}`, status: 'draft' } });
      return body({ categoryId: category.id, ...over });
    }

    it('lists with the pagination envelope; the admin reads `data` and asks for the next page', async () => {
      await http().post(PRODUCTS).set('Cookie', superAdmin).send(body()).expect(201);

      const res = await http().get(PRODUCTS).set('Cookie', superAdmin).expect(200);

      const page = res.body as Paginated<AdminProduct>;
      expect(page.data).toHaveLength(1);
      expect(page.meta).toEqual({ page: 1, perPage: 25, total: 1, totalPages: 1 });
    });

    it('creates a category for the product form', async () => {
      const res = await http().post('/api/v1/admin/categories').set('Cookie', superAdmin).send({ name: 'Basin Mixers', slug: `basin-${randomUUID().slice(0, 8)}` }).expect(201);
      expect((res.body as { data: { name: string; status: string } }).data).toMatchObject({ name: 'Basin Mixers', status: 'draft' });
    });

    it('refuses to publish until a category is chosen', async () => {
      const created = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body()).expect(201);
      const id = (created.body as { data: AdminProduct }).data.id;
      const res = await http().post(`${PRODUCTS}/${id}/publish`).set('Cookie', superAdmin).expect(422);
      expect((res.body as { error: { fields: Record<string, string> } }).error.fields.categoryId).toBe('Choose a category before publishing.');
    });

    it('edit, publish, unpublish and archive move status as the editor expects, and say so in the response', async () => {
      const created = await http().post(PRODUCTS).set('Cookie', superAdmin).send(await withCategory()).expect(201);
      const id = (created.body as { data: AdminProduct }).data.id;

      const edited = await http().patch(`${PRODUCTS}/${id}`).set('Cookie', superAdmin).send(body({ name: 'Opel Basin Mixer II', sku: (created.body as { data: AdminProduct }).data.sku, slug: (created.body as { data: AdminProduct }).data.slug })).expect(200);
      expect((edited.body as { data: AdminProduct }).data.name).toBe('Opel Basin Mixer II');

      const published = await http().post(`${PRODUCTS}/${id}/publish`).set('Cookie', superAdmin).expect(201);
      expect((published.body as { data: AdminProduct }).data).toMatchObject({ status: 'published', publishedAt: expect.any(String) as string });
      const unpublished = await http().post(`${PRODUCTS}/${id}/unpublish`).set('Cookie', superAdmin).expect(201);
      expect((unpublished.body as { data: AdminProduct }).data.status).toBe('unpublished');
      const archived = await http().post(`${PRODUCTS}/${id}/archive`).set('Cookie', superAdmin).expect(201);
      expect((archived.body as { data: AdminProduct }).data.status).toBe('archived');
    });

    it('a duplicate SKU is a 422 with fields.sku, shown under the SKU box', async () => {
      const first = body();
      await http().post(PRODUCTS).set('Cookie', superAdmin).send(first).expect(201);

      const res = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body({ sku: first.sku })).expect(422);

      expect((res.body as { error: { fields: Record<string, string> } }).error.fields.sku).toBe('This SKU is already in use.');
    });

    it('a duplicate slug is a 422 with fields.slug, not fields.sku', async () => {
      const first = body();
      await http().post(PRODUCTS).set('Cookie', superAdmin).send(first).expect(201);
      const res = await http().post(PRODUCTS).set('Cookie', superAdmin).send(body({ slug: first.slug })).expect(422);
      expect((res.body as { error: { fields: Record<string, string> } }).error.fields.slug).toBe('This web address is already in use.');
      expect((res.body as { error: { fields?: Record<string, string> } }).error.fields?.sku).toBeUndefined();
    });

    it('product_manager creates and publishes; marketing_admin can read but not create, publish or archive', async () => {
      const created = await http().post(PRODUCTS).set('Cookie', productManager).send(await withCategory()).expect(201);
      const id = (created.body as { data: AdminProduct }).data.id;
      await http().post(`${PRODUCTS}/${id}/publish`).set('Cookie', productManager).expect(201);

      await http().get(PRODUCTS).set('Cookie', marketingAdmin).expect(200);
      await http().post(PRODUCTS).set('Cookie', marketingAdmin).send(body()).expect(403);
      await http().post(`${PRODUCTS}/${id}/publish`).set('Cookie', marketingAdmin).expect(403);
      await http().post(`${PRODUCTS}/${id}/archive`).set('Cookie', marketingAdmin).expect(403);
    });
  });

  describe('settings', () => {
    it('GET returns SettingItem[] for exactly the backend keys, and the screen is built from that list', async () => {
      const res = await http().get(SETTINGS).set('Cookie', superAdmin).expect(200);

      const items = (res.body as { data: SettingItem[] }).data;
      expect(items.map((s) => s.key)).toEqual(Object.keys(SETTING_SEEDS));
      for (const item of items) expect(Object.keys(item).sort()).toEqual(['description', 'key', 'public', 'updatedAt', 'updatedBy', 'value']);
    });

    it('PUT takes what the screen sends: a list stays a list, text stays text, and the response is the saved item', async () => {
      const list = await http().put(SETTINGS).set('Cookie', superAdmin).send({ key: 'email.recipients.orders', value: ['orders@flowtop.in', 'ops@flowtop.in'] }).expect(200);
      expect((list.body as { data: SettingItem }).data).toMatchObject({ key: 'email.recipients.orders', value: ['orders@flowtop.in', 'ops@flowtop.in'] });

      const text = await http().put(SETTINGS).set('Cookie', superAdmin).send({ key: 'whatsapp.number', value: '+919876543210' }).expect(200);
      expect((text.body as { data: SettingItem }).data.value).toBe('+919876543210');

      const cleared = await http().put(SETTINGS).set('Cookie', superAdmin).send({ key: 'whatsapp.number', value: null }).expect(200);
      expect((cleared.body as { data: SettingItem }).data.value).toBeNull();
    });

    it('a value the key refuses is a 422 with fields.value; an unknown key is a 422 with fields.key', async () => {
      const bad = await http().put(SETTINGS).set('Cookie', superAdmin).send({ key: 'whatsapp.number', value: '12345' }).expect(422);
      expect((bad.body as { error: { fields: Record<string, string> } }).error.fields.value).toMatch(/international format/);

      const unknown = await http().put(SETTINGS).set('Cookie', superAdmin).send({ key: 'emailFrom', value: 'a@b.in' }).expect(422);
      expect((unknown.body as { error: { fields: Record<string, string> } }).error.fields.key).toEqual(expect.any(String));
    });

    it('product_manager and marketing_admin cannot read or write settings', async () => {
      for (const cookie of [productManager, marketingAdmin]) {
        await http().get(SETTINGS).set('Cookie', cookie).expect(403);
        await http().put(SETTINGS).set('Cookie', cookie).send({ key: 'whatsapp.number', value: null }).expect(403);
      }
    });
  });

  describe('pages, journal and orders', () => {
    it('publishes a page without writing the draft status back', async () => {
      const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'Launch', slug: `launch-${randomUUID().slice(0, 6)}` }).expect(201);
      const id = (created.body as { data: { id: string } }).data.id;
      const section = await http().post(`/api/v1/admin/pages/${id}/sections`).set('Cookie', marketingAdmin).send({ type: 'hero', config: { headline: 'Hello', layout: { background: 'white', width: 'contained' } }, visible: true }).expect(201);
      expect((section.body as { data: { id: string } }).data.id).toEqual(expect.any(String));
      const published = await http().post(`/api/v1/admin/pages/${id}/publish`).set('Cookie', marketingAdmin).expect(201);
      expect((published.body as { data: { status: string; sections: unknown[] } }).data.status).toBe('published');
      expect((published.body as { data: { sections: unknown[] } }).data.sections).toHaveLength(1);
      const again = await http().get(`/api/v1/admin/pages/${id}`).set('Cookie', marketingAdmin).expect(200);
      expect((again.body as { data: { status: string } }).data.status).toBe('published');
    });

    it('rejects a section preset outside the contract', async () => {
      const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'Bad', slug: `bad-${randomUUID().slice(0, 6)}` }).expect(201);
      const id = (created.body as { data: { id: string } }).data.id;
      await http().post(`/api/v1/admin/pages/${id}/sections`).set('Cookie', marketingAdmin).send({ type: 'hero', config: { layout: { background: 'rainbow' } } }).expect(422);
    });

    it('publishes a journal article through POST /publish', async () => {
      const created = await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({ title: 'Finish', slug: `finish-${randomUUID().slice(0, 6)}`, category: 'Guides', body: 'Brass lasts.', excerpt: '' }).expect(201);
      const id = (created.body as { data: { id: string; status: string } }).data.id;
      expect((created.body as { data: { status: string } }).data.status).toBe('draft');
      const published = await http().post(`/api/v1/admin/journal/${id}/publish`).set('Cookie', marketingAdmin).expect(201);
      expect((published.body as { data: { status: string } }).data.status).toBe('published');
      await http().post(`/api/v1/admin/journal/${id}/publish`).set('Cookie', productManager).expect(403);
    });

    it('builds the orders CSV on the server and neutralises formula cells', async () => {
      const product = await prisma.product.create({ data: { name: 'Tap', sku: `SKU-${randomUUID().slice(0, 6)}`, slug: `tap-${randomUUID().slice(0, 6)}`, price: 100 } });
      await prisma.order.create({ data: {
        reference: `FT-${randomUUID().slice(0, 6)}`, customerName: '=cmd', customerEmail: 'a@flowtop.in', customerPhone: '1',
        deliveryAddressLine1: '1 Road', deliveryCity: 'Pune', deliveryState: 'MH', deliveryPin: '411001',
        subtotal: 100, shipping: 0, tax: 0, total: 100, paymentStatus: 'paid', orderStatus: 'received',
        items: { create: { productId: product.id, productName: 'Tap', sku: product.sku, unitPrice: 100, quantity: 1, lineTotal: 100 } },
      } });
      const res = await http().get('/api/v1/admin/orders/export').set('Cookie', superAdmin).expect(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(String(res.text)).toContain(`"'=cmd"`);
      await http().get('/api/v1/admin/orders/export').set('Cookie', productManager).expect(403);
    });
  });
});

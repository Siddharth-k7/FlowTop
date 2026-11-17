/**
 * Independent adversarial cases for PR 24 head ed190e2515de9dbe75d6f84ff88bced7c1fcdccb.
 * Not part of the repository. Place at backend/test/audit-adversarial.e2e-spec.ts to run.
 * Assertions are the behaviour the previous audit required, plus cases the rewritten
 * branch spec dropped (two-section duplicate reorder, partial lists, bad nav before
 * deleteMany, preset values inside arrays, concurrent default clears).
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

describe('PR24 independent adversarial cases', () => {
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

  const productBody = (over: Record<string, unknown> = {}) => ({
    name: 'Opel Basin Mixer',
    sku: `FT-${randomUUID().slice(0, 8)}`,
    slug: `opel-${randomUUID().slice(0, 8)}`,
    shortDescription: 'Solid brass.',
    fullDescription: '',
    price: 450000,
    salePrice: null,
    isPurchasable: true,
    isAvailable: true,
    availabilityMessage: null,
    seoTitle: '',
    seoDescription: '',
    seoCanonical: null,
    ...over,
  });

  async function makeProduct(over: Record<string, unknown> = {}) {
    const res = await http().post('/api/v1/admin/products').set('Cookie', productManager).send(productBody(over)).expect(201);
    return (res.body as { data: { id: string } }).data;
  }

  async function makeCategory() {
    const res = await http().post('/api/v1/admin/categories').set('Cookie', productManager).send({
      name: 'Basin Mixers', slug: `basin-${randomUUID().slice(0, 8)}`, description: '',
    }).expect(201);
    return (res.body as { data: { id: string } }).data;
  }

  async function makePage(cookie: string, title: string) {
    const res = await http().post('/api/v1/admin/pages').set('Cookie', cookie).send({
      title, slug: `${title.toLowerCase()}-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    return (res.body as { data: { id: string; slug: string } }).data;
  }

  async function addSection(pageId: string, type: string, config: Record<string, unknown>) {
    const res = await http().post(`/api/v1/admin/pages/${pageId}/sections`).set('Cookie', marketingAdmin).send({ type, config, visible: true }).expect(201);
    return (res.body as { data: { id: string } }).data.id;
  }

  it('creates a collection from the editor body, which omits status, and still rejects an explicit status', async () => {
    const editorDocument = { name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`, story: '', description: null, heroMediaId: null, status: 'draft' as const };
    const editorBody = { name: editorDocument.name, slug: editorDocument.slug, story: editorDocument.story ?? '', description: editorDocument.description ?? null, heroMediaId: editorDocument.heroMediaId || null };
    expect(editorBody).not.toHaveProperty('status');
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send(editorBody).expect(201);
    expect((created.body as { data: { status: string } }).data.status).toBe('draft');
    const sneak = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({ ...editorBody, slug: `pub-${randomUUID().slice(0, 6)}`, status: 'published' });
    expect(sneak.status).toBe(422);
    expect(await prisma.collection.count({ where: { status: 'published' } })).toBe(0);
  });

  it('keeps the rank the editor wrote on the next save, and a story save does not unpublish', async () => {
    const first = await makeProduct();
    const second = await makeProduct();
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`, story: '', description: null, heroMediaId: null,
    }).expect(201);
    const id = (created.body as { data: { id: string; slug: string } }).data.id;
    const slug = (created.body as { data: { slug: string } }).data.slug;
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: second.id, position: 1 }, { productId: first.id, position: 2 }],
    }).expect(200);
    const written = [first.id, second.id];
    const patched = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({
      name: 'Opel renamed', slug, story: '<p>Story</p>', description: null, heroMediaId: null,
    }).expect(200);
    const patchIds = (patched.body as { data: { productIds: string[] } }).data.productIds;
    expect(patchIds).toEqual([second.id, first.id]);
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: written.map((productId, index) => ({ productId, position: index + 1 })),
    }).expect(200);
    const fresh = await http().get(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).expect(200);
    const held = (fresh.body as { data: { productIds: string[] } }).data.productIds;
    expect(held).toEqual(written);
    expect(held).not.toEqual(patchIds);
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: held.map((productId, index) => ({ productId, position: index + 1 })),
    }).expect(200);
    const rows = await prisma.collectionProduct.findMany({ where: { collectionId: id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.productId)).toEqual(written);

    await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'published' }).expect(200);
    const story = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({
      name: 'Opel live', slug, story: '<p>Live</p>', description: null, heroMediaId: null,
    }).expect(200);
    expect((story.body as { data: { status: string; name: string; productIds: string[] } }).data).toMatchObject({
      status: 'published', name: 'Opel live', productIds: written,
    });
  });

  it('follows the page editor sync twice and keeps both sections', async () => {
    const page = await makePage(marketingAdmin, 'Launch');
    const idA = await addSection(page.id, 'hero', { headline: 'A', layout: { background: 'white' } });
    await http().patch(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).send({ title: 'Launch', slug: page.slug }).expect(200);

    const sync = async (local: { id: string; type: string; config: Record<string, unknown> }[]) => {
      const current = await http().get(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).expect(200);
      const remote = (current.body as { data: { sections: { id: string }[] } }).data.sections;
      for (const gone of remote) {
        if (!local.some((section) => section.id === gone.id)) {
          await http().delete(`/api/v1/admin/sections/${gone.id}`).set('Cookie', marketingAdmin).expect(200);
        }
      }
      const ids: string[] = [];
      for (const section of local) {
        const known = /^[0-9a-f-]{36}$/i.test(section.id) && remote.some((item) => item.id === section.id);
        if (known) {
          await http().patch(`/api/v1/admin/sections/${section.id}`).set('Cookie', marketingAdmin).send({ config: section.config, visible: true }).expect(200);
          ids.push(section.id);
        } else {
          const created = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
            type: section.type, config: section.config, visible: true,
          }).expect(201);
          ids.push((created.body as { data: { id: string } }).data.id);
        }
      }
      if (ids.length) await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids }).expect(201);
      const fresh = await http().get(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).expect(200);
      return (fresh.body as { data: { sections: { id: string; type: string; config: Record<string, unknown> }[] } }).data.sections;
    };

    const afterFirst = await sync([
      { id: idA, type: 'hero', config: { headline: 'A', layout: { background: 'white' } } },
      { id: 'sec-temp', type: 'cta', config: { heading: 'B', layout: { background: 'white' } } },
    ]);
    expect(afterFirst.map((section) => section.config.headline ?? section.config.heading)).toEqual(['A', 'B']);
    const afterSecond = await sync(afterFirst.map((section) => ({ id: section.id, type: section.type, config: section.config })));
    expect(afterSecond.map((section) => section.id)).toEqual(afterFirst.map((section) => section.id));
    expect(await prisma.section.count({ where: { pageId: page.id } })).toBe(2);
  });

  it('rejects a partial or duplicate section reorder and leaves positions alone', async () => {
    const page = await makePage(marketingAdmin, 'A');
    const a = await addSection(page.id, 'hero', { headline: 'A' });
    const b = await addSection(page.id, 'cta', { heading: 'B' });
    const partial = await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [b] });
    expect(partial.status).toBe(422);
    const dup = await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [a, a] });
    expect(dup.status).toBe(422);
    const empty = await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [] });
    expect(empty.status).toBe(422);
    const rows = await prisma.section.findMany({ where: { pageId: page.id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => [row.id, row.position])).toEqual([[a, 1], [b, 2]]);
    const reversed = await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [b, a] }).expect(201);
    expect((reversed.body as { data: { reordered: boolean } }).data.reordered).toBe(true);
    const after = await prisma.section.findMany({ where: { pageId: page.id }, orderBy: { position: 'asc' } });
    expect(after.map((row) => row.id)).toEqual([b, a]);
    expect(after.every((row) => row.pageId === page.id)).toBe(true);
  });

  it('rejects variant reorder duplicates, partial lists, and empty lists without moving the owner', async () => {
    const owner = await makeProduct();
    const other = await makeProduct();
    const chrome = await http().post(`/api/v1/admin/products/${owner.id}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
    }).expect(201);
    const black = await http().post(`/api/v1/admin/products/${owner.id}/variants`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: false,
    }).expect(201);
    const chromeId = (chrome.body as { data: { id: string } }).data.id;
    const blackId = (black.body as { data: { id: string } }).data.id;
    expect((await http().post(`/api/v1/admin/products/${owner.id}/variants/reorder`).set('Cookie', productManager).send({ ids: [chromeId] })).status).toBe(422);
    expect((await http().post(`/api/v1/admin/products/${owner.id}/variants/reorder`).set('Cookie', productManager).send({ ids: [blackId, blackId] })).status).toBe(422);
    expect((await http().post(`/api/v1/admin/products/${owner.id}/variants/reorder`).set('Cookie', productManager).send({ ids: [] })).status).toBe(422);
    expect((await http().post(`/api/v1/admin/products/${other.id}/variants/reorder`).set('Cookie', productManager).send({ ids: [blackId, chromeId] })).status).toBe(422);
    const rows = await prisma.variant.findMany({ where: { productId: owner.id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.name)).toEqual(['Chrome', 'Matte Black']);
    expect(rows.map((row) => row.position)).toEqual([1, 2]);
    expect(await prisma.auditEvent.count({ where: { action: 'reorder', entityType: 'variant' } })).toBe(0);
  });

  it('keeps exactly one default when a second finish becomes the default, and refuses to clear the last one', async () => {
    const product = await makeProduct();
    const chrome = await http().post(`/api/v1/admin/products/${product.id}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
    }).expect(201);
    const black = await http().post(`/api/v1/admin/products/${product.id}/variants`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: false,
    }).expect(201);
    const chromeId = (chrome.body as { data: { id: string } }).data.id;
    const blackId = (black.body as { data: { id: string } }).data.id;
    await http().patch(`/api/v1/admin/variants/${blackId}`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: true,
    }).expect(200);
    const defaults = await prisma.variant.findMany({ where: { productId: product.id, isDefault: true } });
    expect(defaults.map((row) => row.id)).toEqual([blackId]);
    const clearLast = await http().patch(`/api/v1/admin/variants/${blackId}`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: false,
    });
    expect(clearLast.status).toBe(422);
    expect(await prisma.variant.count({ where: { productId: product.id, isDefault: true } })).toBe(1);
    const clearOther = await http().patch(`/api/v1/admin/variants/${chromeId}`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: false,
    }).expect(200);
    expect((clearOther.body as { data: { isDefault: boolean } }).data.isDefault).toBe(false);
    expect(await prisma.variant.count({ where: { productId: product.id, isDefault: true } })).toBe(1);
  });

  it('keeps one default when two finishes are made the default at the same time', async () => {
    const product = await makeProduct();
    const chrome = await http().post(`/api/v1/admin/products/${product.id}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
    }).expect(201);
    const black = await http().post(`/api/v1/admin/products/${product.id}/variants`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: false,
    }).expect(201);
    const chromeId = (chrome.body as { data: { id: string } }).data.id;
    const blackId = (black.body as { data: { id: string } }).data.id;
    const [left, right] = await Promise.all([
      http().patch(`/api/v1/admin/variants/${chromeId}`).set('Cookie', productManager).send({
        name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
      }),
      http().patch(`/api/v1/admin/variants/${blackId}`).set('Cookie', productManager).send({
        name: 'Matte Black', skuSuffix: 'MB', price: 470000, isAvailable: true, isDefault: true,
      }),
    ]);
    for (const res of [left, right]) expect(res.status).not.toBe(500);
    const defaults = await prisma.variant.count({ where: { productId: product.id, isDefault: true } });
    expect(defaults).toBe(1);
  });

  it('rejects a partial placement reorder that would duplicate positions, and duplicate ids', async () => {
    const category = await makeCategory();
    const first = await makeProduct();
    const second = await makeProduct();
    await http().post(`/api/v1/admin/products/${first.id}/placements`).set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id,
    }).expect(201);
    await http().post(`/api/v1/admin/products/${second.id}/placements`).set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id,
    }).expect(201);
    const rows = await prisma.placement.findMany({ where: { locationType: 'category', locationId: category.id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.position)).toEqual([1, 2]);
    const partial = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id, ids: [rows[1].id],
    });
    const afterPartial = await prisma.placement.findMany({ where: { locationType: 'category', locationId: category.id } });
    const positions = afterPartial.map((row) => row.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect(partial.status === 201 || partial.status === 422).toBe(true);
    if (partial.status === 201) {
      expect(positions).not.toEqual([1, 1]);
    }
    const dup = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id, ids: [rows[0].id, rows[0].id],
    });
    expect(dup.status).toBe(422);
    const empty = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id, ids: [],
    });
    expect(empty.status).toBe(422);
    const swapped = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id, ids: [rows[1].id, rows[0].id],
    }).expect(201);
    expect((swapped.body as { data: { reordered: boolean } }).data.reordered).toBe(true);
    const after = await prisma.placement.findMany({ where: { locationId: category.id }, orderBy: { position: 'asc' } });
    expect(after.map((row) => row.id)).toEqual([rows[1].id, rows[0].id]);
    expect(after.every((row) => row.locationType === 'category' && row.locationId === category.id)).toBe(true);
  });

  it('rejects location types that do not own the id, including homepage keys on the wrong type', async () => {
    const category = await makeCategory();
    const product = await makeProduct();
    const cases: { locationType: string; locationId: string }[] = [
      { locationType: 'collection', locationId: category.id },
      { locationType: 'category', locationId: 'featured' },
      { locationType: 'homepage_section', locationId: category.id },
      { locationType: 'homepage_section', locationId: 'Featured' },
      { locationType: 'campaign_page', locationId: category.id },
      { locationType: 'related', locationId: category.id },
    ];
    for (const body of cases) {
      const res = await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send(body);
      expect(res.status).toBe(422);
    }
    expect(await prisma.placement.count({ where: { productId: product.id } })).toBe(0);
    const missing = await http().post(`/api/v1/admin/products/${randomUUID()}/placements`).set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured',
    });
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { message: string } }).error.message).not.toBe('This product is already placed there.');
  });

  it('rejects preset values that are not strings, including style inside a button list, and still stores a real gallery', async () => {
    const page = await makePage(marketingAdmin, 'Bad');
    const boolBg = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', config: { layout: { background: true }, headline: 'Hi' }, visible: true,
    });
    expect(boolBg.status).toBe(422);
    const badStyle = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero',
      config: { headline: 'Hi', layout: { background: 'white' }, ctas: [{ label: 'Go', href: '/products', style: true }] },
      visible: true,
    });
    expect(badStyle.status).toBe(422);
    const rainbowStyle = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero',
      config: { headline: 'Hi', layout: { background: 'white' }, ctas: [{ label: 'Go', href: '/products', style: 'rainbow' }] },
      visible: true,
    });
    expect(rainbowStyle.status).toBe(422);
    const script = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'cta',
      config: { heading: 'Go', layout: { background: 'white' }, cta: { label: 'Go', href: 'javascript:alert(1)' } },
      visible: true,
    });
    expect(script.status).toBe(422);
    expect(await prisma.section.count({ where: { pageId: page.id } })).toBe(0);
    const gallery = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'gallery', config: { heading: 'Room', columns: 3, showCaptions: true, layout: { background: 'white' } }, visible: true,
    }).expect(201);
    expect((gallery.body as { data: { config: { columns: number; showCaptions: boolean } } }).data.config.columns).toBe(3);
    const badColumns = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'gallery', config: { columns: '3' },
    });
    expect(badColumns.status).toBe(422);
    const wide = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'gallery', config: { columns: 5 },
    });
    expect(wide.status).toBe(422);
  });

  it('rolls back every id in a bulk publish, unpublish, and archive when a later id is refused', async () => {
    const category = await makeCategory();
    const ready = await makeProduct({ categoryId: category.id, price: 450000 });
    const second = await makeProduct({ categoryId: category.id, price: 450000 });
    const blocked = await makeProduct({ price: 450000 });
    const publish = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({
      ids: [ready.id, blocked.id, second.id], action: 'publish',
    });
    expect(publish.status).toBe(422);
    expect(await prisma.product.count({ where: { id: { in: [ready.id, second.id, blocked.id] }, status: 'published' } })).toBe(0);
    expect(await prisma.auditEvent.count({ where: { action: 'publish', entityType: 'product', entityId: { in: [ready.id, second.id] } } })).toBe(0);

    await http().post(`/api/v1/admin/products/${ready.id}/publish`).set('Cookie', productManager).expect(201);
    await http().post(`/api/v1/admin/products/${second.id}/publish`).set('Cookie', productManager).expect(201);
    const unpublish = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({
      ids: [ready.id, blocked.id], action: 'unpublish',
    });
    expect(unpublish.status).toBe(422);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ready.id } })).status).toBe('published');
    const archive = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({
      ids: [second.id, blocked.id], action: 'archive',
    });
    expect(archive.status).toBe(422);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: second.id } })).status).toBe('published');

    const empty = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({ ids: [], action: 'publish' });
    expect(empty.status).toBe(422);
    const dup = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({ ids: [ready.id, ready.id], action: 'unpublish' });
    expect(dup.status).toBeGreaterThanOrEqual(200);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ready.id } })).status).toBe('unpublished');
  });

  it('rejects an illegal product transition with 422, and a second publish is not a 500', async () => {
    const category = await makeCategory();
    const product = await makeProduct({ categoryId: category.id, price: 450000 });
    const archived = await http().post(`/api/v1/admin/products/${product.id}/archive`).set('Cookie', productManager);
    expect(archived.status).toBe(422);
    expect((archived.body as { error: { code: string } }).error.code).not.toBe('SERVER_ERROR');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe('draft');
    await http().post(`/api/v1/admin/products/${product.id}/publish`).set('Cookie', productManager).expect(201);
    const again = await http().post(`/api/v1/admin/products/${product.id}/publish`).set('Cookie', productManager);
    expect(again.status).toBeGreaterThanOrEqual(200);
    expect(again.status).toBeLessThan(300);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe('published');
  });

  it('keeps a three-level menu and does not delete the previous menu when a deeper or bad node is invalid', async () => {
    await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Old', linkType: 'external', destination: 'https://flowtop.example/old', children: [] }],
      footer: [],
    }).expect(200);
    const badGrand = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop', linkType: 'external', destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass', linkType: 'external', destination: 'https://flowtop.example/brass',
          children: [{ label: 'Grand', linkType: 'external', destination: 'javascript:alert(1)', children: [] }],
        }],
      }],
      footer: [],
    });
    expect(badGrand.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Grand' } })).toBe(0);

    const page = await makePage(marketingAdmin, 'About');
    const wrongType = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Nope', linkType: 'category', destination: page.id, children: [] }],
      footer: [],
    });
    expect(wrongType.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);

    const four = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop', linkType: 'external', destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass', linkType: 'external', destination: 'https://flowtop.example/brass',
          children: [{
            label: 'Grand', linkType: 'external', destination: 'https://flowtop.example/grand',
            children: [{ label: 'Great', linkType: 'external', destination: 'javascript:alert(1)', children: [] }],
          }],
        }],
      }],
      footer: [],
    });
    expect(four.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Great' } })).toBe(0);

    const ok = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop', linkType: 'external', destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass', linkType: 'external', destination: 'https://flowtop.example/brass',
          children: [{ label: 'Grand', linkType: 'page', destination: page.id, children: [] }],
        }],
      }],
      footer: [],
    }).expect(200);
    const header = (ok.body as { data: { header: { label: string; children: { label: string; children: { label: string; linkType: string; destination: string }[] }[] }[] } }).data.header;
    expect(header[0]?.children[0]?.children[0]).toMatchObject({ label: 'Grand', linkType: 'page', destination: page.id });
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(0);
  });

  it('routes collection status through the state machine and does not write the story when the move is illegal', async () => {
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    const skipped = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ name: 'Renamed', status: 'archived' });
    expect(skipped.status).toBe(422);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).name).toBe('Opel');
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).status).toBe('draft');
    await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'published' }).expect(200);
    const back = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'draft' });
    expect(back.status).toBe(422);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).status).toBe('published');
    await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'unpublished' }).expect(200);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).status).toBe('unpublished');
    await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'published' }).expect(200);
    await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'archived' }).expect(200);
    const dead = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'published' });
    expect(dead.status).toBe(422);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).status).toBe('archived');
  });

  it('rejects unknown journal statuses, including a different case, and filters a real one', async () => {
    await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({
      title: 'Draft', slug: `draft-${randomUUID().slice(0, 6)}`, body: 'Not ready.',
    }).expect(201);
    const published = await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({
      title: 'Live', slug: `live-${randomUUID().slice(0, 6)}`, body: 'Ready.',
    }).expect(201);
    await http().post(`/api/v1/admin/journal/${(published.body as { data: { id: string } }).data.id}/publish`).set('Cookie', marketingAdmin).expect(201);
    const again = await http().post(`/api/v1/admin/journal/${(published.body as { data: { id: string } }).data.id}/publish`).set('Cookie', marketingAdmin);
    expect(again.status).toBe(201);
    const filtered = await http().get('/api/v1/admin/journal?status=published').set('Cookie', marketingAdmin).expect(200);
    expect((filtered.body as { meta: { total: number } }).meta.total).toBe(1);
    for (const status of ['nope', 'Published', '']) {
      const res = await http().get(`/api/v1/admin/journal?status=${status}`).set('Cookie', marketingAdmin);
      expect(res.status).toBe(422);
    }
  });

  it('exports only rows that match status, payment, search, and the date window, and still prefixes formulas', async () => {
    const product = await prisma.product.create({ data: { name: 'Tap', sku: `SKU-${randomUUID().slice(0, 6)}`, slug: `tap-${randomUUID().slice(0, 6)}`, price: 100 } });
    const base = {
      customerEmail: 'a@flowtop.in', customerPhone: '1', deliveryAddressLine1: '1 Road', deliveryCity: 'Pune', deliveryState: 'MH', deliveryPin: '411001',
      subtotal: 100, shipping: 0, tax: 0, total: 100,
      items: { create: { productId: product.id, productName: 'Tap', sku: product.sku, unitPrice: 100, quantity: 1, lineTotal: 100 } },
    };
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: '\t=cmd', orderStatus: 'received', paymentStatus: 'paid', createdAt: new Date('2026-01-15T00:00:00.000Z') } });
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'Paid', orderStatus: 'shipped', paymentStatus: 'paid', createdAt: new Date('2026-01-20T00:00:00.000Z') } });
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'Owes', orderStatus: 'received', paymentStatus: 'pending', createdAt: new Date('2026-03-01T00:00:00.000Z') } });
    const byStatus = await http().get('/api/v1/admin/orders/export?status=received').set('Cookie', superAdmin).expect(200);
    expect(byStatus.text).toContain(`"'\t=cmd"`);
    expect(byStatus.text).not.toContain('Paid');
    expect(byStatus.text).toContain('Owes');
    const byPayment = await http().get('/api/v1/admin/orders/export?status=received&paymentStatus=paid').set('Cookie', superAdmin).expect(200);
    expect(byPayment.text).toContain(`"'\t=cmd"`);
    expect(byPayment.text).not.toContain('Owes');
    const bySearch = await http().get('/api/v1/admin/orders/export?search=Owes').set('Cookie', superAdmin).expect(200);
    expect(bySearch.text).toContain('Owes');
    expect(bySearch.text).not.toContain('Paid');
    const byDate = await http().get('/api/v1/admin/orders/export?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z').set('Cookie', superAdmin).expect(200);
    expect(byDate.text).toContain(`"'\t=cmd"`);
    expect(byDate.text).toContain('Paid');
    expect(byDate.text).not.toContain('Owes');
    const bare = await http().get('/api/v1/admin/orders/export?from=2026-01-01&to=2026-02-01').set('Cookie', superAdmin);
    expect(bare.status).toBe(422);
    const backwards = await http().get('/api/v1/admin/orders?from=2026-02-01T00:00:00Z&to=2026-01-01T00:00:00Z').set('Cookie', superAdmin);
    expect(backwards.status).toBe(422);
    const unknown = await http().get('/api/v1/admin/orders/export?status=received&format=xlsx').set('Cookie', superAdmin);
    expect(unknown.status).toBe(422);
  });

  it('does not let a duplicate membership or an unknown product erase the previous rank', async () => {
    const product = await makeProduct();
    const other = await makeProduct();
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: product.id, position: 1 }, { productId: other.id, position: 2 }],
    }).expect(200);
    const dup = await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: product.id, position: 1 }, { productId: product.id, position: 2 }],
    });
    expect(dup.status).toBeGreaterThanOrEqual(400);
    const unknown = await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: randomUUID(), position: 1 }],
    });
    expect(unknown.status).toBeGreaterThanOrEqual(400);
    const rows = await prisma.collectionProduct.findMany({ where: { collectionId: id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.productId)).toEqual([product.id, other.id]);
    const list = await http().get('/api/v1/admin/collections').set('Cookie', productManager).expect(200);
    const listed = (list.body as { data: { id: string; productIds: string[] }[] }).data.find((item) => item.id === id);
    expect(listed?.productIds).toEqual([product.id, other.id]);
  });

  it('names delete conflicts and keeps the row, and hides orders from a marketing admin', async () => {
    const parent = await prisma.category.create({ data: { name: 'Parent', slug: `parent-${randomUUID().slice(0, 6)}`, status: 'draft' } });
    await prisma.category.create({ data: { name: 'Child', slug: `child-${randomUUID().slice(0, 6)}`, status: 'draft', parentId: parent.id } });
    const categoryDelete = await http().delete(`/api/v1/admin/categories/${parent.id}`).set('Cookie', productManager);
    expect(categoryDelete.status).toBe(409);
    expect((categoryDelete.body as { error: { message: string } }).error.message).toBe('This category still has subcategories. Move them first.');
    expect(await prisma.category.count({ where: { id: parent.id } })).toBe(1);

    const product = await makeProduct();
    const created = await http().post(`/api/v1/admin/products/${product.id}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true,
    }).expect(201);
    const variantId = (created.body as { data: { id: string } }).data.id;
    await prisma.order.create({
      data: {
        reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'A', customerEmail: 'a@flowtop.in', customerPhone: '1',
        deliveryAddressLine1: '1 Road', deliveryCity: 'Pune', deliveryState: 'MH', deliveryPin: '411001',
        subtotal: 100, shipping: 0, tax: 0, total: 100, paymentStatus: 'paid', orderStatus: 'received',
        items: { create: { productId: product.id, variantId, productName: 'Tap', sku: 'SKU', unitPrice: 100, quantity: 1, lineTotal: 100 } },
      },
    });
    const finishDelete = await http().delete(`/api/v1/admin/variants/${variantId}`).set('Cookie', productManager);
    expect(finishDelete.status).toBe(409);
    expect((finishDelete.body as { error: { message: string } }).error.message).toBe('This finish is on an order, so it cannot be removed.');
    expect(await prisma.variant.count({ where: { id: variantId } })).toBe(1);

    const dash = await http().get('/api/v1/admin/dashboard').set('Cookie', marketingAdmin).expect(200);
    expect((dash.body as { data: { recentOrders: unknown[] } }).data.recentOrders).toEqual([]);
    await http().post('/api/v1/admin/products/bulk').set('Cookie', marketingAdmin).send({ ids: [product.id], action: 'publish' }).expect(403);
    await http().post(`/api/v1/admin/products/${product.id}/variants/reorder`).set('Cookie', marketingAdmin).send({ ids: [variantId] }).expect(403);
    await http().get('/api/v1/admin/orders/export?status=received').set('Cookie', productManager).expect(403);
    await http().post('/api/v1/admin/pages').set('Cookie', productManager).send({ title: 'X', slug: 'x' }).expect(403);
  });

  it('keeps section and variant parents under two overlapping reorders', async () => {
    const pageA = await makePage(marketingAdmin, 'A');
    const pageB = await makePage(marketingAdmin, 'B');
    const a1 = await addSection(pageA.id, 'hero', { headline: 'A1' });
    const a2 = await addSection(pageA.id, 'cta', { heading: 'A2' });
    const b1 = await addSection(pageB.id, 'hero', { headline: 'B1' });
    await Promise.all([
      http().post(`/api/v1/admin/pages/${pageA.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [a2, a1] }),
      http().post(`/api/v1/admin/pages/${pageA.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [a1, a2] }),
      http().post(`/api/v1/admin/pages/${pageB.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [a1, b1] }),
    ]);
    const onA = await prisma.section.findMany({ where: { pageId: pageA.id }, orderBy: { position: 'asc' } });
    expect(onA.map((row) => row.id).sort()).toEqual([a1, a2].sort());
    expect(new Set(onA.map((row) => row.position)).size).toBe(2);
    const stolen = await prisma.section.findUniqueOrThrow({ where: { id: a1 } });
    expect(stolen.pageId).toBe(pageA.id);
    expect(await prisma.section.count({ where: { pageId: pageB.id } })).toBe(1);
  });
});

/**
 * Regression tests for the PR 24 merge audit (head 7024224).
 * Each case is the request the audit reproduced. The assertion is the behaviour
 * after the fix: a bad write is rejected, and a second save keeps what the first save stored.
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

describe('PR24 merge-audit regressions', () => {
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
    return (res.body as { data: { id: string; status: string; categoryId: string | null } }).data;
  }

  async function makeCategory() {
    const res = await http().post('/api/v1/admin/categories').set('Cookie', productManager).send({
      name: 'Basin Mixers',
      slug: `basin-${randomUUID().slice(0, 8)}`,
      description: '',
    }).expect(201);
    return (res.body as { data: { id: string; status: string; parentId: string | null } }).data;
  }

  it('rejects status on collection create and still creates a draft when status is omitted', async () => {
    const slug = `opel-${randomUUID().slice(0, 6)}`;
    const rejected = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug, story: '', description: null, heroMediaId: null, status: 'draft',
    }).expect(422);
    expect((rejected.body as { error: { code: string; fields?: Record<string, string> } }).error.code).toBe('VALIDATION_FAILED');
    expect((rejected.body as { error: { fields: Record<string, string> } }).error.fields.status).toEqual(expect.any(String));
    expect(await prisma.collection.count()).toBe(0);

    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug, story: '', description: null, heroMediaId: null,
    }).expect(201);
    expect((created.body as { data: { status: string; productIds: string[] } }).data).toMatchObject({ status: 'draft', productIds: [] });
    expect(await prisma.collection.count()).toBe(1);
  });

  it('keeps a collection rank that the editor wrote, including on the next save of that same rank', async () => {
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
    // The PATCH is read before the membership write, so its productIds are the previous rank.
    expect((patched.body as { data: { productIds: string[] } }).data.productIds).toEqual([second.id, first.id]);

    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: written.map((productId, index) => ({ productId, position: index + 1 })),
    }).expect(200);
    const detail = await http().get(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).expect(200);
    const kept = (detail.body as { data: { productIds: string[] } }).data.productIds;
    expect(kept).toEqual(written);

    // The next save sends the rank the editor is holding, which is the rank just written.
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: kept.map((productId, index) => ({ productId, position: index + 1 })),
    }).expect(200);
    const rows = await prisma.collectionProduct.findMany({ where: { collectionId: id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.productId)).toEqual(written);
  });

  it('control: an invalid collection membership does not erase the previous rank', async () => {
    const product = await makeProduct();
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: product.id, position: 1 }],
    }).expect(200);
    const bad = await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: randomUUID(), position: 1 }],
    });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    const rows = await prisma.collectionProduct.findMany({ where: { collectionId: id } });
    expect(rows.map((row) => row.productId)).toEqual([product.id]);
  });

  it('keeps both sections when the editor reloads after sync and saves again', async () => {
    const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Launch', slug: `launch-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const page = (created.body as { data: { id: string; slug: string } }).data;
    const first = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', config: { headline: 'A', layout: { background: 'white' } }, visible: true,
    }).expect(201);
    const idA = (first.body as { data: { id: string } }).data.id;
    await http().patch(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).send({ title: 'Launch', slug: page.slug }).expect(200);

    const second = await http().post(`/api/v1/admin/pages/${page.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'cta', config: { heading: 'B', layout: { background: 'white' } }, visible: true,
    }).expect(201);
    const idB = (second.body as { data: { id: string } }).data.id;
    await http().post(`/api/v1/admin/pages/${page.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [idA, idB] }).expect(201);

    const fresh = await http().get(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).expect(200);
    const editorIds = (fresh.body as { data: { sections: { id: string }[] } }).data.sections.map((section) => section.id);
    expect(editorIds).toEqual([idA, idB]);

    const patchedAgain = await http().patch(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).send({
      title: 'Launch edited', slug: page.slug,
    }).expect(200);
    const remote = (patchedAgain.body as { data: { sections: { id: string }[] } }).data.sections;
    const held = new Set(editorIds);
    const removed = remote.filter((section) => !held.has(section.id));
    expect(removed).toEqual([]);
    const left = await prisma.section.findMany({ where: { pageId: page.id }, orderBy: { position: 'asc' } });
    expect(left.map((section) => section.id)).toEqual([idA, idB]);
  });

  it('republishes a published page without a 500 and keeps the saved title', async () => {
    const created = await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({
      title: 'Launch', slug: `launch-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const page = (created.body as { data: { id: string; slug: string } }).data;
    await http().post(`/api/v1/admin/pages/${page.id}/publish`).set('Cookie', marketingAdmin).expect(201);
    const saved = await http().patch(`/api/v1/admin/pages/${page.id}`).set('Cookie', marketingAdmin).send({
      title: 'Launch live edit', slug: page.slug,
    }).expect(200);
    expect((saved.body as { data: { title: string; status: string } }).data).toMatchObject({ title: 'Launch live edit', status: 'published' });
    const again = await http().post(`/api/v1/admin/pages/${page.id}/publish`).set('Cookie', marketingAdmin);
    expect(again.status).toBeGreaterThanOrEqual(200);
    expect(again.status).toBeLessThan(300);
    expect((again.body as { error?: { code: string } }).error?.code).not.toBe('SERVER_ERROR');
    const row = await prisma.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(row.title).toBe('Launch live edit');
    expect(row.status).toBe('published');
  });

  it('republishes a published journal article without a 500', async () => {
    const created = await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({
      title: 'Finish', slug: `finish-${randomUUID().slice(0, 6)}`, category: 'Guides', excerpt: '', body: 'Brass lasts.', heroImageId: null,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    await http().post(`/api/v1/admin/journal/${id}/publish`).set('Cookie', marketingAdmin).expect(201);
    const again = await http().post(`/api/v1/admin/journal/${id}/publish`).set('Cookie', marketingAdmin);
    expect(again.status).toBeGreaterThanOrEqual(200);
    expect(again.status).toBeLessThan(300);
    expect((again.body as { error?: { code: string } }).error?.code).not.toBe('SERVER_ERROR');
    expect((await prisma.journalArticle.findUniqueOrThrow({ where: { id } })).status).toBe('published');
  });

  it('rejects a section reorder that names another page, and rejects duplicate ids', async () => {
    const pageA = (await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'A', slug: `a-${randomUUID().slice(0, 6)}` }).expect(201)).body as { data: { id: string } };
    const pageB = (await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'B', slug: `b-${randomUUID().slice(0, 6)}` }).expect(201)).body as { data: { id: string } };
    const sectionA = (await http().post(`/api/v1/admin/pages/${pageA.data.id}/sections`).set('Cookie', marketingAdmin).send({ type: 'hero', config: { headline: 'Keep' }, visible: true }).expect(201)).body as { data: { id: string } };
    const sectionB = (await http().post(`/api/v1/admin/pages/${pageB.data.id}/sections`).set('Cookie', marketingAdmin).send({ type: 'hero', config: { headline: 'Other' }, visible: true }).expect(201)).body as { data: { id: string } };
    const moved = await http().post(`/api/v1/admin/pages/${pageB.data.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [sectionA.data.id, sectionB.data.id] });
    expect(moved.status).toBe(422);
    const stolen = await prisma.section.findUniqueOrThrow({ where: { id: sectionA.data.id } });
    expect(stolen.pageId).toBe(pageA.data.id);
    expect(await prisma.section.count({ where: { pageId: pageA.data.id } })).toBe(1);

    const dup = await http().post(`/api/v1/admin/pages/${pageA.data.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [sectionA.data.id, sectionA.data.id] });
    expect(dup.status).toBe(422);
    expect((await prisma.section.findUniqueOrThrow({ where: { id: sectionA.data.id } })).position).toBe(1);
  });

  it('control: a missing section id rolls the reorder back', async () => {
    const page = (await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'A', slug: `a-${randomUUID().slice(0, 6)}` }).expect(201)).body as { data: { id: string } };
    const section = (await http().post(`/api/v1/admin/pages/${page.data.id}/sections`).set('Cookie', marketingAdmin).send({ type: 'hero', config: { headline: 'A' }, visible: true }).expect(201)).body as { data: { id: string } };
    const extra = (await http().post(`/api/v1/admin/pages/${page.data.id}/sections`).set('Cookie', marketingAdmin).send({ type: 'cta', config: { heading: 'B' }, visible: true }).expect(201)).body as { data: { id: string } };
    const res = await http().post(`/api/v1/admin/pages/${page.data.id}/sections/reorder`).set('Cookie', marketingAdmin).send({ ids: [section.data.id, randomUUID()] });
    expect(res.status).toBe(404);
    const row = await prisma.section.findUniqueOrThrow({ where: { id: section.data.id } });
    expect(row.pageId).toBe(page.data.id);
    expect(row.position).toBe(1);
    expect((await prisma.section.findUniqueOrThrow({ where: { id: extra.data.id } })).position).toBe(2);
  });

  it('rejects a variant reorder for another product and refuses to clear the only default', async () => {
    const owner = await makeProduct();
    const other = await makeProduct();
    const chrome = await http().post(`/api/v1/admin/products/${owner.id}/variants`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, swatchHex: '#C0C0C0', isAvailable: true, isDefault: true,
    }).expect(201);
    const black = await http().post(`/api/v1/admin/products/${owner.id}/variants`).set('Cookie', productManager).send({
      name: 'Matte Black', skuSuffix: 'MB', price: 470000, swatchHex: '#1A1A1A', isAvailable: true, isDefault: false,
    }).expect(201);
    const chromeId = (chrome.body as { data: { id: string } }).data.id;
    const blackId = (black.body as { data: { id: string } }).data.id;
    const moved = await http().post(`/api/v1/admin/products/${other.id}/variants/reorder`).set('Cookie', productManager).send({ ids: [blackId, chromeId] });
    expect(moved.status).toBe(422);
    const rows = await prisma.variant.findMany({ where: { productId: owner.id }, orderBy: { position: 'asc' } });
    expect(rows.map((row) => row.name)).toEqual(['Chrome', 'Matte Black']);
    expect(await prisma.auditEvent.count({ where: { action: 'reorder', entityType: 'variant', entityId: other.id } })).toBe(0);

    const cleared = await http().patch(`/api/v1/admin/variants/${chromeId}`).set('Cookie', productManager).send({
      name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: false,
    });
    expect(cleared.status).toBe(422);
    expect(await prisma.variant.count({ where: { productId: owner.id, isDefault: true } })).toBe(1);
  });

  it('rejects a placement reorder that moves a row onto another location', async () => {
    const category = await makeCategory();
    const product = await makeProduct();
    const other = await makeProduct();
    await http().post(`/api/v1/admin/products/${other.id}/placements`).set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured',
    }).expect(201);
    await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id,
    }).expect(201);
    const categoryRow = await prisma.placement.findFirstOrThrow({ where: { productId: product.id, locationId: category.id } });
    const moved = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured', ids: [categoryRow.id],
    });
    expect(moved.status).toBe(422);
    const stayed = await prisma.placement.findUniqueOrThrow({ where: { id: categoryRow.id } });
    expect(stayed.locationType).toBe('category');
    expect(stayed.locationId).toBe(category.id);
  });

  it('control: moving a placement onto a location that product already occupies rolls back', async () => {
    const category = await makeCategory();
    const product = await makeProduct();
    await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured',
    }).expect(201);
    await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send({
      locationType: 'category', locationId: category.id,
    }).expect(201);
    const rows = await prisma.placement.findMany({ where: { productId: product.id } });
    const featured = rows.find((row) => row.locationId === 'featured');
    const categoryRow = rows.find((row) => row.locationId === category.id);
    if (!featured || !categoryRow) throw new Error('placements missing');
    const res = await http().post('/api/v1/admin/placements/reorder').set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured', ids: [categoryRow.id, featured.id],
    });
    expect(res.status).toBe(409);
    const after = await prisma.placement.findUniqueOrThrow({ where: { id: categoryRow.id } });
    expect(after.locationType).toBe('category');
    expect(after.locationId).toBe(category.id);
  });

  it('rejects a placement whose location type does not match the id, and a missing product is 404', async () => {
    const category = await makeCategory();
    const product = await makeProduct();
    const asCollection = await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send({
      locationType: 'collection', locationId: category.id,
    });
    expect(asCollection.status).toBe(422);
    expect(await prisma.placement.count({ where: { productId: product.id, locationType: 'collection' } })).toBe(0);

    const featuredAsCategory = await http().post(`/api/v1/admin/products/${product.id}/placements`).set('Cookie', productManager).send({
      locationType: 'category', locationId: 'featured',
    });
    expect(featuredAsCategory.status).toBe(422);
    expect(await prisma.placement.count({ where: { productId: product.id, locationId: 'featured' } })).toBe(0);

    const missing = await http().post(`/api/v1/admin/products/${randomUUID()}/placements`).set('Cookie', productManager).send({
      locationType: 'homepage_section', locationId: 'featured',
    });
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { message: string } }).error.message).not.toBe('This product is already placed there.');
  });

  it('rejects a non-string section preset and a string outside the preset list', async () => {
    const page = (await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'Bad', slug: `bad-${randomUUID().slice(0, 6)}` }).expect(201)).body as { data: { id: string } };
    const rejected = await http().post(`/api/v1/admin/pages/${page.data.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', config: { layout: { background: true, width: 'contained' }, headline: 'Hi' }, visible: true,
    });
    expect(rejected.status).toBe(422);
    expect((rejected.body as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED');
    expect(await prisma.section.count({ where: { pageId: page.data.id } })).toBe(0);
    const rainbow = await http().post(`/api/v1/admin/pages/${page.data.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'hero', config: { layout: { background: 'rainbow' } },
    }).expect(422);
    expect((rainbow.body as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED');
    const columns = await http().post(`/api/v1/admin/pages/${page.data.id}/sections`).set('Cookie', marketingAdmin).send({
      type: 'gallery', config: { columns: true },
    });
    expect(columns.status).toBe(422);
  });

  it('rejects an unknown journal status and still filters a real one', async () => {
    await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({
      title: 'Draft', slug: `draft-${randomUUID().slice(0, 6)}`, body: 'Not ready.',
    }).expect(201);
    const published = await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({
      title: 'Live', slug: `live-${randomUUID().slice(0, 6)}`, body: 'Ready.',
    }).expect(201);
    await http().post(`/api/v1/admin/journal/${(published.body as { data: { id: string } }).data.id}/publish`).set('Cookie', marketingAdmin).expect(201);
    const filtered = await http().get('/api/v1/admin/journal?status=published').set('Cookie', marketingAdmin).expect(200);
    expect((filtered.body as { meta: { total: number } }).meta.total).toBe(1);
    const ignored = await http().get('/api/v1/admin/journal?status=nope').set('Cookie', marketingAdmin);
    expect(ignored.status).toBe(422);
    expect((ignored.body as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED');
  });

  it('rolls back a bulk publish when a later product cannot be published', async () => {
    const category = await makeCategory();
    const ready = await makeProduct({ categoryId: category.id, price: 450000 });
    const blocked = await makeProduct({ price: 450000 });
    const res = await http().post('/api/v1/admin/products/bulk').set('Cookie', productManager).send({
      ids: [ready.id, blocked.id], action: 'publish',
    }).expect(422);
    expect((res.body as { error: { message: string } }).error.message).toBe('This product cannot be published yet.');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: ready.id } })).status).toBe('draft');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: blocked.id } })).status).toBe('draft');
  });

  it('keeps a navigation grandchild and does not drop the previous menu on an invalid destination', async () => {
    await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Old', linkType: 'external', destination: 'https://flowtop.example/old', children: [] }],
      footer: [],
    }).expect(200);
    const res = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{
        label: 'Shop',
        linkType: 'external',
        destination: 'https://flowtop.example/shop',
        children: [{
          label: 'Brass',
          linkType: 'external',
          destination: 'https://flowtop.example/brass',
          children: [{ label: 'Grand', linkType: 'external', destination: 'https://flowtop.example/grand', children: [] }],
        }],
      }],
      footer: [],
    }).expect(200);
    const header = (res.body as { data: { header: { label: string; children: { label: string; children: { label: string }[] }[] }[] } }).data.header;
    expect(header.map((node) => node.label)).toEqual(['Shop']);
    expect(header[0]?.children.map((node) => node.label)).toEqual(['Brass']);
    expect(header[0]?.children[0]?.children.map((node) => node.label)).toEqual(['Grand']);
    expect(await prisma.navigationItem.count({ where: { label: 'Grand' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(0);
  });

  it('control: an illegal navigation destination does not erase the previous menu', async () => {
    await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Old', linkType: 'external', destination: 'https://flowtop.example/old', children: [] }],
      footer: [],
    }).expect(200);
    const res = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Bad', linkType: 'external', destination: 'javascript:alert(1)', children: [] }],
      footer: [],
    }).expect(422);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_FAILED');
    expect(await prisma.navigationItem.count({ where: { label: 'Old' } })).toBe(1);
    expect(await prisma.navigationItem.count({ where: { label: 'Bad' } })).toBe(0);
  });

  it('rejects an internal navigation destination that is not a real record', async () => {
    const missing = randomUUID();
    const res = await http().put('/api/v1/admin/navigation').set('Cookie', marketingAdmin).send({
      header: [{ label: 'Ghost', linkType: 'page', destination: missing, children: [] }],
      footer: [],
    });
    expect(res.status).toBe(422);
    expect(await prisma.navigationItem.count({ where: { destination: missing } })).toBe(0);
  });

  it('filters orders by an inclusive from and an exclusive to', async () => {
    const product = await prisma.product.create({ data: { name: 'Tap', sku: `SKU-${randomUUID().slice(0, 6)}`, slug: `tap-${randomUUID().slice(0, 6)}`, price: 100 } });
    const base = {
      customerEmail: 'a@flowtop.in', customerPhone: '1', deliveryAddressLine1: '1 Road', deliveryCity: 'Pune', deliveryState: 'MH', deliveryPin: '411001',
      subtotal: 100, shipping: 0, tax: 0, total: 100, paymentStatus: 'paid' as const,
      items: { create: { productId: product.id, productName: 'Tap', sku: product.sku, unitPrice: 100, quantity: 1, lineTotal: 100 } },
    };
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'Inside', orderStatus: 'received', createdAt: new Date('2026-01-15T00:00:00.000Z') } });
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'Outside', orderStatus: 'received', createdAt: new Date('2026-02-15T00:00:00.000Z') } });
    const windowed = await http().get('/api/v1/admin/orders?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z').set('Cookie', superAdmin).expect(200);
    const names = (windowed.body as { data: { customerName: string }[] }).data.map((row) => row.customerName);
    expect(names).toEqual(['Inside']);
    const bare = await http().get('/api/v1/admin/orders?from=2026-01-01&to=2026-02-01').set('Cookie', superAdmin);
    expect(bare.status).toBe(422);
  });

  it('control: page and journal PATCH cannot assign status', async () => {
    const page = (await http().post('/api/v1/admin/pages').set('Cookie', marketingAdmin).send({ title: 'P', slug: `p-${randomUUID().slice(0, 6)}` }).expect(201)).body as { data: { id: string } };
    await http().patch(`/api/v1/admin/pages/${page.data.id}`).set('Cookie', marketingAdmin).send({ status: 'published' }).expect(422);
    const article = (await http().post('/api/v1/admin/journal').set('Cookie', marketingAdmin).send({ title: 'J', slug: `j-${randomUUID().slice(0, 6)}`, body: 'Body' }).expect(201)).body as { data: { id: string } };
    await http().patch(`/api/v1/admin/journal/${article.data.id}`).set('Cookie', marketingAdmin).send({ status: 'published' }).expect(422);
    expect((await prisma.page.findUniqueOrThrow({ where: { id: page.data.id } })).status).toBe('draft');
    expect((await prisma.journalArticle.findUniqueOrThrow({ where: { id: article.data.id } })).status).toBe('draft');
  });

  it('routes collection status changes through the publish state machine', async () => {
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    const published = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'published' }).expect(200);
    expect((published.body as { data: { status: string } }).data.status).toBe('published');
    const reverted = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'draft' });
    expect(reverted.status).toBe(422);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id } })).status).toBe('published');
    const archived = await http().patch(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).send({ status: 'archived' }).expect(200);
    expect((archived.body as { data: { status: string } }).data.status).toBe('archived');
    const jump = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({ name: 'Two', slug: `two-${randomUUID().slice(0, 6)}` }).expect(201);
    const jumpId = (jump.body as { data: { id: string } }).data.id;
    const skipped = await http().patch(`/api/v1/admin/collections/${jumpId}`).set('Cookie', productManager).send({ status: 'archived' });
    expect(skipped.status).toBe(422);
    expect((await prisma.collection.findUniqueOrThrow({ where: { id: jumpId } })).status).toBe('draft');
  });

  it('control: unauthenticated and wrong-role boundaries', async () => {
    await http().get('/api/v1/admin/categories').expect(401);
    await http().post('/api/v1/admin/collections').set('Cookie', marketingAdmin).send({ name: 'X', slug: 'x' }).expect(403);
    await http().post('/api/v1/admin/pages').set('Cookie', productManager).send({ title: 'X', slug: 'x' }).expect(403);
    await http().get('/api/v1/admin/orders/export').set('Cookie', productManager).expect(403);
    await http().post('/api/v1/admin/journal/00000000-0000-4000-8000-000000000000/publish').set('Cookie', productManager).expect(403);
    await http().get('/api/v1/admin/dashboard').set('Cookie', marketingAdmin).expect(200);
  });

  it('names the child-category conflict when a parent category cannot be deleted', async () => {
    const parent = await prisma.category.create({ data: { name: 'Parent', slug: `parent-${randomUUID().slice(0, 6)}`, status: 'draft' } });
    await prisma.category.create({ data: { name: 'Child', slug: `child-${randomUUID().slice(0, 6)}`, status: 'draft', parentId: parent.id } });
    const res = await http().delete(`/api/v1/admin/categories/${parent.id}`).set('Cookie', productManager);
    expect(res.status).toBe(409);
    expect((res.body as { error: { message: string } }).error.message).toBe('This category still has subcategories. Move them first.');
    expect(await prisma.category.count({ where: { id: parent.id } })).toBe(1);
  });

  it('returns the same product rank on the collection list and the detail', async () => {
    const product = await makeProduct();
    const created = await http().post('/api/v1/admin/collections').set('Cookie', productManager).send({
      name: 'Opel', slug: `opel-${randomUUID().slice(0, 6)}`,
    }).expect(201);
    const id = (created.body as { data: { id: string } }).data.id;
    await http().put(`/api/v1/admin/collections/${id}/products`).set('Cookie', productManager).send({
      items: [{ productId: product.id, position: 1 }],
    }).expect(200);
    const list = await http().get('/api/v1/admin/collections').set('Cookie', productManager).expect(200);
    const row = (list.body as { data: { id: string; productIds: string[] }[] }).data.find((item) => item.id === id);
    expect(row?.productIds).toEqual([product.id]);
    const detail = await http().get(`/api/v1/admin/collections/${id}`).set('Cookie', productManager).expect(200);
    expect((detail.body as { data: { productIds: string[] } }).data.productIds).toEqual([product.id]);
  });

  it('control: deleting a category that still has a product is 409 and keeps both rows', async () => {
    const category = await makeCategory();
    const product = await makeProduct({ categoryId: category.id });
    const res = await http().delete(`/api/v1/admin/categories/${category.id}`).set('Cookie', productManager).expect(409);
    expect((res.body as { error: { message: string } }).error.message).toBe('This category still has products. Move them to another category first.');
    expect(await prisma.category.count({ where: { id: category.id } })).toBe(1);
    expect(await prisma.product.count({ where: { id: product.id } })).toBe(1);
  });

  it('names the order-line conflict when a finish cannot be deleted', async () => {
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
    const res = await http().delete(`/api/v1/admin/variants/${variantId}`).set('Cookie', productManager);
    expect(res.status).toBe(409);
    expect((res.body as { error: { message: string } }).error.message).toBe('This finish is on an order, so it cannot be removed.');
    expect(await prisma.variant.count({ where: { id: variantId } })).toBe(1);
  });

  it('exports only the orders that match the status filter and still prefixes formulas', async () => {
    const product = await prisma.product.create({ data: { name: 'Tap', sku: `SKU-${randomUUID().slice(0, 6)}`, slug: `tap-${randomUUID().slice(0, 6)}`, price: 100 } });
    const base = {
      customerEmail: 'a@flowtop.in', customerPhone: '1', deliveryAddressLine1: '1 Road', deliveryCity: 'Pune', deliveryState: 'MH', deliveryPin: '411001',
      subtotal: 100, shipping: 0, tax: 0, total: 100, paymentStatus: 'paid' as const,
      items: { create: { productId: product.id, productName: 'Tap', sku: product.sku, unitPrice: 100, quantity: 1, lineTotal: 100 } },
    };
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: '\t=cmd', orderStatus: 'received' } });
    await prisma.order.create({ data: { ...base, reference: `FT-${randomUUID().slice(0, 6)}`, customerName: 'Paid', orderStatus: 'shipped' } });
    const filtered = await http().get('/api/v1/admin/orders?status=received').set('Cookie', superAdmin).expect(200);
    expect((filtered.body as { meta: { total: number } }).meta.total).toBe(1);
    const exported = await http().get('/api/v1/admin/orders/export?status=received').set('Cookie', superAdmin).expect(200);
    expect(exported.headers['content-type']).toContain('text/csv');
    expect(exported.text).toContain(`"'\t=cmd"`);
    expect(exported.text).not.toContain('Paid');
    expect(exported.text.split('\n').filter((line) => line.length > 0)).toHaveLength(2);
  });
});

import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { syncPermissionsAndRoles } from '../prisma/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { RoleName } from '../src/auth';
import { PasswordHasher } from '../src/auth/password-hasher';
import type { Paginated } from '../src/common/dto/pagination';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import type { MediaAssetResponse } from '../src/media/dto/media.dto';
import { LocalObjectStorage } from '../src/media/storage/local-object-storage';
import { ObjectStorage } from '../src/media/storage/object-storage';
import { resetDatabase } from './database';
import { jpegFile, pdfFile, pngFile, svgFile, windowsExecutable } from './fixtures/files';

const PASSWORD = `test-only-${randomUUID()}`;
const UPLOAD = '/api/v1/admin/media/upload';
const MEDIA = '/api/v1/admin/media';
const MEDIA_DIR = process.env.MEDIA_LOCAL_DIR ?? '';
const MB = 1024 * 1024;

type Uploaded = { data: MediaAssetResponse };

describe('Media (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const cookies: Partial<Record<RoleName, string>> = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await rm(MEDIA_DIR, { recursive: true, force: true });
    await syncPermissionsAndRoles(prisma);
    app.get(RateLimiter).clear();
    for (const role of ['super_admin', 'marketing_admin', 'product_manager'] as const) {
      cookies[role] = await signInAs(role);
    }
  });

  afterAll(async () => {
    await rm(MEDIA_DIR, { recursive: true, force: true });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function signInAs(role: RoleName): Promise<string> {
    const email = `${role}@flowtop.in`;
    const { id } = await prisma.role.findUniqueOrThrow({ where: { name: role } });
    await prisma.user.create({
      data: { name: role, email, passwordHash: await app.get(PasswordHasher).hash(PASSWORD), roles: { create: { roleId: id } } },
    });
    const res = await http().post('/api/v1/auth/login').send({ email, password: PASSWORD }).expect(200);
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  }

  function upload(file: Buffer, filename: string, bucket: string, as: RoleName = 'marketing_admin', contentType?: string) {
    return http()
      .post(UPLOAD)
      .set('Cookie', cookies[as] ?? '')
      .field('bucket', bucket)
      .attach('file', file, { filename, contentType: contentType ?? 'application/octet-stream' });
  }

  /** Every file under the media folder, both buckets. */
  async function storedFiles(): Promise<string[]> {
    const found: string[] = [];
    for (const bucket of ['public', 'private']) {
      try {
        found.push(...(await readdir(join(MEDIA_DIR, bucket))).map((name) => `${bucket}/${name}`));
      } catch {
        // folder not created yet
      }
    }
    return found;
  }

  /** The path part of a URL, so supertest can fetch it from the in-process app. */
  const pathOf = (url: string) => {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  };

  describe('upload', () => {
    it('stores a PNG in the public bucket and returns the contract MediaAsset', async () => {
      const png = pngFile(4, 3);

      const res = await upload(png, 'opel-mixer.png', 'public', 'marketing_admin', 'image/png').expect(201);
      const { data } = res.body as Uploaded;

      expect(Object.keys(data).sort()).toEqual(['alt', 'height', 'id', 'mimeType', 'sizeBytes', 'url', 'variants', 'width']);
      expect(data).toMatchObject({ alt: '', width: 4, height: 3, sizeBytes: png.length, mimeType: 'image/png', variants: {} });
      expect(data.url).toMatch(/^http:\/\/localhost:4000\/api\/v1\/files\/public\/[0-9a-f-]{36}\.png$/);

      const served = await http().get(pathOf(data.url)).buffer(true).expect(200);
      expect(Buffer.compare(served.body as Buffer, png)).toBe(0);
      expect(served.headers['content-type']).toBe('image/png');
      expect(served.headers['x-content-type-options']).toBe('nosniff');
    });

    it('Phase 1 check 9: rejects a .exe renamed to .jpg and sent as image/jpeg, and stores nothing', async () => {
      const res = await upload(windowsExecutable(), 'holiday-photo.jpg', 'public', 'marketing_admin', 'image/jpeg').expect(422);

      expect((res.body as ErrorBody).error).toMatchObject({
        code: 'VALIDATION_FAILED',
        fields: { file: 'Programs and scripts cannot be uploaded.' },
      });
      expect(await prisma.mediaAsset.count()).toBe(0);
      expect(await storedFiles()).toEqual([]);
    });

    it('rejects an SVG renamed to .png, because SVG can carry script', async () => {
      const res = await upload(svgFile(), 'logo.png', 'public', 'marketing_admin', 'image/png').expect(422);

      expect((res.body as ErrorBody).error.fields?.file).toMatch(/not allowed/);
      expect(await storedFiles()).toEqual([]);
    });

    it('trusts the bytes, not the name: a real JPEG called document.pdf is stored as a JPEG', async () => {
      const res = await upload(jpegFile(20, 10), 'document.pdf', 'public', 'marketing_admin', 'application/pdf').expect(201);

      expect((res.body as Uploaded).data).toMatchObject({ mimeType: 'image/jpeg', width: 20, height: 10 });
      expect((res.body as Uploaded).data.url).toMatch(/\.jpg$/);
    });

    it('never uses the uploaded filename for the storage key', async () => {
      await upload(pngFile(1, 1), '../../../etc/passwd.png', 'public').expect(201);

      const [asset] = await prisma.mediaAsset.findMany();
      expect(asset.filename).toBe('passwd.png');
      expect(asset.storageKey).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(await storedFiles()).toEqual([`public/${asset.storageKey}`]);
    });

    it('applies the per-type limit: a 16 MB image is refused, the same size PDF is accepted', async () => {
      const bigJpeg = jpegFile(100, 100, 16 * MB);
      const res = await upload(bigJpeg, 'huge.jpg', 'public').expect(422);
      expect((res.body as ErrorBody).error.fields?.file).toBe('JPEG files can be up to 15 MB.');

      const bigPdf = Buffer.concat([pdfFile(), Buffer.alloc(16 * MB)]);
      await upload(bigPdf, 'catalogue.pdf', 'public').expect(201);
    });

    it('Phase 1 check 10: cuts off an upload over 25 MB while it is still streaming', async () => {
      const res = await upload(Buffer.concat([pdfFile(), Buffer.alloc(26 * MB)]), 'too-big.pdf', 'public').expect(413);

      expect((res.body as ErrorBody).error.code).toBe('VALIDATION_FAILED');
      expect(await storedFiles()).toEqual([]);
    });

    it('requires a file and a valid bucket, and rejects unknown fields', async () => {
      const noFile = await http().post(UPLOAD).set('Cookie', cookies.marketing_admin ?? '').field('bucket', 'public').expect(422);
      expect((noFile.body as ErrorBody).error.fields).toHaveProperty('file');

      const badBucket = await upload(pngFile(1, 1), 'a.png', 'everyone').expect(422);
      expect((badBucket.body as ErrorBody).error.fields).toHaveProperty('bucket');

      await http()
        .post(UPLOAD)
        .set('Cookie', cookies.marketing_admin ?? '')
        .field('bucket', 'public')
        .field('isAdmin', 'true')
        .attach('file', pngFile(1, 1), 'a.png')
        .expect(422);
    });

    it('refuses without a session (401) before reading the file, and nothing is stored', async () => {
      await http().post(UPLOAD).field('bucket', 'public').attach('file', pngFile(1, 1), 'a.png').expect(401);

      expect(await storedFiles()).toEqual([]);
    });
  });

  describe('private bucket', () => {
    async function uploadPrivatePdf(): Promise<MediaAssetResponse> {
      const res = await upload(pdfFile(), 'invoice.pdf', 'private').expect(201);
      return (res.body as Uploaded).data;
    }

    it('returns a signed URL that works, as a download, never cached', async () => {
      const { url } = await uploadPrivatePdf();
      expect(url).toMatch(/\/files\/private\/[0-9a-f-]{36}\.pdf\?expires=\d+&signature=/);

      const res = await http().get(pathOf(url)).expect(200);

      expect(res.headers['content-disposition']).toBe('attachment');
      expect(res.headers['cache-control']).toBe('private, no-store');
    });

    it('refuses the link without its signature, with a tampered one, and once expired', async () => {
      const { url } = await uploadPrivatePdf();
      const parsed = new URL(url);
      const key = parsed.pathname.split('/').pop() ?? '';

      await http().get(parsed.pathname).expect(403);

      parsed.searchParams.set('signature', 'forged');
      await http().get(pathOf(parsed.toString())).expect(403);

      const storage = app.get<ObjectStorage, LocalObjectStorage>(ObjectStorage);
      const expired = storage.signedUrl(key, Math.floor(Date.now() / 1000) - 1);
      await http().get(pathOf(expired)).expect(403);
    });

    it('Phase 1 check 12: a private file cannot be reached through the public route', async () => {
      const { url } = await uploadPrivatePdf();
      const key = new URL(url).pathname.split('/').pop() ?? '';

      await http().get(`/api/v1/files/public/${key}`).expect(404);
    });

    it('does not accept AVIF, which the private bucket does not allow', async () => {
      const avif = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif'), Buffer.alloc(64)]);

      await upload(avif, 'scan.avif', 'private').expect(422);
    });
  });

  it('refuses path traversal on the file routes', async () => {
    await http().get('/api/v1/files/public/..%2F..%2Fpackage.json').expect(404);
    await http().get('/api/v1/files/public/%2e%2e%2f.env').expect(404);
  });

  describe('list, get and alt text', () => {
    beforeEach(async () => {
      await upload(pngFile(1, 1), 'opel-basin-mixer.png', 'public').expect(201);
      await upload(jpegFile(1, 1), 'kitchen-faucet.jpg', 'public').expect(201);
      await upload(pdfFile(), 'opel-installation-manual.pdf', 'public').expect(201);
    });

    it('paginates with the contract envelope, newest first', async () => {
      const res = await http().get(`${MEDIA}?perPage=2`).set('Cookie', cookies.product_manager ?? '').expect(200);
      const body = res.body as Paginated<MediaAssetResponse>;

      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({ page: 1, perPage: 2, total: 3, totalPages: 2 });
      expect(body.data[0].mimeType).toBe('application/pdf');
    });

    it('filters by search and by type', async () => {
      const opel = await http().get(`${MEDIA}?search=OPEL`).set('Cookie', cookies.product_manager ?? '').expect(200);
      expect((opel.body as Paginated<MediaAssetResponse>).meta.total).toBe(2);

      const images = await http().get(`${MEDIA}?type=image`).set('Cookie', cookies.product_manager ?? '').expect(200);
      expect((images.body as Paginated<MediaAssetResponse>).data.every((m) => m.mimeType.startsWith('image/'))).toBe(true);

      const docs = await http().get(`${MEDIA}?type=document&search=opel`).set('Cookie', cookies.product_manager ?? '').expect(200);
      expect((docs.body as Paginated<MediaAssetResponse>).meta.total).toBe(1);

      await http().get(`${MEDIA}?type=video`).set('Cookie', cookies.product_manager ?? '').expect(422);
    });

    it('updates alt text, which is then searchable', async () => {
      const [asset] = await prisma.mediaAsset.findMany({ where: { filename: 'kitchen-faucet.jpg' } });

      const res = await http()
        .patch(`${MEDIA}/${asset.id}`)
        .set('Cookie', cookies.marketing_admin ?? '')
        .send({ altText: 'Chrome kitchen faucet on marble' })
        .expect(200);

      expect((res.body as Uploaded).data.alt).toBe('Chrome kitchen faucet on marble');
      const found = await http().get(`${MEDIA}?search=marble`).set('Cookie', cookies.marketing_admin ?? '').expect(200);
      expect((found.body as Paginated<MediaAssetResponse>).meta.total).toBe(1);
    });

    it('answers 404 for an unknown id and 400 for a malformed one', async () => {
      await http().get(`${MEDIA}/${randomUUID()}`).set('Cookie', cookies.marketing_admin ?? '').expect(404);
      await http().get(`${MEDIA}/not-a-uuid`).set('Cookie', cookies.marketing_admin ?? '').expect(400);
    });
  });

  describe('delete', () => {
    async function uploadAsset(): Promise<string> {
      const res = await upload(pngFile(2, 2), 'mixer.png', 'public').expect(201);
      return (res.body as Uploaded).data.id;
    }

    it('returns 409 naming what still uses the file, and deletes nothing', async () => {
      const mediaId = await uploadAsset();
      const product = await prisma.product.create({
        data: { name: 'Opel Basin Mixer', sku: 'FT-OBM-001', slug: 'opel-basin-mixer', price: 450000 },
      });
      await prisma.productMedia.create({ data: { productId: product.id, mediaAssetId: mediaId, role: 'gallery' } });
      await prisma.category.create({ data: { name: 'Basin Mixers', slug: 'basin-mixers', imageId: mediaId } });

      const res = await http().delete(`${MEDIA}/${mediaId}`).set('Cookie', cookies.super_admin ?? '').expect(409);

      expect((res.body as ErrorBody).error.code).toBe('CONFLICT');
      expect((res.body as ErrorBody).error.message).toBe(
        'This file is still in use: product "Opel Basin Mixer" (gallery image); category "Basin Mixers" (image). Remove it from there first.',
      );
      expect(await prisma.mediaAsset.count()).toBe(1);
      expect(await storedFiles()).toHaveLength(1);
    });

    it('deletes an unused file: record, stored file and an audit row', async () => {
      const mediaId = await uploadAsset();

      await http().delete(`${MEDIA}/${mediaId}`).set('Cookie', cookies.marketing_admin ?? '').expect(204);

      expect(await prisma.mediaAsset.count()).toBe(0);
      expect(await storedFiles()).toEqual([]);
      const [audit] = await prisma.auditEvent.findMany();
      expect(audit).toMatchObject({ action: 'delete', entityType: 'media_asset', entityId: mediaId });
    });

    it('needs media:delete: product_manager can upload but not delete', async () => {
      const mediaId = await uploadAsset();

      await http().delete(`${MEDIA}/${mediaId}`).set('Cookie', cookies.product_manager ?? '').expect(403);
      expect(await prisma.mediaAsset.count()).toBe(1);
    });
  });
});

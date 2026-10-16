import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { RoleName } from '../src/auth';
import { ErrorBody } from '../src/common/errors/error-code';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RateLimiter } from '../src/common/rate-limit/rate-limiter';
import type { PublicSettings, SettingItem } from '../src/settings/dto/settings.dto';
import { SETTING_SEEDS } from '../src/settings/setting-definitions';
import { seedMissingSettings } from '../src/settings/settings.repository';
import { SettingsService } from '../src/settings/settings.service';
import { resetDatabase } from './database';
import { createAccount } from './accounts';

const PASSWORD = `test-only-${randomUUID()}`;
const PUBLIC = '/api/v1/settings/public';
const ADMIN = '/api/v1/admin/settings';

describe('Settings (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: { id: string; cookie: string };

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
    admin = await account('super_admin');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const put = (key: string, value: unknown, cookie = admin.cookie) => http().put(ADMIN).set('Cookie', cookie).send({ key, value });

  async function account(role: RoleName): Promise<{ id: string; cookie: string }> {
    const { id, cookie } = await createAccount(app, role, { email: `${role}-${randomUUID().slice(0, 8)}@flowtop.in`, password: PASSWORD });
    return { id, cookie };
  }

  describe('GET /settings/public', () => {
    it('needs no login and returns exactly the WhatsApp block in the contract shape', async () => {
      const res = await http().get(PUBLIC).expect(200);

      expect(res.body).toEqual({
        data: {
          whatsapp: {
            number: null,
            generalTemplate: "Hi, I'd like to know more about Flowtop products.",
            productTemplate: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
          },
        },
      });
      expect(res.headers['cache-control']).toBe('public, max-age=60');
    });

    it('never shows an email setting, even once they are filled in', async () => {
      await put('email.recipients.orders', ['orders@flowtop.in']).expect(200);
      await put('email.senderAddress', 'no-reply@flowtop.in').expect(200);

      const res = await http().get(PUBLIC).expect(200);

      expect(JSON.stringify(res.body)).not.toMatch(/@|email|recipients|sender/i);
    });

    it('changes the moment an admin saves, with no deploy and no restart', async () => {
      await put('whatsapp.number', '+91 98765 43210').expect(200);

      const res = await http().get(PUBLIC).expect(200);

      expect((res.body as { data: PublicSettings }).data.whatsapp.number).toBe('+919876543210');
    });

    it('is rate limited, like every public endpoint', async () => {
      for (let i = 0; i < 120; i += 1) {
        await http().get(PUBLIC).expect(200);
      }
      await http().get(PUBLIC).expect(429);
    });
  });

  describe('GET /admin/settings', () => {
    it('lists the eight settings in order, with descriptions and who changed them', async () => {
      await put('whatsapp.number', '+919876543210').expect(200);

      const res = await http().get(ADMIN).set('Cookie', admin.cookie).expect(200);
      const items = (res.body as { data: SettingItem[] }).data;

      expect(items.map((item) => item.key)).toEqual(Object.keys(SETTING_SEEDS));
      const number = items.find((item) => item.key === 'whatsapp.number');
      expect(number).toMatchObject({ value: '+919876543210', public: true, updatedBy: { id: admin.id, name: 'super_admin' } });
      expect(number?.updatedAt).toEqual(expect.any(String));
      expect(items.find((item) => item.key === 'email.recipients.orders')).toMatchObject({ value: [], public: false, updatedBy: null });
    });

    it('never reads out a row that is not a defined setting, such as a secret someone put in the table', async () => {
      await prisma.setting.create({ data: { key: 'smtp.password', value: 'not-for-anyone' } });

      const another = await account('super_admin');
      const adminRes = await http().get(ADMIN).set('Cookie', another.cookie).expect(200);
      const publicRes = await http().get(PUBLIC).expect(200);

      expect(JSON.stringify(adminRes.body)).not.toContain('not-for-anyone');
      expect(JSON.stringify(publicRes.body)).not.toContain('not-for-anyone');
    });

    it('needs settings:read: 401 without a session, 403 for product_manager and marketing_admin', async () => {
      await http().get(ADMIN).expect(401);
      const productManager = await account('product_manager');
      const marketingAdmin = await account('marketing_admin');
      await http().get(ADMIN).set('Cookie', productManager.cookie).expect(403);
      await http().get(ADMIN).set('Cookie', marketingAdmin.cookie).expect(403);
    });
  });

  describe('PUT /admin/settings', () => {
    it('saves a valid value, normalised, and writes an audit row with before and after', async () => {
      const res = await put('email.recipients.orders', [' Orders@Flowtop.in ', 'orders@flowtop.in', 'ops@flowtop.in']).expect(200);

      expect((res.body as { data: SettingItem }).data).toMatchObject({
        key: 'email.recipients.orders',
        value: ['orders@flowtop.in', 'ops@flowtop.in'],
        updatedBy: { id: admin.id },
      });
      expect(await app.get(SettingsService).get('email.recipients.orders')).toEqual(['orders@flowtop.in', 'ops@flowtop.in']);
      expect(await prisma.auditEvent.findFirst({ where: { action: 'settings_change' } })).toMatchObject({
        actorId: admin.id,
        entityType: 'setting',
        entityId: 'email.recipients.orders',
        metadata: { from: [], to: ['orders@flowtop.in', 'ops@flowtop.in'] },
      });
    });

    it('rejects an invalid value with a message for the field, and keeps the old value', async () => {
      const res = await put('email.recipients.orders', ['not-an-email']).expect(422);

      expect((res.body as ErrorBody).error.fields).toEqual({ value: '"not-an-email" is not a valid email address.' });
      expect(await app.get(SettingsService).get('email.recipients.orders')).toEqual([]);
      expect(await prisma.auditEvent.count()).toBe(0);
    });

    it('refuses a key that is not a defined setting, so no secret can be stored here', async () => {
      const res = await put('smtp.password', 'hunter2').expect(422);

      expect((res.body as ErrorBody).error.fields).toHaveProperty('key');
      expect(await prisma.setting.count({ where: { key: 'smtp.password' } })).toBe(0);
    });

    it('refuses a template placeholder the website cannot fill', async () => {
      const res = await put('whatsapp.productTemplate', 'Interested in {productName} at {price}').expect(422);

      expect((res.body as ErrorBody).error.message).toMatch(/Unknown placeholder \{price\}/);
    });

    it('lets an admin hide WhatsApp again by setting the number to null', async () => {
      await put('whatsapp.number', '+919876543210').expect(200);
      await put('whatsapp.number', null).expect(200);

      expect(((await http().get(PUBLIC).expect(200)).body as { data: PublicSettings }).data.whatsapp.number).toBeNull();
    });

    it('needs settings:write, and rejects extra fields', async () => {
      await http().put(ADMIN).send({ key: 'whatsapp.number', value: null }).expect(401);
      const productManager = await account('product_manager');
      await put('whatsapp.number', null, productManager.cookie).expect(403);
      await http().put(ADMIN).set('Cookie', admin.cookie).send({ key: 'whatsapp.number', value: null, updatedBy: randomUUID() }).expect(422);
    });
  });

  it('re-seeding adds missing keys but never overwrites what an admin set', async () => {
    await put('email.senderName', 'Flowtop Bath Fittings').expect(200);
    await prisma.setting.deleteMany({ where: { key: 'email.recipients.dealer' } });

    const added = await seedMissingSettings(prisma, SETTING_SEEDS);

    expect(added).toBe(1);
    expect(await app.get(SettingsService).get('email.senderName')).toBe('Flowtop Bath Fittings');
    expect(await app.get(SettingsService).get('email.recipients.dealer')).toEqual([]);
  });
});

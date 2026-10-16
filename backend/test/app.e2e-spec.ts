import { Body, Controller, Module, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Min, ValidateNested } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ErrorBody } from '../src/common/errors/error-code';
import { HealthRepository } from '../src/health/health.repository';

class DeliveryDto {
  @Matches(/^\d{6}$/, { message: 'PIN code must be 6 digits' })
  pin!: string;
}

class ProbeDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery!: DeliveryDto;
}

/** A throwaway route so the global validation pipe can be exercised before any feature module exists. */
@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: ProbeDto): { data: ProbeDto } {
    return { data: body };
  }
}

@Module({ imports: [AppModule], controllers: [ProbeController] })
class ProbeAppModule {}

describe('App (e2e)', () => {
  let app: NestExpressApplication;
  const healthRepository = { pingDatabase: jest.fn<Promise<void>, []>() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProbeAppModule] })
      .overrideProvider(HealthRepository)
      .useValue(healthRepository)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('reports ok when the database answers', async () => {
      healthRepository.pingDatabase.mockResolvedValueOnce(undefined);

      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body).toEqual({ data: { status: 'ok', database: 'up' } });
    });

    it('returns 503 in the error envelope when the database is down, without leaking the cause', async () => {
      healthRepository.pingDatabase.mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'));

      const res = await request(app.getHttpServer()).get('/health').expect(503);
      const body = res.body as ErrorBody;

      expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(body.error.message).toBe('Database unavailable');
      expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    });

    it('is not served under the API prefix', async () => {
      await request(app.getHttpServer()).get('/api/v1/health').expect(404);
    });
  });

  describe('error envelope', () => {
    it('returns NOT_FOUND for an unknown route', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
      const body = res.body as ErrorBody;

      expect(body.error.code).toBe('NOT_FOUND');
      expect(typeof body.error.message).toBe('string');
    });
  });

  describe('global validation pipe', () => {
    const valid = { name: 'Opel Basin Mixer', quantity: 2, delivery: { pin: '560001' } };

    it('accepts a valid body', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/probe').send(valid).expect(201);

      expect(res.body).toEqual({ data: valid });
    });

    it('rejects an unknown property instead of silently dropping it', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/probe')
        .send({ ...valid, price: 1 })
        .expect(422);
      const body = res.body as ErrorBody;

      expect(body.error.code).toBe('VALIDATION_FAILED');
      expect(body.error.fields).toHaveProperty('price');
    });

    it('reports each invalid field, including nested ones, by path', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/probe')
        .send({ name: 'Opel', quantity: 0, delivery: { pin: '12' } })
        .expect(422);
      const body = res.body as ErrorBody;

      expect(Object.keys(body.error.fields ?? {}).sort()).toEqual(['delivery.pin', 'quantity']);
      expect(body.error.fields?.['delivery.pin']).toBe('PIN code must be 6 digits');
    });

    it('answers malformed JSON with the envelope, not an HTML error page', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/probe')
        .set('Content-Type', 'application/json')
        .send('{"name": ')
        .expect(400);
      const body = res.body as ErrorBody;

      expect(body.error.code).toBe('BAD_REQUEST');
    });
  });
});

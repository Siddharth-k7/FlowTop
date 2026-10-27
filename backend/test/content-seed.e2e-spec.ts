import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { seedContent } from '../prisma/seed-content';
import { resetDatabase } from './database';
import { syncPermissionsAndRoles } from '../src/database/seed-permissions';

describe('content seed integration', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

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
    await seedContent(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('seeds the varied catalogue and is safe to rerun', async () => {
    const firstCounts = await counts(prisma);
    expect(firstCounts).toEqual({ categories: 6, collections: 3, products: 40, articles: 6, sections: 5 });
    expect(await prisma.product.count({ where: { status: 'archived' } })).toBe(3);
    expect(await prisma.product.count({ where: { status: 'draft' } })).toBe(5);
    expect(await prisma.product.count({ where: { isPurchasable: false } })).toBe(5);
    expect(await prisma.specification.count()).toBeGreaterThan(200);

    await seedContent(prisma);
    await expect(counts(prisma)).resolves.toEqual(firstCounts);
  });
});

async function counts(prisma: PrismaService): Promise<Record<string, number>> {
  const [categories, collections, products, articles, sections] = await Promise.all([
    prisma.category.count(), prisma.collection.count(), prisma.product.count(), prisma.journalArticle.count(), prisma.section.count(),
  ]);
  return { categories, collections, products, articles, sections };
}

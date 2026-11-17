import type { AuditService } from '../audit/audit.service';
import { Prisma } from '../generated/prisma/client.js';
import { PublishStateService } from '../_base/publish-state.service';
import { ProductsService } from './products.service';
import type { ProductsRepository } from './products.repository';

function service() {
  const findById = jest.fn();
  const findBySku = jest.fn();
  const orderReferenceCount = jest.fn();
  const repository = { findById, findBySku, list: jest.fn(), create: jest.fn(), update: jest.fn(), orderReferenceCount } as unknown as ProductsRepository;
  const record = jest.fn().mockResolvedValue(undefined);
  const audit = { record } as unknown as AuditService;
  const publishState = new PublishStateService(audit);
  return { products: new ProductsService(repository, audit, publishState), findById, findBySku, orderReferenceCount, record };
}

describe('ProductsService', () => {
  it('rejects a duplicate SKU with a field error', async () => {
    const { products, findBySku } = service();
    findBySku.mockResolvedValue({ id: 'existing' });
    await expect(products.create({ name: 'Opel', sku: 'FT-001', slug: 'opel', price: 450000 }, 'actor')).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fields: { sku: 'This SKU is already in use.' } });
  });

  it('returns NOT_FOUND for an unknown product', async () => {
    const { products } = service();
    await expect(products.find('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('blocks archiving a product referenced by an order', async () => {
    const { products, findById, orderReferenceCount } = service();
    findById.mockResolvedValue({ id: '1', status: 'published', publishedAt: new Date() });
    orderReferenceCount.mockResolvedValue(1);
    await expect(products.transition('1', 'archived', 'actor')).rejects.toThrow('referenced');
  });

  it('refuses to publish without a category, naming the category field', async () => {
    const { products, findById } = service();
    findById.mockResolvedValue({ id: '1', status: 'draft', publishedAt: null, price: 450000, categoryId: null });
    await expect(products.transition('1', 'published', 'actor')).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fields: { categoryId: 'Choose a category before publishing.' } });
  });

  it('reports a slug unique violation on the slug field', async () => {
    const { products } = service();
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test', meta: { target: ['slug'] } });
    const repository = (products as unknown as { repository: { create: jest.Mock } }).repository;
    repository.create = jest.fn().mockRejectedValue(error);
    await expect(products.create({ name: 'Opel', sku: 'FT-NEW', slug: 'opel', price: 100 }, 'actor')).rejects.toMatchObject({ fields: { slug: 'This web address is already in use.' } });
  });

  it('publishes through the shared state service', async () => {
    const { products, findById, record } = service();
    findById.mockResolvedValue({ id: '1', status: 'draft', publishedAt: null, price: 450000, categoryId: 'cat' });
    await products.transition('1', 'published', 'actor');
    expect(record).toHaveBeenCalledWith({ actorId: 'actor', action: 'publish', entityType: 'product', entityId: '1' });
  });
});

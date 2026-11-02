import type { AuditService } from '../audit/audit.service';
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

  it('publishes through the shared state service', async () => {
    const { products, findById, record } = service();
    findById.mockResolvedValue({ id: '1', status: 'draft', publishedAt: null });
    await products.transition('1', 'published', 'actor');
    expect(record).toHaveBeenCalledWith({ actorId: 'actor', action: 'publish', entityType: 'product', entityId: '1' });
  });
});

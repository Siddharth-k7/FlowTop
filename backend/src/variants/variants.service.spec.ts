import type { AuditService } from '../audit/audit.service';
import type { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

function service() {
  const repository = {
    productExists: jest.fn(), countForProduct: jest.fn(), findById: jest.fn(), findByProduct: jest.fn(), findBySuffix: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), reorder: jest.fn(),
  } as unknown as VariantsRepository;
  const record = jest.fn().mockResolvedValue(undefined);
  return { variants: new VariantsService(repository, { record } as unknown as AuditService), repository, record };
}

describe('VariantsService', () => {
  it('makes the first variant the default and resolves a null override to product price', async () => {
    const { variants, repository } = service();
    jest.spyOn(repository, 'productExists').mockResolvedValue(true);
    jest.spyOn(repository, 'countForProduct').mockResolvedValue(0);
    jest.spyOn(repository, 'findBySuffix').mockResolvedValue(null);
    const create = jest.spyOn(repository, 'create').mockResolvedValue({ id: 'v1', name: 'Chrome', skuSuffix: 'CH', priceOverride: null, product: { price: 450000 }, swatchHex: null, image: null, isAvailable: true, isDefault: true, position: 0 } as never);
    const result = await variants.create('p1', { name: 'Chrome', skuSuffix: 'CH' }, 'actor');
    expect(create).toHaveBeenCalledWith('p1', { name: 'Chrome', skuSuffix: 'CH' }, true);
    expect(result.data.price).toBe(450000);
  });

  it('rejects a duplicate suffix within the product', async () => {
    const { variants, repository } = service();
    jest.spyOn(repository, 'productExists').mockResolvedValue(true);
    jest.spyOn(repository, 'findBySuffix').mockResolvedValue({ id: 'other' });
    await expect(variants.create('p1', { name: 'Black', skuSuffix: 'MB' }, 'actor')).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fields: { skuSuffix: 'This suffix is already in use.' } });
  });
});

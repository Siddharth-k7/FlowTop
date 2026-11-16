import { Prisma } from '../generated/prisma/client';
import { ApiException } from '../common/errors/api.exception';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../common/prisma/prisma.service';
import { VariantsService } from './variants.service';

const row = { id: 'v', productId: 'p', name: 'Chrome', skuSuffix: 'CH', priceOverride: 450000, swatchHex: null, isAvailable: true, isDefault: true, product: { price: 450000 } };

function conflict(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('write conflict', { code: 'P2034', clientVersion: 'test' });
}

function service(transaction: jest.Mock, record = jest.fn().mockResolvedValue(undefined)) {
  const prisma = {
    variant: { findUnique: jest.fn().mockResolvedValue(row) },
    $transaction: transaction,
  } as unknown as PrismaService;
  return { variants: new VariantsService(prisma, { record } as unknown as AuditService), record };
}

const dto = { name: 'Chrome', skuSuffix: 'CH', price: 450000, isAvailable: true, isDefault: true };

describe('VariantsService.update retry', () => {
  it('retries a P2034 and then saves', async () => {
    const transaction = jest.fn()
      .mockRejectedValueOnce(conflict())
      .mockRejectedValueOnce(conflict())
      .mockImplementationOnce(async (fn: (tx: unknown) => Promise<typeof row>) => fn({
        variant: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn().mockResolvedValue(row),
        },
      }));
    const { variants, record } = service(transaction);
    const saved = await variants.update('v', dto, 'actor');
    expect(saved.data.isDefault).toBe(true);
    expect(transaction).toHaveBeenCalledTimes(3);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('returns 409 when every attempt is a P2034', async () => {
    const transaction = jest.fn().mockRejectedValue(conflict());
    const { variants, record } = service(transaction);
    await expect(variants.update('v', dto, 'actor')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(transaction).toHaveBeenCalledTimes(3);
    expect(record).not.toHaveBeenCalled();
  });

  it('does not retry a validation failure', async () => {
    const transaction = jest.fn().mockRejectedValue(new ApiException('VALIDATION_FAILED', 'Keep one default finish.', { isDefault: 'Keep one default finish.' }));
    const { variants } = service(transaction);
    await expect(variants.update('v', { ...dto, isDefault: false }, 'actor')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

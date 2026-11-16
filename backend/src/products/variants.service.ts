import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { assertExactReorder } from '../common/reorder';
import { WriteVariantDto } from './dto/variant.dto';

const toVariant = (row: { id: string; name: string; skuSuffix: string; priceOverride: number | null; swatchHex: string | null; isAvailable: boolean; isDefault: boolean }, productPrice: number) => ({
  id: row.id, name: row.name, skuSuffix: row.skuSuffix, price: row.priceOverride ?? productPrice, swatchHex: row.swatchHex, image: null, isAvailable: row.isAvailable, isDefault: row.isDefault,
});

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async product(id: string) {
    const row = await this.prisma.product.findUnique({ where: { id }, select: { id: true, price: true } });
    if (!row) throw new ApiException('NOT_FOUND', 'Product not found');
    return row;
  }

  async list(productId: string) {
    const product = await this.product(productId);
    const rows = await this.prisma.variant.findMany({ where: { productId }, orderBy: { position: 'asc' } });
    return { data: rows.map((row) => toVariant(row, product.price)) };
  }

  async create(productId: string, dto: WriteVariantDto, actorId: string) {
    const product = await this.product(productId);
    const [position, defaults] = await Promise.all([
      this.prisma.variant.count({ where: { productId } }),
      this.prisma.variant.count({ where: { productId, isDefault: true } }),
    ]);
    const makeDefault = dto.isDefault || defaults === 0;
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (makeDefault) await tx.variant.updateMany({ where: { productId }, data: { isDefault: false } });
        return tx.variant.create({ data: { productId, name: dto.name, skuSuffix: dto.skuSuffix, priceOverride: dto.price, swatchHex: dto.swatchHex ?? null, isAvailable: dto.isAvailable, isDefault: makeDefault, position: position + 1 } });
      });
      await this.audit.record({ actorId, action: 'create', entityType: 'variant', entityId: row.id });
      return { data: toVariant(row, product.price) };
    } catch (error: unknown) {
      this.rethrow(error);
      throw error;
    }
  }

  async update(id: string, dto: WriteVariantDto, actorId: string) {
    const existing = await this.prisma.variant.findUnique({ where: { id }, include: { product: { select: { price: true } } } });
    if (!existing) throw new ApiException('NOT_FOUND', 'That finish no longer exists.');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const row = await this.prisma.$transaction(async (tx) => {
          if (!dto.isDefault) {
            const otherDefault = await tx.variant.count({ where: { productId: existing.productId, isDefault: true, NOT: { id } } });
            if (otherDefault === 0) throw new ApiException('VALIDATION_FAILED', 'Keep one default finish.', { isDefault: 'Keep one default finish.' });
          } else {
            await tx.variant.updateMany({ where: { productId: existing.productId, NOT: { id } }, data: { isDefault: false } });
          }
          return tx.variant.update({ where: { id }, data: { name: dto.name, skuSuffix: dto.skuSuffix, priceOverride: dto.price, swatchHex: dto.swatchHex ?? null, isAvailable: dto.isAvailable, isDefault: dto.isDefault } });
        });
        await this.audit.record({ actorId, action: 'update', entityType: 'variant', entityId: id });
        return { data: toVariant(row, existing.product.price) };
      } catch (error: unknown) {
        this.rethrow(error);
        if (error instanceof ApiException) throw error;
        const retry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (retry && attempt < 2) continue;
        if (retry) throw new ApiException('CONFLICT', 'Another save updated this finish at the same time. Try again.');
        throw error;
      }
    }
    throw new ApiException('CONFLICT', 'Another save updated this finish at the same time. Try again.');
  }

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.variant.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'That finish no longer exists.');
    if ((await this.prisma.orderItem.count({ where: { variantId: id } })) > 0) {
      throw new ApiException('CONFLICT', 'This finish is on an order, so it cannot be removed.');
    }
    const others = await this.prisma.variant.count({ where: { productId: existing.productId, NOT: { id } } });
    if (existing.isDefault && others > 0) {
      throw new ApiException('VALIDATION_FAILED', 'Choose another default finish before removing this one.', { isDefault: 'Choose another default finish before removing this one.' });
    }
    await this.prisma.variant.delete({ where: { id } });
    await this.audit.record({ actorId, action: 'delete', entityType: 'variant', entityId: id });
    return { data: null };
  }

  async reorder(productId: string, ids: string[], actorId: string) {
    await this.product(productId);
    await this.prisma.$transaction(async (tx) => {
      const own = await tx.variant.findMany({ where: { productId }, select: { id: true } });
      const ownIds = own.map((row) => row.id);
      const missing = [...new Set(ids.filter((id) => !ownIds.includes(id)))];
      const elsewhere = missing.length ? await tx.variant.findMany({ where: { id: { in: missing } }, select: { id: true } }) : [];
      assertExactReorder(ownIds, ids, elsewhere.map((row) => row.id));
      for (const [index, id] of ids.entries()) await tx.variant.update({ where: { id }, data: { position: index + 1 } });
    });
    await this.audit.record({ actorId, action: 'reorder', entityType: 'variant', entityId: productId });
    return { data: { reordered: true } };
  }

  private rethrow(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiException('VALIDATION_FAILED', 'That SKU ending is already used on this product.', { skuSuffix: 'That SKU ending is already used on this product.' });
    }
  }
}

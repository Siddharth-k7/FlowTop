import { Injectable } from '@nestjs/common';
import { Prisma, Variant } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export const VARIANT_INCLUDE = { product: { select: { price: true } }, image: true } satisfies Prisma.VariantInclude;
export type VariantWithProduct = Prisma.VariantGetPayload<{ include: typeof VARIANT_INCLUDE }>;

@Injectable()
export class VariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  productExists(id: string): Promise<boolean> { return this.prisma.product.count({ where: { id } }).then((count) => count > 0); }
  countForProduct(productId: string): Promise<number> { return this.prisma.variant.count({ where: { productId } }); }
  findById(id: string): Promise<VariantWithProduct | null> { return this.prisma.variant.findUnique({ where: { id }, include: VARIANT_INCLUDE }); }
  findByProduct(productId: string): Promise<VariantWithProduct[]> { return this.prisma.variant.findMany({ where: { productId }, include: VARIANT_INCLUDE, orderBy: { position: 'asc' } }); }
  findBySuffix(productId: string, skuSuffix: string): Promise<Pick<Variant, 'id'> | null> { return this.prisma.variant.findUnique({ where: { productId_skuSuffix: { productId, skuSuffix } }, select: { id: true } }); }

  async create(productId: string, data: Omit<Prisma.VariantCreateInput, 'product'>, makeDefault: boolean): Promise<VariantWithProduct> {
    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) await tx.variant.updateMany({ where: { productId, isDefault: true }, data: { isDefault: false } });
      const position = await tx.variant.count({ where: { productId } });
      return tx.variant.create({ data: { ...data, position, isDefault: makeDefault, product: { connect: { id: productId } } }, include: VARIANT_INCLUDE });
    });
  }

  async update(id: string, data: Prisma.VariantUpdateInput, makeDefault: boolean): Promise<VariantWithProduct> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.variant.findUniqueOrThrow({ where: { id } });
      if (makeDefault) await tx.variant.updateMany({ where: { productId: current.productId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
      return tx.variant.update({ where: { id }, data: { ...data, isDefault: makeDefault }, include: VARIANT_INCLUDE });
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.variant.findUniqueOrThrow({ where: { id } });
      await tx.variant.delete({ where: { id } });
      if (current.isDefault) {
        const replacement = await tx.variant.findFirst({ where: { productId: current.productId }, orderBy: { position: 'asc' } });
        if (replacement) await tx.variant.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    });
  }

  async reorder(productId: string, ids: string[]): Promise<VariantWithProduct[]> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.variant.findMany({ where: { productId }, select: { id: true } });
      if (rows.length !== ids.length || rows.some((row) => !ids.includes(row.id))) throw new Error('Reorder ids must include every variant for the product');
      for (const [position, id] of ids.entries()) await tx.variant.update({ where: { id }, data: { position: position + 1 } });
      return tx.variant.findMany({ where: { productId }, include: VARIANT_INCLUDE, orderBy: { position: 'asc' } });
    });
  }
}

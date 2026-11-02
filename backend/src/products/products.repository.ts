import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import type { ProductListQueryDto } from './dto/product-list-query.dto';

export const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  media: { where: { role: 'primary' }, orderBy: { position: 'asc' as const }, take: 1 },
  _count: { select: { specifications: true, media: true, variants: true, placements: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithSummary = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ProductWithSummary | null> {
    return this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  }

  findBySku(sku: string): Promise<Pick<Product, 'id'> | null> {
    return this.prisma.product.findUnique({ where: { sku }, select: { id: true } });
  }

  async list(query: ProductListQueryDto): Promise<[ProductWithSummary[], number]> {
    const where = this.whereFor(query);
    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.product.count({ where }),
    ]);
  }

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }

  orderReferenceCount(id: string): Promise<number> {
    return this.prisma.orderItem.count({ where: { productId: id } });
  }

  private whereFor(query: ProductListQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }];
    if (query.status) where.status = query.status;
    if (query.category) where.categoryId = query.category;
    if (query.missing === 'images') where.media = { none: {} };
    if (query.missing === 'specs') where.specifications = { none: {} };
    return where;
  }
}

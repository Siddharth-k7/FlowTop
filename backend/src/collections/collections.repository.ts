import { Injectable } from '@nestjs/common';
import { pageToSkipTake } from '../common/dto/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CollectionListQuery } from './dto/collection.dto';

@Injectable()
export class CollectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(query: CollectionListQuery) {
    const where: Prisma.CollectionWhereInput = {};
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    return this.prisma.$transaction([
      this.prisma.collection.findMany({ where, orderBy: { position: 'asc' }, ...pageToSkipTake(query) }),
      this.prisma.collection.count({ where }),
    ]);
  }

  find(id: string) { return this.prisma.collection.findUnique({ where: { id } }); }

  async products(id: string) {
    const rows = await this.prisma.collectionProduct.findMany({ where: { collectionId: id }, orderBy: { position: 'asc' }, select: { productId: true } });
    return rows.map((row) => row.productId);
  }

  slugTaken(slug: string, excludeId?: string) {
    return this.prisma.collection.count({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } }).then((n) => n > 0);
  }

  count() { return this.prisma.collection.count(); }

  create(data: Prisma.CollectionCreateInput) { return this.prisma.collection.create({ data }); }

  update(id: string, data: Prisma.CollectionUpdateInput) { return this.prisma.collection.update({ where: { id }, data }); }

  async replaceProducts(id: string, items: { productId: string; position: number }[]) {
    await this.prisma.$transaction([
      this.prisma.collectionProduct.deleteMany({ where: { collectionId: id } }),
      ...(items.length ? [this.prisma.collectionProduct.createMany({ data: items.map((item) => ({ collectionId: id, productId: item.productId, position: item.position })) })] : []),
    ]);
  }
}

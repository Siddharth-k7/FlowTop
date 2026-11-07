import { Injectable } from '@nestjs/common';
import { Prisma, Specification } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SpecificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
  productExists(id: string): Promise<boolean> { return this.prisma.product.count({ where: { id } }).then((count) => count > 0); }
  findByProduct(productId: string): Promise<Specification[]> { return this.prisma.specification.findMany({ where: { productId }, orderBy: { position: 'asc' } }); }
  async replace(productId: string, items: Prisma.SpecificationCreateManyInput[]): Promise<Specification[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.specification.deleteMany({ where: { productId } });
      if (items.length) await tx.specification.createMany({ data: items });
      return tx.specification.findMany({ where: { productId }, orderBy: { position: 'asc' } });
    });
  }
}

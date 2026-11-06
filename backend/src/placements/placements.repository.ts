import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PlacementLocationType, Prisma } from '../generated/prisma/client';

@Injectable()
export class PlacementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  forProduct(productId: string) {
    return this.prisma.placement.findMany({ where: { productId }, orderBy: [{ locationType: 'asc' }, { position: 'asc' }] });
  }

  find(id: string) { return this.prisma.placement.findUnique({ where: { id } }); }

  categories() { return this.prisma.category.findMany({ select: { id: true, name: true }, orderBy: { position: 'asc' } }); }
  collections() { return this.prisma.collection.findMany({ select: { id: true, name: true }, orderBy: { position: 'asc' } }); }
  pages() { return this.prisma.page.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }); }
  products() { return this.prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }); }

  create(data: Prisma.PlacementCreateInput) { return this.prisma.placement.create({ data }); }
  update(id: string, data: Prisma.PlacementUpdateInput) { return this.prisma.placement.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.placement.delete({ where: { id } }); }

  async reorder(locationType: PlacementLocationType, locationId: string, ids: string[]) {
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.placement.update({
      where: { id },
      data: { position: index + 1, locationType, locationId },
    })));
  }

  countIn(locationType: PlacementLocationType, locationId: string) {
    return this.prisma.placement.count({ where: { locationType, locationId } });
  }
}

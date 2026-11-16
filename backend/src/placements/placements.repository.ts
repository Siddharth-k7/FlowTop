import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PlacementLocationType, Prisma } from '../generated/prisma/client';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  findByIds(ids: string[]) { return this.prisma.placement.findMany({ where: { id: { in: ids } } }); }

  productIdsIn(locationType: PlacementLocationType, locationId: string) {
    return this.prisma.placement.findMany({ where: { locationType, locationId }, select: { productId: true } }).then((rows) => rows.map((row) => row.productId));
  }

  /** Positions only. The caller has already rejected ids from another location. */
  async reorderPositions(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.placement.update({ where: { id }, data: { position: index + 1 } })));
  }

  productExists(id: string) {
    return this.prisma.product.findUnique({ where: { id }, select: { id: true } }).then((row) => row !== null);
  }

  /** The id has to be a row of that location type. Homepage keys are not looked up here. */
  async locationExists(locationType: PlacementLocationType, locationId: string): Promise<boolean> {
    if (!UUID.test(locationId)) return false;
    if (locationType === 'category') return (await this.prisma.category.findUnique({ where: { id: locationId }, select: { id: true } })) !== null;
    if (locationType === 'collection') return (await this.prisma.collection.findUnique({ where: { id: locationId }, select: { id: true } })) !== null;
    if (locationType === 'campaign_page') return (await this.prisma.page.findUnique({ where: { id: locationId }, select: { id: true } })) !== null;
    if (locationType === 'related') return (await this.prisma.product.findUnique({ where: { id: locationId }, select: { id: true } })) !== null;
    return false;
  }

  countIn(locationType: PlacementLocationType, locationId: string) {
    return this.prisma.placement.count({ where: { locationType, locationId } });
  }
}

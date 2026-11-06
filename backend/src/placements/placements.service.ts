import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { PlacementLocationType } from '../generated/prisma/client';
import { PlacementsRepository } from './placements.repository';

const HOME: Record<string, string> = {
  featured: 'Homepage: Featured Products',
  new_arrivals: 'Homepage: New Arrivals',
  bestsellers: 'Homepage: Bestsellers',
  recommended: 'Homepage: Recommended',
};

@Injectable()
export class PlacementsService {
  constructor(private readonly repository: PlacementsRepository, private readonly audit: AuditService) {}

  async names(): Promise<Map<string, string>> {
    const [categories, collections, pages, products] = await Promise.all([
      this.repository.categories(), this.repository.collections(), this.repository.pages(), this.repository.products(),
    ]);
    const map = new Map<string, string>(Object.entries(HOME));
    for (const row of categories) map.set(row.id, `Category: ${row.name}`);
    for (const row of collections) map.set(row.id, `Collection: ${row.name}`);
    for (const row of pages) map.set(row.id, `Page: ${row.title}`);
    for (const row of products) map.set(row.id, `Related: ${row.name}`);
    return map;
  }

  async locations() {
    const map = await this.names();
    const [categories, collections, pages, products] = await Promise.all([
      this.repository.categories(), this.repository.collections(), this.repository.pages(), this.repository.products(),
    ]);
    const rows = [
      ...Object.entries(HOME).map(([locationId, locationName]) => ({ locationType: 'homepage_section' as const, locationId, locationName })),
      ...categories.map((row) => ({ locationType: 'category' as const, locationId: row.id, locationName: map.get(row.id) ?? row.name })),
      ...collections.map((row) => ({ locationType: 'collection' as const, locationId: row.id, locationName: map.get(row.id) ?? row.name })),
      ...pages.map((row) => ({ locationType: 'campaign_page' as const, locationId: row.id, locationName: map.get(row.id) ?? row.title })),
      ...products.map((row) => ({ locationType: 'related' as const, locationId: row.id, locationName: map.get(row.id) ?? row.name })),
    ];
    return { data: rows };
  }

  async list(productId: string) {
    const map = await this.names();
    const rows = await this.repository.forProduct(productId);
    return { data: rows.map((row) => ({
      id: row.id, productId: row.productId, locationType: row.locationType, locationId: row.locationId,
      locationName: map.get(row.locationId) ?? row.locationId, position: row.position, label: row.label ?? '', enabled: row.enabled,
    })) };
  }

  async create(productId: string, locationType: PlacementLocationType, locationId: string, actorId: string) {
    const map = await this.names();
    if (!map.has(locationId) && locationType !== 'homepage_section') throw new ApiException('VALIDATION_FAILED', 'That place does not exist.', { locationId: 'That place does not exist.' });
    if (locationType === 'homepage_section' && !HOME[locationId]) throw new ApiException('VALIDATION_FAILED', 'That place does not exist.', { locationId: 'That place does not exist.' });
    const position = (await this.repository.countIn(locationType, locationId)) + 1;
    try {
      const row = await this.repository.create({ product: { connect: { id: productId } }, locationType, locationId, position, label: '', enabled: true });
      await this.audit.record({ actorId, action: 'create', entityType: 'placement', entityId: row.id });
      return this.list(productId);
    } catch (error: unknown) {
      if (error instanceof ApiException) throw error;
      throw new ApiException('CONFLICT', 'This product is already placed there.');
    }
  }

  async update(id: string, enabled: boolean | undefined, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'That placement no longer exists.');
    await this.repository.update(id, { enabled });
    await this.audit.record({ actorId, action: 'update', entityType: 'placement', entityId: id });
    return this.list(existing.productId);
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'That placement no longer exists.');
    await this.repository.remove(id);
    await this.audit.record({ actorId, action: 'delete', entityType: 'placement', entityId: id });
    return { data: null };
  }

  async reorder(locationType: PlacementLocationType, locationId: string, ids: string[], actorId: string) {
    await this.repository.reorder(locationType, locationId, ids);
    await this.audit.record({ actorId, action: 'reorder', entityType: 'placement', entityId: locationId });
    return { data: { reordered: true } };
  }
}

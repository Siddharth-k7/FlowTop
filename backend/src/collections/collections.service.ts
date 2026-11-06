import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { SlugService } from '../_base/slug.service';
import { CollectionsRepository } from './collections.repository';
import { CollectionProductsDto, CreateCollectionDto, WriteCollectionDto, CollectionListQuery } from './dto/collection.dto';

const toAdmin = (row: { id: string; name: string; slug: string; description: string | null; story: string; heroMediaId: string | null; status: string }, productIds: string[] = []) => ({
  id: row.id, name: row.name, slug: row.slug, description: row.description, story: row.story, heroMediaId: row.heroMediaId, status: row.status, productIds,
});

@Injectable()
export class CollectionsService {
  constructor(private readonly repository: CollectionsRepository, private readonly audit: AuditService, private readonly slugs: SlugService) {}

  async list(query: CollectionListQuery) {
    const [rows, total] = await this.repository.list(query);
    return paginate(rows.map((row) => toAdmin(row)), total, query);
  }

  async find(id: string) {
    const row = await this.repository.find(id);
    if (!row) throw new ApiException('NOT_FOUND', 'Collection not found');
    const ranks = await this.repository.products(id);
    return { data: toAdmin(row, ranks) };
  }

  async create(dto: CreateCollectionDto, actorId: string) {
    const slug = await this.slugs.unique(dto.name, { exists: (s, exclude) => this.repository.slugTaken(s, exclude) }, dto.slug);
    const row = await this.repository.create({
      name: dto.name, slug, description: dto.description ?? null, story: dto.story ?? '', position: (await this.repository.count()) + 1, status: 'draft',
      ...(dto.heroMediaId ? { heroMedia: { connect: { id: dto.heroMediaId } } } : {}),
    });
    await this.audit.record({ actorId, action: 'create', entityType: 'collection', entityId: row.id });
    return { data: toAdmin(row) };
  }

  async update(id: string, dto: WriteCollectionDto, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Collection not found');
    const slug = dto.slug ? await this.slugs.unique(dto.name ?? existing.name, { exists: (s, exclude) => this.repository.slugTaken(s, exclude) }, dto.slug, id) : undefined;
    const heroId = dto.heroMediaId ? dto.heroMediaId : dto.heroMediaId === undefined ? undefined : null;
    const hero = heroId === undefined ? undefined : heroId ? { connect: { id: heroId } } : { disconnect: true };
    await this.repository.update(id, { name: dto.name, slug, description: dto.description, story: dto.story, ...(hero ? { heroMedia: hero } : {}) });
    if (dto.status && dto.status !== existing.status) {
      await this.repository.update(id, { status: dto.status });
      if (dto.status === 'published') await this.audit.record({ actorId, action: 'publish', entityType: 'collection', entityId: id });
    }
    await this.audit.record({ actorId, action: 'update', entityType: 'collection', entityId: id });
    return this.find(id);
  }

  async replaceProducts(id: string, dto: CollectionProductsDto, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Collection not found');
    await this.repository.replaceProducts(id, dto.items);
    await this.audit.record({ actorId, action: 'update', entityType: 'collection', entityId: id, metadata: { products: dto.items.length } });
    return this.find(id);
  }
}

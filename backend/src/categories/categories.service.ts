import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { SlugService } from '../_base/slug.service';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const toAdmin = (row: { id: string; name: string; slug: string; description: string | null; parentId: string | null; position: number; status: string }) => ({
  id: row.id, name: row.name, slug: row.slug, description: row.description, parentId: row.parentId, position: row.position, status: row.status,
});

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository, private readonly audit: AuditService, private readonly slugs: SlugService) {}

  async list() {
    return { data: (await this.repository.list()).map(toAdmin) };
  }

  async create(dto: CreateCategoryDto, actorId: string) {
    const slug = await this.slugs.unique(dto.name, { exists: (s, exclude) => this.repository.slugTaken(s, exclude) }, dto.slug);
    const row = await this.repository.create({ name: dto.name, slug, description: dto.description ?? null, position: (await this.repository.count()) + 1, status: 'draft' });
    await this.audit.record({ actorId, action: 'create', entityType: 'category', entityId: row.id });
    return { data: toAdmin(row) };
  }

  async update(id: string, dto: UpdateCategoryDto, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Category not found');
    const slug = dto.slug ? await this.slugs.unique(dto.name ?? existing.name, { exists: (s, exclude) => this.repository.slugTaken(s, exclude) }, dto.slug, id) : undefined;
    const row = await this.repository.update(id, { name: dto.name, slug, description: dto.description });
    await this.audit.record({ actorId, action: 'update', entityType: 'category', entityId: id });
    return { data: toAdmin(row) };
  }

  async reorder(ids: string[], actorId: string) {
    await this.repository.reorder(ids);
    await this.audit.record({ actorId, action: 'reorder', entityType: 'category', entityId: 'categories' });
    return { data: { reordered: true } };
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repository.find(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Category not found');
    if ((await this.repository.productCount(id)) > 0) {
      throw new ApiException('CONFLICT', 'This category still has products. Move them to another category first.');
    }
    await this.repository.remove(id);
    await this.audit.record({ actorId, action: 'delete', entityType: 'category', entityId: id });
    return { data: null };
  }
}

import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { PublishStateService } from '../_base/publish-state.service';
import { SlugService } from '../_base/slug.service';
import { CreatePageDto, CreateSectionDto, PageListQuery, UpdateSectionDto, WritePageDto } from './dto/page.dto';
import { assertSectionConfig } from './section-config';

const seoOf = (row: { seoTitle: string; seoDescription: string; seoCanonical: string | null }) => ({ title: row.seoTitle, description: row.seoDescription, canonical: row.seoCanonical, shareImage: null });

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly slugs: SlugService, private readonly publishState: PublishStateService) {}

  private async toPage(id: string) {
    const row = await this.prisma.page.findUnique({ where: { id }, include: { sections: { orderBy: { position: 'asc' } } } });
    if (!row) throw new ApiException('NOT_FOUND', 'Page not found');
    return { id: row.id, title: row.title, slug: row.slug, status: row.status, seo: seoOf(row), sections: row.sections.map((section) => ({ id: section.id, type: section.type, position: section.position, visible: section.visible, config: section.config as Record<string, unknown> })) };
  }

  async list(query: PageListQuery) {
    const where: Prisma.PageWhereInput = {};
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.page.count({ where }),
    ]);
    return paginate(rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, status: row.status })), total, query);
  }

  find(id: string) { return this.toPage(id).then((data) => ({ data })); }

  private taken(slug: string, exclude?: string) {
    return this.prisma.page.count({ where: { slug, ...(exclude ? { NOT: { id: exclude } } : {}) } }).then((n) => n > 0);
  }

  private async resolveSlug(title: string, requested: string | undefined, excludeId?: string) {
    if (requested === '') {
      if (await this.taken('', excludeId)) throw new ApiException('VALIDATION_FAILED', 'The homepage address is already used.', { slug: 'The homepage address is already used.' });
      return '';
    }
    return this.slugs.unique(title, { exists: (slug, exclude) => this.taken(slug, exclude) }, requested, excludeId);
  }

  async create(dto: CreatePageDto, actorId: string) {
    const slug = await this.resolveSlug(dto.title, dto.slug);
    const row = await this.prisma.page.create({ data: { title: dto.title, slug, seoTitle: dto.seoTitle ?? '', seoDescription: dto.seoDescription ?? '', seoCanonical: dto.seoCanonical ?? null, status: 'draft' } });
    await this.audit.record({ actorId, action: 'create', entityType: 'page', entityId: row.id });
    return this.find(row.id);
  }

  async update(id: string, dto: WritePageDto, actorId: string) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Page not found');
    const slug = dto.slug !== undefined ? await this.resolveSlug(dto.title ?? existing.title, dto.slug, id) : undefined;
    await this.prisma.page.update({ where: { id }, data: { title: dto.title, slug, seoTitle: dto.seoTitle, seoDescription: dto.seoDescription, seoCanonical: dto.seoCanonical } });
    await this.audit.record({ actorId, action: 'update', entityType: 'page', entityId: id });
    return this.find(id);
  }

  async publish(id: string, actorId: string) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Page not found');
    if (!existing.title.trim()) throw new ApiException('VALIDATION_FAILED', 'Give the page a title before publishing.', { title: 'Give the page a title before publishing.' });
    await this.publishState.transition(existing, 'published', {
      updateStatus: (recordId, status, publishedAt) => this.prisma.page.update({ where: { id: recordId }, data: { status, publishedAt } }),
    }, 'page', actorId);
    return this.find(id);
  }

  async addSection(pageId: string, dto: CreateSectionDto, actorId: string) {
    if (!(await this.prisma.page.findUnique({ where: { id: pageId }, select: { id: true } }))) throw new ApiException('NOT_FOUND', 'Page not found');
    assertSectionConfig(dto.config);
    const position = (await this.prisma.section.count({ where: { pageId } })) + 1;
    const row = await this.prisma.section.create({ data: { pageId, type: dto.type, position, visible: dto.visible ?? true, config: dto.config as Prisma.InputJsonValue } });
    await this.audit.record({ actorId, action: 'create', entityType: 'section', entityId: row.id });
    return { data: { id: row.id, type: row.type, position: row.position, visible: row.visible, config: row.config } };
  }

  async updateSection(id: string, dto: UpdateSectionDto, actorId: string) {
    const existing = await this.prisma.section.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Section not found');
    if (dto.config) assertSectionConfig(dto.config);
    const row = await this.prisma.section.update({ where: { id }, data: { visible: dto.visible, ...(dto.config ? { config: dto.config as Prisma.InputJsonValue } : {}) } });
    await this.audit.record({ actorId, action: 'update', entityType: 'section', entityId: id });
    return { data: { id: row.id, type: row.type, position: row.position, visible: row.visible, config: row.config } };
  }

  async removeSection(id: string, actorId: string) {
    const existing = await this.prisma.section.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Section not found');
    await this.prisma.section.delete({ where: { id } });
    await this.audit.record({ actorId, action: 'delete', entityType: 'section', entityId: id });
    return { data: null };
  }

  async duplicateSection(id: string, actorId: string) {
    const existing = await this.prisma.section.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Section not found');
    const row = await this.prisma.section.create({ data: { pageId: existing.pageId, type: existing.type, position: existing.position + 1, visible: existing.visible, config: existing.config as Prisma.InputJsonValue } });
    await this.audit.record({ actorId, action: 'create', entityType: 'section', entityId: row.id, metadata: { duplicatedFrom: id } });
    return { data: { id: row.id, type: row.type, position: row.position, visible: row.visible, config: row.config } };
  }

  async reorder(pageId: string, ids: string[], actorId: string) {
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.section.update({ where: { id }, data: { position: index + 1, pageId } })));
    await this.audit.record({ actorId, action: 'reorder', entityType: 'section', entityId: pageId });
    return { data: { reordered: true } };
  }
}

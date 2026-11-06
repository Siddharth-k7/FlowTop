import { Injectable } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { PublishStateService } from '../_base/publish-state.service';
import { SlugService } from '../_base/slug.service';

export class JournalListQuery extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsString() status?: string;
}

export class WriteJournalDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) slug?: string;
  @IsOptional() @IsString() category?: string | null;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() heroImageId?: string | null;
}

const toAdmin = (row: { id: string; title: string; slug: string; category: string | null; excerpt: string; body: string; heroImageId: string | null; status: string; publishedAt: Date | null }) => ({
  id: row.id, title: row.title, slug: row.slug, category: row.category, excerpt: row.excerpt, body: row.body, heroImageId: row.heroImageId, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null,
});

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly slugs: SlugService, private readonly publishState: PublishStateService) {}

  async list(query: JournalListQuery) {
    const where: Prisma.JournalArticleWhereInput = {};
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
    if (query.status === 'draft' || query.status === 'published' || query.status === 'unpublished' || query.status === 'archived') where.status = query.status;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.journalArticle.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.journalArticle.count({ where }),
    ]);
    return paginate(rows.map(toAdmin), total, query);
  }

  async find(id: string) {
    const row = await this.prisma.journalArticle.findUnique({ where: { id } });
    if (!row) throw new ApiException('NOT_FOUND', 'Article not found');
    return { data: toAdmin(row) };
  }

  async create(dto: WriteJournalDto, actorId: string) {
    if (!dto.title || !dto.slug) throw new ApiException('VALIDATION_FAILED', 'Give the article a title and a web address.', { title: 'Give the article a title.' });
    const slug = await this.slugs.unique(dto.title, { exists: (slug, exclude) => this.prisma.journalArticle.count({ where: { slug, ...(exclude ? { NOT: { id: exclude } } : {}) } }).then((n) => n > 0) }, dto.slug);
    const row = await this.prisma.journalArticle.create({ data: { title: dto.title, slug, category: dto.category ?? null, excerpt: dto.excerpt ?? '', body: dto.body ?? '', ...(dto.heroImageId ? { heroImage: { connect: { id: dto.heroImageId } } } : {}), status: 'draft' } });
    await this.audit.record({ actorId, action: 'create', entityType: 'journal_article', entityId: row.id });
    return { data: toAdmin(row) };
  }

  async update(id: string, dto: WriteJournalDto, actorId: string) {
    const existing = await this.prisma.journalArticle.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Article not found');
    const slug = dto.slug ? await this.slugs.unique(dto.title ?? existing.title, { exists: (value, exclude) => this.prisma.journalArticle.count({ where: { slug: value, ...(exclude ? { NOT: { id: exclude } } : {}) } }).then((n) => n > 0) }, dto.slug, id) : undefined;
    const heroId = dto.heroImageId ? dto.heroImageId : dto.heroImageId === undefined ? undefined : null;
    const hero = heroId === undefined ? undefined : heroId ? { connect: { id: heroId } } : { disconnect: true };
    const row = await this.prisma.journalArticle.update({ where: { id }, data: { title: dto.title, slug, category: dto.category, excerpt: dto.excerpt, body: dto.body, ...(hero ? { heroImage: hero } : {}) } });
    await this.audit.record({ actorId, action: 'update', entityType: 'journal_article', entityId: id });
    return { data: toAdmin(row) };
  }

  async publish(id: string, actorId: string) {
    const existing = await this.prisma.journalArticle.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Article not found');
    if (!existing.title.trim() || !existing.body.trim()) throw new ApiException('VALIDATION_FAILED', 'A title and an article are required before publishing.', { body: 'Write the article before publishing.' });
    await this.publishState.transition(existing, 'published', {
      updateStatus: (recordId, status, publishedAt) => this.prisma.journalArticle.update({ where: { id: recordId }, data: { status, publishedAt } }),
    }, 'journal_article', actorId);
    return this.find(id);
  }
}

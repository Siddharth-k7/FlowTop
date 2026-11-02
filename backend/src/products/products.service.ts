import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { PublishStateService } from '../_base/publish-state.service';
import { paginate } from '../common/dto/pagination';
import { BulkProductDto } from './dto/bulk-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly audit: AuditService,
    private readonly publishState: PublishStateService,
  ) {}

  async list(query: ProductListQueryDto) {
    const [rows, total] = await this.repository.list(query);
    return paginate(rows, total, query);
  }

  async find(id: string) {
    const product = await this.repository.findById(id);
    if (!product) throw new ApiException('NOT_FOUND', 'Product not found');
    return { data: product };
  }

  async create(dto: CreateProductDto, actorId: string) {
    await this.ensureSkuAvailable(dto.sku);
    try {
      const product = await this.repository.create(this.toCreateData(dto));
      await this.audit.record({ actorId, action: 'create', entityType: 'product', entityId: product.id });
      return { data: product };
    } catch (error: unknown) {
      this.rethrowDuplicateSku(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Product not found');
    if (dto.sku && dto.sku !== existing.sku) await this.ensureSkuAvailable(dto.sku, id);
    try {
      const product = await this.repository.update(id, this.toUpdateData(dto));
      await this.audit.record({ actorId, action: 'update', entityType: 'product', entityId: id });
      return { data: product };
    } catch (error: unknown) {
      this.rethrowDuplicateSku(error);
      throw error;
    }
  }

  async transition(id: string, status: 'published' | 'unpublished' | 'archived', actorId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiException('NOT_FOUND', 'Product not found');
    const updated = await this.publishState.transition(existing, status, {
      updateStatus: (recordId, nextStatus, publishedAt) => this.repository.update(recordId, { status: nextStatus, publishedAt }),
    }, 'product', actorId, async () => (status === 'archived' ? (await this.repository.orderReferenceCount(id)) > 0 : false));
    return { data: updated };
  }

  async bulk(dto: BulkProductDto, actorId: string) {
    const results = [];
    for (const id of dto.ids) results.push(await this.transition(id, dto.action === 'publish' ? 'published' : dto.action === 'unpublish' ? 'unpublished' : 'archived', actorId));
    return { data: results.map(({ data }) => data) };
  }

  private async ensureSkuAvailable(sku: string, excludeId?: string): Promise<void> {
    const match = await this.repository.findBySku(sku);
    if (match && match.id !== excludeId) throw new ApiException('VALIDATION_FAILED', 'This SKU is already in use.', { sku: 'This SKU is already in use.' });
  }

  private toCreateData(dto: CreateProductDto): Prisma.ProductCreateInput {
    const { categoryId, ...rest } = dto;
    return { ...rest, category: categoryId ? { connect: { id: categoryId } } : undefined };
  }

  private toUpdateData(dto: UpdateProductDto): Prisma.ProductUpdateInput {
    const { categoryId, ...rest } = dto;
    return { ...rest, category: categoryId ? { connect: { id: categoryId } } : undefined };
  }

  private rethrowDuplicateSku(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ApiException('VALIDATION_FAILED', 'This SKU is already in use.', { sku: 'This SKU is already in use.' });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantsRepository } from './variants.repository';

@Injectable()
export class VariantsService {
  constructor(private readonly repository: VariantsRepository, private readonly audit: AuditService) {}

  async list(productId: string) { await this.requireProduct(productId); return { data: (await this.repository.findByProduct(productId)).map(toResponse) }; }

  async create(productId: string, dto: CreateVariantDto, actorId: string) {
    await this.requireProduct(productId); await this.ensureSuffix(productId, dto.skuSuffix);
    const first = (await this.repository.countForProduct(productId)) === 0;
    try {
      const row = await this.repository.create(productId, toCreateData(dto), first || dto.isDefault === true);
      await this.audit.record({ actorId, action: 'create', entityType: 'variant', entityId: row.id });
      return { data: toResponse(row) };
    } catch (error: unknown) { this.rethrowDuplicate(error); throw error; }
  }

  async update(id: string, dto: UpdateVariantDto, actorId: string) {
    const current = await this.requireVariant(id);
    if (dto.skuSuffix && dto.skuSuffix !== current.skuSuffix) await this.ensureSuffix(current.productId, dto.skuSuffix, id);
    try {
      const row = await this.repository.update(id, toUpdateData(dto), dto.isDefault === true);
      await this.audit.record({ actorId, action: 'update', entityType: 'variant', entityId: id });
      return { data: toResponse(row) };
    } catch (error: unknown) { this.rethrowDuplicate(error); throw error; }
  }

  async remove(id: string, actorId: string) {
    const current = await this.requireVariant(id);
    await this.repository.remove(id);
    await this.audit.record({ actorId, action: 'delete', entityType: 'variant', entityId: id });
    return { data: { id: current.id } };
  }

  async reorder(productId: string, ids: string[], actorId: string) {
    await this.requireProduct(productId);
    try { const rows = await this.repository.reorder(productId, ids); await this.audit.record({ actorId, action: 'reorder', entityType: 'variant', entityId: productId }); return { data: rows.map(toResponse) }; }
    catch (error: unknown) { if (error instanceof Error && error.message.startsWith('Reorder ids')) throw new ApiException('VALIDATION_FAILED', error.message, { ids: error.message }); throw error; }
  }

  private async requireProduct(id: string): Promise<void> { if (!(await this.repository.productExists(id))) throw new ApiException('NOT_FOUND', 'Product not found'); }
  private async requireVariant(id: string) { const row = await this.repository.findById(id); if (!row) throw new ApiException('NOT_FOUND', 'Variant not found'); return row; }
  private async ensureSuffix(productId: string, skuSuffix: string, excludeId?: string) { const match = await this.repository.findBySuffix(productId, skuSuffix); if (match && match.id !== excludeId) throw new ApiException('VALIDATION_FAILED', 'This variant suffix is already in use for the product.', { skuSuffix: 'This suffix is already in use.' }); }
  private rethrowDuplicate(error: unknown): void { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ApiException('VALIDATION_FAILED', 'This variant suffix is already in use for the product.', { skuSuffix: 'This suffix is already in use.' }); }
}

function toCreateData(dto: CreateVariantDto): Omit<Prisma.VariantCreateInput, 'product'> {
  const data = { ...dto };
  delete data.isDefault;
  return data;
}
function toUpdateData(dto: UpdateVariantDto): Prisma.VariantUpdateInput {
  const data = { ...dto };
  delete data.isDefault;
  return data;
}
function toResponse(row: Awaited<ReturnType<VariantsRepository['findById']>> extends infer T ? Exclude<T, null> : never) { return { id: row.id, name: row.name, skuSuffix: row.skuSuffix, price: row.priceOverride ?? row.product.price, priceOverride: row.priceOverride, swatchHex: row.swatchHex, image: row.image, isAvailable: row.isAvailable, isDefault: row.isDefault, position: row.position }; }

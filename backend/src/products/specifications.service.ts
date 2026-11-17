import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReplaceSpecificationsDto } from './dto/specification.dto';

@Injectable()
export class SpecificationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(productId: string) {
    if (!(await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) throw new ApiException('NOT_FOUND', 'Product not found');
    const rows = await this.prisma.specification.findMany({ where: { productId }, orderBy: { position: 'asc' } });
    return { data: rows.map((row) => ({ id: row.id, group: row.group, name: row.name, value: row.value, unit: row.unit, type: row.type, position: row.position })) };
  }

  async replace(productId: string, dto: ReplaceSpecificationsDto, actorId: string) {
    if (!(await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) throw new ApiException('NOT_FOUND', 'Product not found');
    const fields: Record<string, string> = {};
    dto.items.forEach((item, index) => { if (!item.value.trim()) fields[`items.${index}.value`] = 'A specification needs a value.'; });
    if (Object.keys(fields).length) throw new ApiException('VALIDATION_FAILED', 'A specification needs a value.', fields);
    await this.prisma.$transaction(async (tx) => {
      await tx.specification.deleteMany({ where: { productId } });
      if (dto.items.length) {
        await tx.specification.createMany({ data: dto.items.map((item, index) => ({ productId, group: item.group ?? null, name: item.name, value: item.value, unit: item.unit ?? null, type: item.type, position: item.position || index + 1 })) });
      }
    });
    await this.audit.record({ actorId, action: 'update', entityType: 'specification', entityId: productId, metadata: { count: dto.items.length } });
    return this.list(productId);
  }
}

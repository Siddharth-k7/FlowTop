import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { ReplaceSpecificationsDto } from './dto/specification.dto';
import { SpecificationsRepository } from './specifications.repository';

@Injectable()
export class SpecificationsService {
  constructor(private readonly repository: SpecificationsRepository, private readonly audit: AuditService) {}
  async list(productId: string) { await this.requireProduct(productId); return { data: await this.repository.findByProduct(productId) }; }
  async replace(productId: string, dto: ReplaceSpecificationsDto, actorId: string) {
    await this.requireProduct(productId);
    const items = dto.items.map((item, position) => ({ productId, group: item.group ?? null, name: item.name.trim(), value: item.value.trim(), unit: item.unit ?? null, type: item.type, position }));
    if (items.some((item) => !item.name || !item.value)) throw new ApiException('VALIDATION_FAILED', 'Specification name and value cannot be empty.', { items: 'Every specification must have a name and value.' });
    const rows = await this.repository.replace(productId, items);
    await this.audit.record({ actorId, action: 'update', entityType: 'specification', entityId: productId, metadata: { count: rows.length } });
    return { data: rows };
  }
  private async requireProduct(id: string): Promise<void> { if (!(await this.repository.productExists(id))) throw new ApiException('NOT_FOUND', 'Product not found'); }
}

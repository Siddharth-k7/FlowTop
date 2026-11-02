import { Injectable } from '@nestjs/common';
import { pageToSkipTake, paginate } from '../common/dto/pagination';
import type { Paginated } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { Prisma } from '../generated/prisma/client';
import { AuditEntry } from './audit-entry';
import { AuditRow, AuditRepository } from './audit.repository';
import { AuditEventResponse, ListAuditQuery } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  /**
   * Writes one audit row.
   *
   *   await this.audit.record({ actorId: user.id, action: 'publish', entityType: 'product', entityId: product.id });
   *
   * Pass the transaction client when the change runs in a transaction, so the
   * audit row commits or rolls back with it. Never log a change that did not happen.
   *
   *   await this.prisma.$transaction(async (tx) => {
   *     await this.repository.publish(id, tx); // repository methods take the tx client
   *     await this.audit.record({ ... }, tx);
   *   });
   *
   * Throws if the row cannot be written. An unaudited sensitive action should fail, not pass silently.
   */
  record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    return this.repository.insert(entry, tx);
  }

  /** The log, newest first. `from` is inclusive and `to` exclusive, so consecutive ranges never double count. */
  async list(query: ListAuditQuery): Promise<Paginated<AuditEventResponse>> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    for (const [field, date] of [['from', from], ['to', to]] as const) {
      if (date && Number.isNaN(date.getTime())) {
        throw new ApiException('VALIDATION_FAILED', 'That date does not exist.', { [field]: 'That date does not exist.' });
      }
    }
    if (from && to && from >= to) {
      throw new ApiException('VALIDATION_FAILED', 'The end of the range must be after its start.', {
        to: 'Must be after from.',
      });
    }

    const [rows, total] = await this.repository.list(pageToSkipTake(query), {
      actorId: query.actorId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      from,
      to,
    });
    return paginate(rows.map(toResponse), total, query);
  }
}

function toResponse(row: AuditRow): AuditEventResponse {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor,
  };
}

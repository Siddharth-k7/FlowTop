import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AuditEntry } from './audit-entry';
import { AuditRepository } from './audit.repository';

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
}

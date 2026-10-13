import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuditAction } from '../audit/audit-entry';

export type PublishStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export interface PublishableRecord {
  id: string;
  status: PublishStatus;
  publishedAt: Date | null;
}

export interface PublishStateRepository<T extends PublishableRecord = PublishableRecord> {
  updateStatus(id: string, status: PublishStatus, publishedAt: Date | null): Promise<T>;
}

const LEGAL_TRANSITIONS: Record<PublishStatus, readonly PublishStatus[]> = {
  draft: ['published'],
  published: ['unpublished', 'archived'],
  unpublished: ['published', 'archived'],
  archived: [],
};

@Injectable()
export class PublishStateService {
  constructor(private readonly audit: AuditService) {}

  canTransition(from: PublishStatus, to: PublishStatus): boolean {
    return LEGAL_TRANSITIONS[from].includes(to);
  }

  async transition<T extends PublishableRecord>(
    record: T,
    to: PublishStatus,
    repository: PublishStateRepository<T>,
    entityType: string,
    actorId: string,
    hasBlockingReferences?: (record: T) => Promise<boolean>,
  ): Promise<T> {
    if (!this.canTransition(record.status, to)) {
      throw new Error(`Illegal publish transition: ${record.status} to ${to}`);
    }
    if (to === 'archived' && hasBlockingReferences && (await hasBlockingReferences(record))) {
      throw new Error('This record cannot be archived because it is referenced');
    }

    const publishedAt = to === 'published' ? record.publishedAt ?? new Date() : null;
    const updated = await repository.updateStatus(record.id, to, publishedAt);
    const action: AuditAction = to === 'published' ? 'publish' : to === 'unpublished' ? 'unpublish' : to === 'archived' ? 'archive' : 'status_change';
    await this.audit.record({ actorId, action, entityType, entityId: record.id });
    return updated;
  }
}

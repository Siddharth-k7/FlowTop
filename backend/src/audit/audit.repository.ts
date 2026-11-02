import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AuditEntry } from './audit-entry';

const AUDIT_ROW_SELECT = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  actor: { select: { id: true, name: true, email: true } },
} satisfies Prisma.AuditEventSelect;

export type AuditRow = Prisma.AuditEventGetPayload<{ select: typeof AUDIT_ROW_SELECT }>;

export interface AuditFilter {
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
}

/**
 * Append only: insert and read, nothing else. There is deliberately no update
 * or delete here, and a database trigger refuses both even if someone tries.
 */
@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(entry: AuditEntry, client: Prisma.TransactionClient = this.prisma): Promise<void> {
    await client.auditEvent.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata ?? {},
      },
    });
  }

  /** Newest first. The actor is joined in, so one query gives readable rows. */
  async list(page: { skip: number; take: number }, filter: AuditFilter): Promise<[AuditRow[], number]> {
    const where: Prisma.AuditEventWhereInput = {
      actorId: filter.actorId,
      action: filter.action,
      entityType: filter.entityType,
      entityId: filter.entityId,
      ...(filter.from || filter.to ? { createdAt: { gte: filter.from, lt: filter.to } } : {}),
    };
    return this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        select: AUDIT_ROW_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...page,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
  }
}

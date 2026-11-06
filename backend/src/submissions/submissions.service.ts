import { Injectable } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

const TYPES = ['contact', 'dealer'] as const;
const STATES = ['new', 'read', 'handled'] as const;

export class SubmissionListQuery extends PaginationQueryDto {
  @IsOptional() @IsIn(TYPES) type?: (typeof TYPES)[number];
  @IsOptional() @IsIn(STATES) status?: (typeof STATES)[number];
}

export class SubmissionStatusDto {
  @IsIn(STATES) status!: (typeof STATES)[number];
}

const text = (payload: unknown, key: string): string => {
  if (!payload || typeof payload !== 'object') return '';
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
};

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private toAdmin(row: { id: string; type: string; reference: string; status: string; emailSent: boolean; emailError: string | null; createdAt: Date; payload: Prisma.JsonValue }) {
    return {
      id: row.id, type: row.type, reference: row.reference, status: row.status, emailSent: row.emailSent, emailError: row.emailError, createdAt: row.createdAt.toISOString(),
      name: text(row.payload, 'name'), email: text(row.payload, 'email'), phone: text(row.payload, 'phone'),
      city: text(row.payload, 'city') || null, firmName: text(row.payload, 'firmName') || null, message: text(row.payload, 'message'),
    };
  }

  async list(query: SubmissionListQuery) {
    const where: Prisma.SubmissionWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.submission.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.submission.count({ where }),
    ]);
    return paginate(rows.map((row) => this.toAdmin(row)), total, query);
  }

  async update(id: string, dto: SubmissionStatusDto, actorId: string) {
    const existing = await this.prisma.submission.findUnique({ where: { id } });
    if (!existing) throw new ApiException('NOT_FOUND', 'Submission not found');
    const row = await this.prisma.submission.update({ where: { id }, data: { status: dto.status } });
    await this.audit.record({ actorId, action: 'status_change', entityType: 'submission', entityId: id, metadata: { status: dto.status } });
    return { data: this.toAdmin(row) };
  }
}

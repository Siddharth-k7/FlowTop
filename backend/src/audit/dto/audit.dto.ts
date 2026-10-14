import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination';
import { AUDIT_ACTIONS } from '../audit-entry';
import type { AuditAction } from '../audit-entry';

/** A full timestamp with its offset, e.g. 2026-10-14T00:00:00+05:30. No bare dates: "which midnight?" is ambiguous. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;
const INSTANT_MESSAGE = 'Use a full timestamp with its time zone, for example 2026-10-14T00:00:00+05:30';

export class ListAuditQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only actions by this user' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction;

  @ApiPropertyOptional({ example: 'product' })
  @IsOptional()
  @Matches(/^[a-z_]{1,64}$/, { message: 'entityType is a lowercase table name, such as product' })
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  entityId?: string;

  @ApiPropertyOptional({ description: 'From this instant, inclusive', example: '2026-10-14T00:00:00+05:30' })
  @IsOptional()
  @Matches(INSTANT, { message: INSTANT_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ description: 'Up to this instant, exclusive', example: '2026-10-15T00:00:00+05:30' })
  @IsOptional()
  @Matches(INSTANT, { message: INSTANT_MESSAGE })
  to?: string;
}

/** One audit row, readable on its own: the actor comes with a name and email. */
export interface AuditEventResponse {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  /** Null for system actions, such as a payment webhook. */
  actor: { id: string; name: string; email: string } | null;
}

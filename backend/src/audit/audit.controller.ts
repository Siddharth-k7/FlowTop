import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, PermissionGuard, RequirePermission } from '../auth';
import type { Paginated } from '../common/dto/pagination';
import { AuditService } from './audit.service';
import { ListAuditQuery } from './dto/audit.dto';
import type { AuditEventResponse } from './dto/audit.dto';

/**
 * Read only. audit:read belongs to super_admin alone. There is no route that
 * creates, edits or deletes audit rows: they are written as a side effect of
 * the actions they record, and the database refuses any update or delete.
 */
@ApiTags('audit')
@Controller('admin/audit')
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('audit:read')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: ListAuditQuery): Promise<Paginated<AuditEventResponse>> {
    return this.audit.list(query);
  }
}

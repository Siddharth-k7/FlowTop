import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { SubmissionListQuery, SubmissionStatusDto, SubmissionsService } from './submissions.service';

@Controller('admin/submissions')
@UseGuards(AuthGuard, PermissionGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  @RequirePermission('submission:read')
  list(@Query() query: SubmissionListQuery) { return this.submissions.list(query); }

  @Patch(':id')
  @RequirePermission('submission:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SubmissionStatusDto, @CurrentUser() user: AuthUser) { return this.submissions.update(id, dto, user.id); }
}

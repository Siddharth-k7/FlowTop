import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { JournalListQuery, JournalService, WriteJournalDto } from './journal.service';

@Controller('admin/journal')
@UseGuards(AuthGuard, PermissionGuard)
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Get()
  @RequirePermission('journal:read')
  list(@Query() query: JournalListQuery) { return this.journal.list(query); }

  @Post()
  @RequirePermission('journal:write')
  create(@Body() dto: WriteJournalDto, @CurrentUser() user: AuthUser) { return this.journal.create(dto, user.id); }

  @Get(':id')
  @RequirePermission('journal:read')
  find(@Param('id', ParseUUIDPipe) id: string) { return this.journal.find(id); }

  @Patch(':id')
  @RequirePermission('journal:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WriteJournalDto, @CurrentUser() user: AuthUser) { return this.journal.update(id, dto, user.id); }

  @Post(':id/publish')
  @RequirePermission('journal:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.journal.publish(id, user.id); }
}

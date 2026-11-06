import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { CreatePageDto, CreateSectionDto, PageListQuery, ReorderIdsDto, UpdateSectionDto, WritePageDto } from './dto/page.dto';
import { PagesService } from './pages.service';

@Controller()
@UseGuards(AuthGuard, PermissionGuard)
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get('admin/pages')
  @RequirePermission('page:read')
  list(@Query() query: PageListQuery) { return this.pages.list(query); }

  @Post('admin/pages')
  @RequirePermission('page:write')
  create(@Body() dto: CreatePageDto, @CurrentUser() user: AuthUser) { return this.pages.create(dto, user.id); }

  @Get('admin/pages/:id')
  @RequirePermission('page:read')
  find(@Param('id', ParseUUIDPipe) id: string) { return this.pages.find(id); }

  @Patch('admin/pages/:id')
  @RequirePermission('page:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WritePageDto, @CurrentUser() user: AuthUser) { return this.pages.update(id, dto, user.id); }

  @Post('admin/pages/:id/publish')
  @RequirePermission('page:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.pages.publish(id, user.id); }

  @Post('admin/pages/:id/sections')
  @RequirePermission('section:write')
  add(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateSectionDto, @CurrentUser() user: AuthUser) { return this.pages.addSection(id, dto, user.id); }

  @Post('admin/pages/:id/sections/reorder')
  @RequirePermission('section:write')
  reorder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderIdsDto, @CurrentUser() user: AuthUser) { return this.pages.reorder(id, dto.ids, user.id); }

  @Patch('admin/sections/:id')
  @RequirePermission('section:write')
  updateSection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSectionDto, @CurrentUser() user: AuthUser) { return this.pages.updateSection(id, dto, user.id); }

  @Delete('admin/sections/:id')
  @RequirePermission('section:write')
  removeSection(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.pages.removeSection(id, user.id); }

  @Post('admin/sections/:id/duplicate')
  @RequirePermission('section:write')
  duplicate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.pages.duplicateSection(id, user.id); }
}

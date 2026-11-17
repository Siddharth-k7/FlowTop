import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, ReorderDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('admin/categories')
@UseGuards(AuthGuard, PermissionGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermission('category:read')
  list() { return this.categories.list(); }

  @Post()
  @RequirePermission('category:write')
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthUser) { return this.categories.create(dto, user.id); }

  @Post('reorder')
  @RequirePermission('category:write')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser) { return this.categories.reorder(dto.ids, user.id); }

  @Patch(':id')
  @RequirePermission('category:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: AuthUser) { return this.categories.update(id, dto, user.id); }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('category:write')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.categories.remove(id, user.id); }
}

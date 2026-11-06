import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { ReorderIdsDto, WriteVariantDto } from './dto/variant.dto';
import { ReplaceSpecificationsDto } from './dto/specification.dto';
import { SpecificationsService } from './specifications.service';
import { VariantsService } from './variants.service';

@Controller()
@UseGuards(AuthGuard, PermissionGuard)
export class VariantsController {
  constructor(private readonly variants: VariantsService, private readonly specifications: SpecificationsService) {}

  @Get('admin/products/:id/variants')
  @RequirePermission('product:read')
  list(@Param('id', ParseUUIDPipe) id: string) { return this.variants.list(id); }

  @Post('admin/products/:id/variants')
  @RequirePermission('product:update')
  create(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WriteVariantDto, @CurrentUser() user: AuthUser) { return this.variants.create(id, dto, user.id); }

  @Post('admin/products/:id/variants/reorder')
  @RequirePermission('product:update')
  reorder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderIdsDto, @CurrentUser() user: AuthUser) { return this.variants.reorder(id, dto.ids, user.id); }

  @Patch('admin/variants/:id')
  @RequirePermission('product:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WriteVariantDto, @CurrentUser() user: AuthUser) { return this.variants.update(id, dto, user.id); }

  @Delete('admin/variants/:id')
  @RequirePermission('product:update')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.variants.remove(id, user.id); }

  @Get('admin/products/:id/specifications')
  @RequirePermission('product:read')
  specs(@Param('id', ParseUUIDPipe) id: string) { return this.specifications.list(id); }

  @Put('admin/products/:id/specifications')
  @RequirePermission('product:update')
  replaceSpecs(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceSpecificationsDto, @CurrentUser() user: AuthUser) { return this.specifications.replace(id, dto, user.id); }
}

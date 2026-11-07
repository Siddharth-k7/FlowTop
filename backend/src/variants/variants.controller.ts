import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ReorderVariantsDto } from './dto/reorder-variants.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantsService } from './variants.service';

@Controller()
@UseGuards(AuthGuard, PermissionGuard)
export class VariantsController {
  constructor(private readonly variants: VariantsService) {}
  @Get('admin/products/:id/variants') @RequirePermission('product:read') list(@Param('id', ParseUUIDPipe) id: string) { return this.variants.list(id); }
  @Post('admin/products/:id/variants') @RequirePermission('product:update') create(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateVariantDto, @CurrentUser() user: AuthUser) { return this.variants.create(id, dto, user.id); }
  @Post('admin/products/:id/variants/reorder') @RequirePermission('product:update') reorder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderVariantsDto, @CurrentUser() user: AuthUser) { return this.variants.reorder(id, dto.ids, user.id); }
  @Patch('admin/variants/:id') @RequirePermission('product:update') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVariantDto, @CurrentUser() user: AuthUser) { return this.variants.update(id, dto, user.id); }
  @Delete('admin/variants/:id') @RequirePermission('product:update') remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.variants.remove(id, user.id); }
}

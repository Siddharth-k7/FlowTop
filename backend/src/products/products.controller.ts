import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { BulkProductDto } from './dto/bulk-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('admin/products')
@UseGuards(AuthGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission('product:read')
  list(@Query() query: ProductListQueryDto) { return this.products.list(query); }

  @Post()
  @RequirePermission('product:create')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) { return this.products.create(dto, user.id); }

  @Get(':id')
  @RequirePermission('product:read')
  find(@Param('id', ParseUUIDPipe) id: string) { return this.products.find(id); }

  @Patch(':id')
  @RequirePermission('product:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthUser) { return this.products.update(id, dto, user.id); }

  @Post(':id/publish')
  @RequirePermission('product:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.products.transition(id, 'published', user.id); }

  @Post(':id/unpublish')
  @RequirePermission('product:publish')
  unpublish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.products.transition(id, 'unpublished', user.id); }

  @Post(':id/archive')
  @RequirePermission('product:archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.products.transition(id, 'archived', user.id); }

  @Post('bulk')
  @RequirePermission('product:update')
  bulk(@Body() dto: BulkProductDto, @CurrentUser() user: AuthUser) { return this.products.bulk(dto, user.id); }
}

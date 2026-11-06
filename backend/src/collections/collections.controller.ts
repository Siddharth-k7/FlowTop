import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { CollectionsService } from './collections.service';
import { CollectionListQuery, CollectionProductsDto, CreateCollectionDto, WriteCollectionDto } from './dto/collection.dto';

@Controller('admin/collections')
@UseGuards(AuthGuard, PermissionGuard)
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @RequirePermission('collection:read')
  list(@Query() query: CollectionListQuery) { return this.collections.list(query); }

  @Post()
  @RequirePermission('collection:write')
  create(@Body() dto: CreateCollectionDto, @CurrentUser() user: AuthUser) { return this.collections.create(dto, user.id); }

  @Get(':id')
  @RequirePermission('collection:read')
  find(@Param('id', ParseUUIDPipe) id: string) { return this.collections.find(id); }

  @Patch(':id')
  @RequirePermission('collection:write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WriteCollectionDto, @CurrentUser() user: AuthUser) { return this.collections.update(id, dto, user.id); }

  @Put(':id/products')
  @RequirePermission('collection:write')
  products(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CollectionProductsDto, @CurrentUser() user: AuthUser) { return this.collections.replaceProducts(id, dto, user.id); }
}

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { CreatePlacementDto, ReorderPlacementsDto, UpdatePlacementDto } from './dto/placement.dto';
import { PlacementsService } from './placements.service';

@Controller()
@UseGuards(AuthGuard, PermissionGuard)
export class PlacementsController {
  constructor(private readonly placements: PlacementsService) {}

  @Get('admin/placement-locations')
  @RequirePermission('placement:manage')
  locations() { return this.placements.locations(); }

  @Get('admin/products/:id/placements')
  @RequirePermission('product:read')
  list(@Param('id', ParseUUIDPipe) id: string) { return this.placements.list(id); }

  @Post('admin/products/:id/placements')
  @RequirePermission('placement:manage')
  create(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreatePlacementDto, @CurrentUser() user: AuthUser) {
    return this.placements.create(id, dto.locationType, dto.locationId, user.id);
  }

  @Patch('admin/placements/:id')
  @RequirePermission('placement:manage')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlacementDto, @CurrentUser() user: AuthUser) {
    return this.placements.update(id, dto.enabled, user.id);
  }

  @Delete('admin/placements/:id')
  @RequirePermission('placement:manage')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { return this.placements.remove(id, user.id); }

  @Post('admin/placements/reorder')
  @RequirePermission('placement:manage')
  reorder(@Body() dto: ReorderPlacementsDto, @CurrentUser() user: AuthUser) {
    return this.placements.reorder(dto.locationType, dto.locationId, dto.ids, user.id);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { ReplaceSpecificationsDto } from './dto/specification.dto';
import { SpecificationsService } from './specifications.service';

@Controller('admin/products/:id/specifications')
@UseGuards(AuthGuard, PermissionGuard)
export class SpecificationsController {
  constructor(private readonly specifications: SpecificationsService) {}
  @Get() @RequirePermission('product:read') list(@Param('id', ParseUUIDPipe) id: string) { return this.specifications.list(id); }
  @Put() @RequirePermission('product:update') replace(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceSpecificationsDto, @CurrentUser() user: AuthUser) { return this.specifications.replace(id, dto, user.id); }
}

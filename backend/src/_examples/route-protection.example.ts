import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';

// DEV B: placeholder. Your real DTO lists every field the admin may change.
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

@Controller('admin/products')
export class ProductsAdminController {
  @Patch(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): { data: { id: string; changes: UpdateProductDto; updatedBy: string } } {
    // DEV B: call your service here. The route above is already fully protected.
    return { data: { id, changes: dto, updatedBy: user.id } };
  }
}

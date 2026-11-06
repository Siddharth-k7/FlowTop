import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { NavigationService, ReplaceNavigationDto } from './navigation.service';

@Controller('admin/navigation')
@UseGuards(AuthGuard, PermissionGuard)
export class NavigationController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  @RequirePermission('navigation:read')
  get() { return this.navigation.get(); }

  @Put()
  @RequirePermission('navigation:write')
  replace(@Body() dto: ReplaceNavigationDto, @CurrentUser() user: AuthUser) { return this.navigation.replace(dto, user.id); }
}

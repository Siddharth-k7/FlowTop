import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import type { Paginated } from '../common/dto/pagination';
import { ChangeRoleDto, InviteUserDto, ListUsersQuery } from './dto/users.dto';
import type { UserSummary } from './dto/users.dto';
import { UsersService } from './users.service';

/**
 * Admin user management. user:read and user:manage belong to super_admin
 * only. There is deliberately no registration route: accounts exist only by
 * invitation.
 */
@ApiTags('users')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('user:read')
  list(@Query() query: ListUsersQuery): Promise<Paginated<UserSummary>> {
    return this.users.list(query);
  }

  @Post('invite')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('user:manage')
  async invite(
    @Body() dto: InviteUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<{ data: { user: UserSummary; inviteSent: boolean } }> {
    return { data: await this.users.invite(actor, dto) };
  }

  /**
   * Record-level access, not a route permission: any signed-in user may read
   * their own account, and only user:read may read someone else's.
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() viewer: AuthUser): Promise<{ data: UserSummary }> {
    return { data: await this.users.get(viewer, id) };
  }

  @Post(':id/role')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('user:manage')
  @HttpCode(HttpStatus.OK)
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<{ data: UserSummary }> {
    return { data: await this.users.changeRole(actor, id, dto.role) };
  }

  @Post(':id/deactivate')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('user:manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser): Promise<{ data: UserSummary }> {
    return { data: await this.users.deactivate(actor, id) };
  }
}

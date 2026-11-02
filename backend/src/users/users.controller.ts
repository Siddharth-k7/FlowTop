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
   * Permission at the route, scope at the object. user:read_self (every role)
   * lets a user through the door; UsersService.get then lets them see only
   * their own account unless they also hold user:read. This is the reference
   * for requireRecordAccess in backend/AGENTS.md.
   */
  @Get(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('user:read_self')
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

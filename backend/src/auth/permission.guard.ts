import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../common/errors/api.exception';
import { AuthenticatedRequest } from './auth-user';
import { Permission } from './permissions';
import { REQUIRED_PERMISSIONS_KEY } from './require-permission.decorator';

const FORBIDDEN_MESSAGE = 'You do not have permission to do this.';

/**
 * Rejects a signed-in user who lacks the route's permission with 403 FORBIDDEN.
 * Always runs after AuthGuard, which loads the user's permissions fresh from
 * the database on every request, so a role change takes effect at once.
 *
 * Fails closed: a route with PermissionGuard but no @RequirePermission is
 * refused for everyone, and logged, rather than left open.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!required?.length) {
      this.logger.error(`PermissionGuard on ${request.method} ${request.path} without @RequirePermission; refusing`);
      throw new ApiException('FORBIDDEN', FORBIDDEN_MESSAGE);
    }
    if (!request.user) {
      // AuthGuard must come first: @UseGuards(AuthGuard, PermissionGuard).
      throw new ApiException('UNAUTHENTICATED', 'Please sign in to continue.');
    }

    const granted = new Set(request.user.permissions);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ApiException('FORBIDDEN', FORBIDDEN_MESSAGE);
    }
    return true;
  }
}

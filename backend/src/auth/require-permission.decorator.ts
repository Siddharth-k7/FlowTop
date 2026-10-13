import { SetMetadata } from '@nestjs/common';
import { Permission } from './permissions';

export const REQUIRED_PERMISSIONS_KEY = 'flowtop:requiredPermissions';

/**
 * The permissions a route needs. Read by PermissionGuard. With several, the
 * user needs all of them. Works on a handler or on a whole controller.
 *
 *   @UseGuards(AuthGuard, PermissionGuard)
 *   @RequirePermission('product:update')
 */
export const RequirePermission = (...permissions: [Permission, ...Permission[]]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

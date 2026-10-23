import { ALL_PERMISSIONS, ROLE_PERMISSIONS, ROLES, type Permission as BackendPermission } from './permissions';
import type { Permission as SharedPermission, ROLE_PERMISSIONS as SharedRolePermissions } from '../../../shared/types/src/index';

/**
 * shared/types is type-only, so the role grants cannot be imported as a value.
 * This mirror is locked to that type (`satisfies` plus Equal). The assertions
 * then compare it to permissions.ts, which is the source of truth.
 * Tests may import shared/: they are not part of the backend Docker image.
 */
const SHARED_ROLE_PERMISSIONS = {
  super_admin: [
    'product:read',
    'product:create',
    'product:update',
    'product:publish',
    'product:archive',
    'category:read',
    'category:write',
    'collection:read',
    'collection:write',
    'placement:manage',
    'page:read',
    'page:write',
    'page:publish',
    'section:write',
    'navigation:read',
    'navigation:write',
    'journal:read',
    'journal:write',
    'journal:publish',
    'media:read',
    'media:write',
    'media:delete',
    'order:read',
    'order:status_change',
    'order:export',
    'submission:read',
    'submission:update',
    'submission:export',
    'settings:read',
    'settings:write',
    'user:read',
    'user:read_self',
    'user:manage',
    'audit:read',
    'analytics:read',
  ],
  marketing_admin: [
    'page:read',
    'page:write',
    'page:publish',
    'section:write',
    'navigation:read',
    'navigation:write',
    'journal:read',
    'journal:write',
    'journal:publish',
    'media:read',
    'media:write',
    'media:delete',
    'product:read',
    'category:read',
    'collection:read',
    'analytics:read',
    'user:read_self',
  ],
  product_manager: [
    'product:read',
    'product:create',
    'product:update',
    'product:publish',
    'product:archive',
    'category:read',
    'category:write',
    'collection:read',
    'collection:write',
    'placement:manage',
    'page:read',
    'media:read',
    'media:write',
    'analytics:read',
    'user:read_self',
  ],
} as const satisfies SharedRolePermissions;

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type _sharedMatchesMirror = Expect<Equal<typeof SHARED_ROLE_PERMISSIONS, SharedRolePermissions>>;
type _permissionUnionsMatch = Expect<Equal<SharedPermission, BackendPermission>>;
type _superAdminIsEveryPermission = Expect<Equal<(typeof SHARED_ROLE_PERMISSIONS.super_admin)[number], SharedPermission>>;

const typeChecks: [_sharedMatchesMirror, _permissionUnionsMatch, _superAdminIsEveryPermission] = [true, true, true];

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe('shared/types permission drift', () => {
  it('typechecks the shared unions against permissions.ts', () => {
    expect(typeChecks).toEqual([true, true, true]);
  });

  it('matches the permission keys in permissions.ts in both directions', () => {
    expect(sorted(SHARED_ROLE_PERMISSIONS.super_admin)).toEqual(sorted(ALL_PERMISSIONS));
  });

  it('matches ROLE_PERMISSIONS for every role', () => {
    for (const role of ROLES) {
      expect(sorted(ROLE_PERMISSIONS[role])).toEqual(sorted(SHARED_ROLE_PERMISSIONS[role]));
    }
  });
});

import type { RoleName, ROLE_PERMISSIONS } from '@flowtop/types';

/**
 * The role grants as a runtime value, for mock mode only.
 *
 * @flowtop/types ships ROLE_PERMISSIONS as a type (no runtime code), so this
 * object is annotated with it. Each role is an exact readonly tuple: a missing,
 * extra, misspelt or reordered permission is a compile error, so the mocks
 * cannot invent a permission the backend does not have (the product:write bug).
 * backend/src/auth/shared-types.drift.spec.ts ties the type to the backend.
 */
export const ROLE_GRANTS: ROLE_PERMISSIONS = {
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
};

export const permissionsFor = (role: RoleName) => [...ROLE_GRANTS[role]];

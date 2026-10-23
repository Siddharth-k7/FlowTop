/**
 * Type declarations shared by the frontend and the admin.
 *
 * No values, no imports, no dependencies. Everything here is erased at compile
 * time, so importing it cannot pull runtime code into a bundle.
 *
 * backend/src must not import this folder. The API image is built with
 * backend/ as the Docker context, so shared/ does not exist during that build.
 * The copies in backend/src are the source of truth. A backend test compares
 * these types to those copies and fails when they drift.
 *
 * ROLE_PERMISSIONS is a type, not a const. A const would be runtime code.
 * Each role maps to a readonly tuple so an exact grant list can be checked.
 */

export type Permission =
  | 'product:read'
  | 'product:create'
  | 'product:update'
  | 'product:publish'
  | 'product:archive'
  | 'category:read'
  | 'category:write'
  | 'collection:read'
  | 'collection:write'
  | 'placement:manage'
  | 'page:read'
  | 'page:write'
  | 'page:publish'
  | 'section:write'
  | 'navigation:read'
  | 'navigation:write'
  | 'journal:read'
  | 'journal:write'
  | 'journal:publish'
  | 'media:read'
  | 'media:write'
  | 'media:delete'
  | 'order:read'
  | 'order:status_change'
  | 'order:export'
  | 'submission:read'
  | 'submission:update'
  | 'submission:export'
  | 'settings:read'
  | 'settings:write'
  | 'user:read'
  | 'user:read_self'
  | 'user:manage'
  | 'audit:read'
  | 'analytics:read';

/** The three roles that ship in v1. */
export type RoleName = 'super_admin' | 'marketing_admin' | 'product_manager';

/** Which role holds which permissions. Type-level only: there is no runtime object. */
export type ROLE_PERMISSIONS = {
  readonly super_admin: readonly [
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
  ];
  readonly marketing_admin: readonly [
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
  ];
  readonly product_manager: readonly [
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
  ];
};

/**
 * The user object returned by GET /auth/me, and by login when no second
 * factor is pending. `permissions` is for showing and hiding UI. The server
 * checks again on every call. `role` is null only when no role is assigned.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName | null;
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaSetupRequired: boolean;
}

/** One media library file, as the admin media endpoints return it. */
export interface MediaAsset {
  id: string;
  /** Cleaned original upload name, for display. Not the last segment of `url`. */
  filename: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  /** ISO 8601 UTC. */
  createdAt: string;
  variants: {
    thumb?: string;
    medium?: string;
    large?: string;
  };
}

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'MFA_SETUP_REQUIRED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** The error body on every failed response. `fields` is present only for field errors. */
export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}

/** The list envelope. `page` starts at 1. */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

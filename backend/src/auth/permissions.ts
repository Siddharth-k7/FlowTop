/**
 * Every permission in the system. The only place permission strings are defined.
 *
 * Format: resource:action. Use the Permission type, never a bare string, so a
 * typo is a compile error instead of a route nobody can reach.
 *
 * Derived from the endpoints in docs/03-api-contract.md. Adding or renaming one
 * is a change to the contract: open a PR all four review.
 * The seed (prisma/seed.ts) writes this list and the role mapping to the database.
 */
export const PERMISSION_DEFINITIONS = [
  // Products, variants, specifications (Dev B)
  { key: 'product:read', description: 'View products, variants and specifications in the admin' },
  { key: 'product:create', description: 'Create products' },
  { key: 'product:update', description: 'Edit products, their variants and specifications' },
  { key: 'product:publish', description: 'Publish and unpublish products, including in bulk' },
  { key: 'product:archive', description: 'Archive products' },

  // Taxonomy and placement (Dev B)
  { key: 'category:read', description: 'View categories in the admin' },
  { key: 'category:write', description: 'Create, edit, reorder and delete categories' },
  { key: 'collection:read', description: 'View collections in the admin' },
  { key: 'collection:write', description: 'Create and edit collections and their ranked products' },
  { key: 'placement:manage', description: 'Add, edit, reorder and remove product placements' },

  // Pages, sections, navigation, journal (Dev B)
  { key: 'page:read', description: 'View pages in the admin' },
  { key: 'page:write', description: 'Create and edit pages' },
  { key: 'page:publish', description: 'Publish pages' },
  { key: 'section:write', description: 'Add, edit, duplicate, reorder and delete page sections' },
  { key: 'navigation:read', description: 'View the header and footer navigation in the admin' },
  { key: 'navigation:write', description: 'Replace the header and footer navigation' },
  { key: 'journal:read', description: 'View journal articles in the admin' },
  { key: 'journal:write', description: 'Create and edit journal articles' },
  { key: 'journal:publish', description: 'Publish journal articles' },

  // Media (Dev A)
  { key: 'media:read', description: 'Browse the media library' },
  { key: 'media:write', description: 'Upload media and edit alt text' },
  { key: 'media:delete', description: 'Delete unreferenced media' },

  // Commerce and forms (Dev A)
  { key: 'order:read', description: 'View orders' },
  { key: 'order:status_change', description: 'Change an order status' },
  { key: 'order:export', description: 'Export orders as CSV' },
  { key: 'submission:read', description: 'View contact and dealer submissions' },
  { key: 'submission:update', description: 'Mark submissions read or handled' },
  { key: 'submission:export', description: 'Export submissions as CSV' },

  // Platform (Dev A)
  { key: 'settings:read', description: 'View email, sender and WhatsApp settings' },
  { key: 'settings:write', description: 'Change settings and send a test email' },
  { key: 'user:read', description: 'View admin users' },
  { key: 'user:read_self', description: 'View your own admin account' },
  { key: 'user:manage', description: 'Invite admins, change roles, deactivate' },
  { key: 'audit:read', description: 'View the audit log' },
  { key: 'analytics:read', description: 'View the dashboard figures' },
] as const satisfies readonly { key: `${string}:${string}`; description: string }[];

export type Permission = (typeof PERMISSION_DEFINITIONS)[number]['key'];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_DEFINITIONS.map(({ key }) => key);

/** The three roles that ship in v1. The role table supports all six from the SRS. */
export const ROLES = ['super_admin', 'marketing_admin', 'product_manager'] as const;
export type RoleName = (typeof ROLES)[number];

/** Who gets what, following the role table in docs/01-srs-summary.md. */
export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
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

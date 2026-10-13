import { Prisma } from '../generated/prisma/client';

/**
 * The verbs we audit. A closed list keeps the log filterable; add a verb here
 * (Dev A's file) rather than inventing one inline.
 */
export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'archive',
  'reorder',
  'status_change',
  'role_change',
  'settings_change',
  'invite',
  'deactivate',
  'export',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  /** The signed-in user. Null only for system actions, such as a payment webhook. */
  actorId: string | null;
  action: AuditAction;
  /** Singular, snake_case, matching the table: 'product', 'page', 'placement', 'setting'. */
  entityType: string;
  /** The row's id, or its key for keyed entities such as settings. */
  entityId: string;
  /** What changed, for a human reading the log. Never passwords, tokens or card data. */
  metadata?: Prisma.InputJsonObject;
}

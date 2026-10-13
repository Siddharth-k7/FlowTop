import { ApiException } from '../common/errors/api.exception';
import type { AuthUser } from './auth-user';
import type { Permission } from './permissions';

/**
 * Who may see or change one specific record. A route-level permission says a
 * user may read orders; this says which orders.
 */
export interface RecordAccessRule<T> {
  /** Holding any of these grants every record of this type. Leave out to allow nobody blanket access. */
  allWith?: readonly Permission[];
  /** Otherwise: is this record the user's own, or inside their scope? */
  ownedBy?: (user: AuthUser, record: T) => boolean;
}

const NOT_FOUND_MESSAGE = 'The requested record was not found.';

/**
 * Returns the record if the user may access it. Otherwise throws 404, exactly
 * as for a record that does not exist, so changing an id in the URL never
 * reveals whether someone else's record is there.
 *
 *   const order = requireRecordAccess(user, await this.repository.findById(id), {
 *     allWith: ['order:read'],
 *     ownedBy: (u, o) => o.assignedTo === u.id,
 *   });
 *
 * Fails closed: a rule with neither field allows nobody.
 */
export function requireRecordAccess<T>(user: AuthUser, record: T | null | undefined, rule: RecordAccessRule<T>): T {
  if (record === null || record === undefined || !canAccessRecord(user, record, rule)) {
    throw new ApiException('NOT_FOUND', NOT_FOUND_MESSAGE);
  }
  return record;
}

/** The same decision without throwing, for filtering or showing and hiding fields. */
export function canAccessRecord<T>(user: AuthUser, record: T, rule: RecordAccessRule<T>): boolean {
  const granted = new Set(user.permissions);
  if (rule.allWith?.some((permission) => granted.has(permission))) {
    return true;
  }
  return rule.ownedBy?.(user, record) ?? false;
}

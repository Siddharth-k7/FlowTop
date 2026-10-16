import { ALL_PERMISSIONS } from '../auth';
import type { Permission } from '../auth';

// Only names from the agreed list compile. 'product:edit' here would be a type error.
export const PRODUCT_EDITORS: readonly Permission[] = ['product:update', 'product:publish'];

// The same list at runtime, for example to check a value that arrives as a string.
export function isKnownPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

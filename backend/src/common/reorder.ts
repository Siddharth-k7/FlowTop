import { ApiException } from './errors/api.exception';

/**
 * Reorder may only set positions. The id list has to be exactly the parent's ids, once each.
 * An id that exists on another parent is 422. An id that does not exist is 404. Nothing is written
 * when this throws, so the caller must run it before the position updates.
 */
export function assertExactReorder(parentIds: readonly string[], requested: readonly string[], elsewhereIds: readonly string[]): void {
  if (new Set(requested).size !== requested.length) {
    throw new ApiException('VALIDATION_FAILED', 'Each item can appear only once.', { ids: 'Each item can appear only once.' });
  }
  const own = new Set(parentIds);
  const missing = requested.filter((id) => !own.has(id));
  if (missing.length > 0) {
    const elsewhere = new Set(elsewhereIds);
    if (missing.some((id) => elsewhere.has(id))) {
      throw new ApiException('VALIDATION_FAILED', 'Those items belong to another record.', { ids: 'Those items belong to another record.' });
    }
    throw new ApiException('NOT_FOUND', 'The requested record was not found.');
  }
  if (requested.length !== parentIds.length) {
    throw new ApiException('VALIDATION_FAILED', 'Send every item in this list, once each.', { ids: 'Send every item in this list, once each.' });
  }
}

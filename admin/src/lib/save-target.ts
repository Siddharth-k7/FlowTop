/**
 * Which request a save makes.
 * The first save of a new document posts. After that create has returned an id,
 * later saves patch it, including a retry that is still sitting on /new.
 */
export function saveTarget(isNew: boolean, persistedId: string | undefined, routeId: string): { method: 'POST' | 'PATCH'; pathId: string | undefined } {
  if (isNew && !persistedId) return { method: 'POST', pathId: undefined };
  return { method: 'PATCH', pathId: persistedId ?? routeId };
}

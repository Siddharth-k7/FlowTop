/** Drops a response that is not for the latest list request, then replaces or appends rows. */
export function settleListRequest<T extends { id: string }>(currentGeneration: number, responseGeneration: number, prev: T[] | undefined, data: T[], page: number): T[] | undefined {
  if (currentGeneration !== responseGeneration) return prev;
  if (page === 1) return data;
  return [...(prev ?? []).filter((row) => !data.some((next) => next.id === row.id)), ...data];
}

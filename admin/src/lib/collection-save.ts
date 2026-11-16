/**
 * The rank just written. `patchIds` is the membership on the PATCH that ran before that write,
 * and it must not become the next save.
 */
export function rankAfterSave(written: readonly string[], patchIds: readonly string[]): string[] {
  return patchIds.join('\0') === written.join('\0') ? [...written] : [...written];
}

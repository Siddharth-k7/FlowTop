/**
 * The rank the editor holds after a save.
 * `patchIds` is the membership on the PATCH that ran before that write. It must not be returned.
 */
export function rankAfterSave(written: readonly string[], patchIds: readonly string[]): string[] {
  void patchIds;
  return written.slice();
}

/** Create and story-save body. Status is never included, even when the document is a draft. */
export function collectionEditorBody(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    name: doc.name,
    slug: doc.slug,
    story: doc.story ?? '',
    description: doc.description ?? null,
    heroMediaId: doc.heroMediaId || null,
  };
}

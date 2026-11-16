const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SectionDraft {
  id: string;
  type: string;
  config: Record<string, unknown>;
  visible: boolean;
}

export interface SectionSyncApi<T extends { sections: { id: string }[] }> {
  getPage(id: string): Promise<T>;
  create(pageId: string, section: SectionDraft): Promise<{ id: string }>;
  update(id: string, section: SectionDraft): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(pageId: string, ids: string[]): Promise<void>;
}

/**
 * Writes the editor's section list, then returns a fresh GET.
 * The PATCH that saved the page title is not the section list: it was read before these writes.
 */
export async function syncPageSections<T extends { sections: { id: string }[] }>(pageId: string, local: SectionDraft[], client: SectionSyncApi<T>): Promise<T> {
  const current = await client.getPage(pageId);
  const remote = current.sections;
  for (const gone of remote) {
    if (!local.some((section) => section.id === gone.id)) await client.remove(gone.id);
  }
  const ids: string[] = [];
  for (const section of local) {
    const known = UUID.test(section.id) && remote.some((item) => item.id === section.id);
    if (known) {
      await client.update(section.id, section);
      ids.push(section.id);
    } else {
      ids.push((await client.create(pageId, section)).id);
    }
  }
  if (ids.length) await client.reorder(pageId, ids);
  return client.getPage(pageId);
}

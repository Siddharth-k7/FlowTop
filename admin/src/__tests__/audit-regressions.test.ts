import { describe, expect, it } from 'vitest';
import { rankAfterSave } from '@/lib/collection-save';
import { capturePublish } from '@/lib/capture-publish';
import { settleListRequest } from '@/lib/list-state';
import { orderExportPath } from '@/lib/order-export';
import { syncPageSections, type SectionDraft, type SectionSyncApi } from '@/lib/section-sync';

describe('audit regressions in the admin editors', () => {
  it('keeps the rank that was written instead of the PATCH body from before that write', () => {
    const written = ['first', 'second'];
    const patchIds = ['second', 'first'];
    const next = rankAfterSave(written, patchIds);
    expect(next).toEqual(written);
    expect(next).not.toEqual(patchIds);
    expect(rankAfterSave(written, written)).toEqual(written);
  });

  it('reloads sections after sync, so a section created on the first save is still there for the second', async () => {
    const store = new Map<string, SectionDraft>([['A', { id: 'A', type: 'hero', config: { headline: 'A' }, visible: true }]]);
    let gets = 0;
    const client: SectionSyncApi<{ id: string; sections: { id: string }[] }> = {
      getPage: async () => {
        gets += 1;
        return { id: 'page', sections: [...store.values()].map((section) => ({ id: section.id })) };
      },
      create: async (_pageId, section) => {
        const id = 'B';
        store.set(id, { ...section, id });
        return { id };
      },
      update: async (id, section) => { store.set(id, { ...section, id }); },
      remove: async (id) => { store.delete(id); },
      reorder: async () => undefined,
    };
    const local: SectionDraft[] = [
      { id: 'A', type: 'hero', config: { headline: 'A' }, visible: true },
      { id: 'temp', type: 'cta', config: { heading: 'B' }, visible: true },
    ];
    const fresh = await syncPageSections('page', local, client);
    expect(fresh.sections.map((section) => section.id)).toEqual(['A', 'B']);
    expect(gets).toBe(2);
    expect([...store.keys()]).toEqual(['A', 'B']);
  });

  it('ignores a list response that is not the latest request', () => {
    const prev = [{ id: 'page-1' }];
    expect(settleListRequest(2, 1, prev, [{ id: 'stale-page-2' }], 2)).toBe(prev);
    expect(settleListRequest(2, 2, undefined, [{ id: 'fresh' }], 1)).toEqual([{ id: 'fresh' }]);
  });

  it('surfaces a publish rejection as a message', async () => {
    await expect(capturePublish(async () => { throw new Error('Already published'); })).resolves.toBe('Already published');
    await expect(capturePublish(async () => undefined)).resolves.toBeUndefined();
  });

  it('puts the list filters on the orders export', () => {
    expect(orderExportPath({ status: 'received', paymentStatus: '' }, '')).toBe('/admin/orders/export?status=received');
    expect(orderExportPath({}, '')).toBe('/admin/orders/export');
  });
});

'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { SortableList } from '@/components/ui/SortableList';
import { Skeleton } from '@/components/ui/EditorBar';
import { btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import type { Doc, Placement, PlacementLocation, Product } from '@/types/cms';

const TYPE_LABEL: Record<string, string> = { homepage_section: 'Homepage sections', category: 'Categories', collection: 'Collections', campaign_page: 'Campaign pages', related: 'Related' };

/**
 * Where this product is showcased. Each placement is its own record: removing one never touches
 * the product or any other placement. The wording below says so on purpose.
 */
export function PlacementPanel({ product }: { product: Product }) {
  const [items, setItems] = useState<Placement[]>();
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [rm, setRm] = useState<Placement>();
  const [prev, setPrev] = useState<Placement>();
  const load = useCallback(() => { api<Placement[]>(`/admin/products/${product.id}/placements`).then((r) => setItems(r.sort((a, b) => a.position - b.position))).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load placements.')); }, [product.id]);
  useEffect(load, [load]);

  const act = async (fn: () => Promise<unknown>) => { setError(undefined); try { await fn(); load(); } catch (e) { setError(e instanceof ApiError ? e.message : 'That did not work. Nothing was changed.'); } };
  const reorder = (loc: Placement, next: Placement[]) => {
    setItems((all) => [...(all ?? []).filter((p) => !(p.locationType === loc.locationType && p.locationId === loc.locationId)), ...next]);
    act(() => api('/admin/placements/reorder', { method: 'POST', body: { locationType: loc.locationType, locationId: loc.locationId, ids: next.map((p) => p.id) } }));
  };
  if (product.status === 'archived') return <div className={cardCls}><p className="text-sm">Archived products cannot be placed. Restore the product first.</p></div>;
  if (!items) return error ? <p role="alert" className="text-sm text-error">{error}</p> : <Skeleton rows={3} />;

  const groups = [...new Set(items.map((p) => `${p.locationType}:${p.locationId}`))];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-grey-700">Each place below is separate. Changing or removing one does not change the others, or the product itself.</p>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {items.length === 0 && <div className={cardCls}><p className="text-sm">This product is not showcased anywhere yet. Add it to the homepage, a category or a collection.</p></div>}
      {groups.map((g) => {
        const list = items.filter((p) => `${p.locationType}:${p.locationId}` === g);
        const head = list[0] as Placement;
        return (
          <section key={g} className={cardCls} aria-label={head.locationName}>
            <h3 className="mb-2 font-medium">{head.locationName}</h3>
            <SortableList items={list} getKey={(p) => p.id} onChange={(n) => reorder(head, n)} label="placement"
              render={(p) => (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded bg-purple-pale px-2 py-1">Position {p.position}</span>
                  <label className="flex min-h-touch items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={p.enabled} onChange={(e) => act(() => api(`/admin/placements/${p.id}`, { method: 'PATCH', body: { enabled: e.target.checked } }))} />Showing</label>
                  <button className="min-h-touch underline" onClick={() => setPrev(p)}>Preview</button>
                  <button className="min-h-touch text-error" onClick={() => setRm(p)}>Remove from here</button>
                </div>)} />
          </section>);
      })}
      <div><button className={btnSecondary} onClick={() => setAdding(true)}>Add a placement</button></div>
      <AddPlacement open={adding} onClose={() => setAdding(false)} taken={items} onAdd={(l) => { setAdding(false); act(() => api(`/admin/products/${product.id}/placements`, { method: 'POST', body: { locationType: l.locationType, locationId: l.locationId } })); }} />
      <ConfirmDialog open={!!rm} onClose={() => setRm(undefined)} title={`Remove from ${rm?.locationName}?`} confirmLabel="Remove from here"
        body={`This removes the product from ${rm?.locationName} only. The product itself, and its other placements, are not affected.`}
        onConfirm={() => { const p = rm; setRm(undefined); if (p) act(() => api(`/admin/placements/${p.id}`, { method: 'DELETE' })); }} />
      {prev && <PlacementPreview placement={prev} product={product} onClose={() => setPrev(undefined)} />}
    </div>
  );
}

function AddPlacement({ open, onClose, onAdd, taken }: { open: boolean; onClose: () => void; onAdd: (l: PlacementLocation) => void; taken: Placement[] }) {
  const [locs, setLocs] = useState<PlacementLocation[]>();
  const [q, setQ] = useState('');
  useEffect(() => { if (open) api<PlacementLocation[]>('/admin/placement-locations').then(setLocs).catch(() => setLocs([])); }, [open]);
  const shown = (locs ?? []).filter((l) => l.locationName.toLowerCase().includes(q.toLowerCase()) && !taken.some((t) => t.locationType === l.locationType && t.locationId === l.locationId));
  return (
    <Modal open={open} onClose={onClose} title="Where should this product appear?">
      <input type="search" className={inputCls} placeholder="Search places" aria-label="Search places" value={q} onChange={(e) => setQ(e.target.value)} />
      {!locs ? <Skeleton rows={3} /> : shown.length === 0 ? <p className="text-sm">No places match.</p> : (
        Object.entries(Object.groupBy(shown, (l) => l.locationType)).map(([t, ls]) => (
          <div key={t}><h3 className="mb-1 text-sm font-medium text-grey-700">{TYPE_LABEL[t] ?? t}</h3>
            <ul className="flex flex-col gap-1">{ls?.map((l) => <li key={l.locationId}><button className={`${btnSecondary} w-full justify-start`} onClick={() => onAdd(l)}>{l.locationName}</button></li>)}</ul></div>)))}
      <div className="flex justify-end"><button className={btnSecondary} onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}

/** Shows the product among its real neighbours at its real position. Device toggle resizes the frame. */
function PlacementPreview({ placement, product, onClose }: { placement: Placement; product: Product; onClose: () => void }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [all, setAll] = useState<Placement[]>();
  const [names, setNames] = useState<Record<string, Doc>>({});
  useEffect(() => {
    api<Doc[]>('/admin/products').then((ps) => setNames(Object.fromEntries(ps.map((p) => [p.id, p]))));
    // Neighbours: everything else placed in the same location (mock reads each product's placements).
    api<Doc[]>('/admin/products').then((ps) => Promise.all(ps.map((p) => api<Placement[]>(`/admin/products/${p.id}/placements`)))).then((r) =>
      setAll(r.flat().filter((p) => p.locationType === placement.locationType && p.locationId === placement.locationId && p.enabled).sort((a, b) => a.position - b.position)));
  }, [placement]);
  const width = { desktop: '100%', tablet: '768px', mobile: '360px' }[device];
  return (
    <Modal open onClose={onClose} title={`Preview: ${placement.locationName}`} wide>
      <div role="group" aria-label="Device" className="flex gap-2">
        {(['desktop', 'tablet', 'mobile'] as const).map((d) => <button key={d} className={btnSecondary} aria-pressed={device === d} onClick={() => setDevice(d)}>{d}</button>)}
      </div>
      <div className="overflow-x-auto rounded bg-grey-100 p-3">
        <div style={{ width, maxWidth: '100%' }} className="mx-auto rounded bg-white p-3">
          {!all ? <Skeleton rows={2} /> : (
            <ol className={`grid gap-3 ${device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'}`}>
              {all.map((p) => (
                <li key={p.id} className={`rounded border p-2 text-sm ${p.productId === product.id ? 'border-purple-deep bg-purple-pale' : 'border-grey-200'}`}>
                  <p className="text-xs text-grey-500">#{p.position}</p>
                  <p className="font-medium">{String(names[p.productId]?.name ?? '…')}</p>
                  {p.productId === product.id && <p className="text-xs text-purple-deep">This product</p>}
                </li>))}
            </ol>)}
        </div>
      </div>
      <p className="text-xs text-grey-500">Preview shows live positions. Unpublished products are hidden on the real site.</p>
      <div className="flex justify-end"><button className={btnSecondary} onClick={onClose}>Close</button></div>
    </Modal>
  );
}

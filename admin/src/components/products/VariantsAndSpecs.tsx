'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Specification, Variant } from '@flowtop/types';
import { api, ApiError } from '@/lib/api';
import { Skeleton } from '@/components/ui/EditorBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SortableList } from '@/components/ui/SortableList';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';

const small = `${inputCls} !min-h-0 py-2`;
const uid = () => `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const isNew = (id: string) => id.startsWith('new-');
const Lbl = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-sm">{t}{children}</label>;

/** A list that loads from the API, is edited locally and is saved by its own button. It never says "Saved" unless the API did. */
function useRemoteList<T>(path: string) {
  const [items, setItems] = useState<T[]>();
  const [base, setBase] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const load = useCallback(() => {
    setError(undefined);
    api<T[]>(path).then((r) => { setItems(r); setBase(JSON.stringify(r)); }).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load this.'));
  }, [path]);
  useEffect(load, [load]);
  const save = async (run: (items: T[], was: T[]) => Promise<unknown>) => {
    if (!items) return;
    setSaving(true); setError(undefined);
    try { await run(items, JSON.parse(base) as T[]); setSavedAt(new Date()); load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save. Your changes are still here.'); }
    finally { setSaving(false); }
  };
  const edit = (next: T[]) => { setItems(next); setSavedAt(undefined); };
  return { items, edit, error, saving, savedAt, save, dirty: !!items && JSON.stringify(items) !== base };
}

function SaveRow({ label, dirty, saving, savedAt, error, onSave, canSave }: { label: string; dirty: boolean; saving: boolean; savedAt?: Date; error?: string; onSave: () => void; canSave: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {canSave && <button type="button" className={btnPrimary} disabled={!dirty || saving} onClick={onSave}>{saving ? 'Saving…' : label}</button>}
      <p role="status" className="text-sm">{error ? <span className="text-error">{error}</span> : dirty ? <span className="text-warning">Unsaved changes</span> : savedAt ? <span className="text-success">Saved at {savedAt.toLocaleTimeString('en-IN')}</span> : null}</p>
    </div>
  );
}

/**
 * Finishes. `price` is the resolved variant price in paise; staff type rupees.
 * `canEdit` is cosmetic: hiding the buttons is presentation, the server enforces product:update.
 * TODO: docs/03-api-contract.md names the variant endpoints but not their request bodies. Dev B to confirm these.
 */
export function VariantsTab({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const l = useRemoteList<Variant>(`/admin/products/${productId}/variants`);
  const [rm, setRm] = useState<Variant>();
  if (!l.items) return l.error ? <p role="alert" className="text-sm text-error">{l.error}</p> : <Skeleton rows={3} />;
  const value = l.items;
  const set = (id: string, p: Partial<Variant>) => l.edit(value.map((v) => (v.id === id ? { ...v, ...p } : v)));
  const makeDefault = (id: string) => l.edit(value.map((v) => ({ ...v, isDefault: v.id === id })));
  const body = (v: Variant) => ({ name: v.name, skuSuffix: v.skuSuffix, price: v.price, swatchHex: v.swatchHex || null, isAvailable: v.isAvailable, isDefault: v.isDefault });
  const save = () => l.save(async (items, was) => {
    for (const gone of was.filter((w) => !items.some((v) => v.id === w.id))) await api(`/admin/variants/${gone.id}`, { method: 'DELETE' });
    const ids: string[] = [];
    for (const v of items) {
      if (isNew(v.id)) ids.push((await api<Variant>(`/admin/products/${productId}/variants`, { method: 'POST', body: body(v) })).id);
      else {
        ids.push(v.id);
        if (JSON.stringify(v) !== JSON.stringify(was.find((w) => w.id === v.id))) await api(`/admin/variants/${v.id}`, { method: 'PATCH', body: body(v) });
      }
    }
    if (ids.length > 1) await api(`/admin/products/${productId}/variants/reorder`, { method: 'POST', body: { ids } });
  });
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-grey-700">Finishes shoppers can choose between. {canEdit ? 'Drag to set the order they appear in. Finishes save on their own, with the button below.' : 'You can look but not change them.'}</p>
      {value.length === 0 && <div className={cardCls}><p className="text-sm">No finishes yet. A product without finishes is sold as one option.</p></div>}
      <fieldset disabled={!canEdit} className="contents">
        <SortableList items={value} getKey={(v) => v.id} onChange={l.edit} label="finish"
          render={(v) => (
            <div className="grid gap-3 md:grid-cols-3">
              <Lbl t="Finish name"><input className={small} value={v.name} onChange={(e) => set(v.id, { name: e.target.value })} /></Lbl>
              <Lbl t="SKU ending"><input className={small} value={v.skuSuffix} onChange={(e) => set(v.id, { skuSuffix: e.target.value })} /></Lbl>
              <Lbl t="Price (₹)"><input type="number" min={0} className={small} value={v.price / 100} onChange={(e) => set(v.id, { price: Math.round(Number(e.target.value) * 100) })} /></Lbl>
              <Lbl t="Swatch colour code"><input className={small} value={v.swatchHex ?? ''} placeholder="#1A1A1A" pattern="#[0-9A-Fa-f]{6}" onChange={(e) => set(v.id, { swatchHex: e.target.value })} /></Lbl>
              <label className="flex min-h-touch items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.isAvailable} onChange={(e) => set(v.id, { isAvailable: e.target.checked })} />In stock</label>
              <label className="flex min-h-touch items-center gap-2 text-sm"><input type="radio" name="default-finish" className="h-5 w-5" checked={v.isDefault} onChange={() => makeDefault(v.id)} />Show first</label>
              {canEdit && <button type="button" className="min-h-touch text-left text-sm text-error" onClick={() => setRm(v)}>Remove finish</button>}
            </div>)} />
      </fieldset>
      {canEdit && <div><button type="button" className={btnSecondary} onClick={() => l.edit([...value, { id: uid(), name: '', skuSuffix: '', price: 0, swatchHex: null, image: null, isAvailable: true, isDefault: value.length === 0 }])}>Add a finish</button></div>}
      <SaveRow label="Save finishes" canSave={canEdit} dirty={l.dirty} saving={l.saving} savedAt={l.savedAt} error={l.error} onSave={save} />
      <ConfirmDialog open={!!rm} onClose={() => setRm(undefined)} title={`Remove ${rm?.name || 'this finish'}?`} confirmLabel="Remove finish"
        body="This removes the finish from this product when you save. The product and its other finishes are not affected. Existing orders keep their own copy of what was bought."
        onConfirm={() => { l.edit(value.filter((v) => v.id !== rm?.id)); setRm(undefined); }} />
    </div>
  );
}

const COMMON: [string, string, string][] = [['Material', 'Technical', ''], ['Flow Rate', 'Technical', 'LPM'], ['Spout Reach', 'Dimensions', 'mm'], ['Height', 'Dimensions', 'mm'], ['Weight', 'Dimensions', 'kg'], ['Warranty', 'General', 'years'], ['Water Pressure', 'Technical', 'bar']];

/**
 * Any field, any name: adding "Spout Reach" needs no developer. The whole ordered list is replaced on save.
 * `canEdit` is cosmetic: the server enforces product:update.
 * TODO: docs/03-api-contract.md says PUT replaces the list but not the body shape. `{ items }` follows PUT /admin/collections/:id/products.
 */
export function SpecsTab({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const l = useRemoteList<Specification>(`/admin/products/${productId}/specifications`);
  if (!l.items) return l.error ? <p role="alert" className="text-sm text-error">{l.error}</p> : <Skeleton rows={3} />;
  const value = l.items;
  const set = (id: string, p: Partial<Specification>) => l.edit(value.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const add = (name = '', group = 'Technical', unit = '') => l.edit([...value, { id: uid(), group, name, value: '', unit: unit || null, type: 'text', position: value.length + 1 }]);
  const save = () => l.save((items) => api(`/admin/products/${productId}/specifications`, { method: 'PUT', body: { items: items.map((s, i) => ({ group: s.group || null, name: s.name, value: s.value, unit: s.unit || null, type: s.type, position: i + 1 })) } }));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-grey-700">Anything shoppers compare on. A specification needs a value; one without is refused. {canEdit ? 'Specifications save with the button below.' : 'You can look but not change them.'}</p>
      {canEdit && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Common specifications">
          {COMMON.filter(([n]) => !value.some((s) => s.name === n)).map(([n, g, u]) => <button key={n} type="button" className={btnSecondary} onClick={() => add(n, g, u)}>+ {n}</button>)}
        </div>)}
      {value.length === 0 && <div className={cardCls}><p className="text-sm">No specifications yet.{canEdit ? ' Use a shortcut above or add your own.' : ''}</p></div>}
      <fieldset disabled={!canEdit} className="contents">
        <SortableList items={value} getKey={(s) => s.id} onChange={l.edit} label="specification"
          render={(s) => (
            <div className="grid gap-2 md:grid-cols-4">
              <Lbl t="Group"><input className={small} value={s.group ?? ''} onChange={(e) => set(s.id, { group: e.target.value })} /></Lbl>
              <Lbl t="Name"><input className={small} value={s.name} onChange={(e) => set(s.id, { name: e.target.value })} /></Lbl>
              <Lbl t="Value"><input className={small} value={s.value} onChange={(e) => set(s.id, { value: e.target.value })} /></Lbl>
              <Lbl t="Unit"><input className={small} value={s.unit ?? ''} onChange={(e) => set(s.id, { unit: e.target.value })} /></Lbl>
              {canEdit && <button type="button" className="min-h-touch text-left text-sm text-error" onClick={() => l.edit(value.filter((x) => x.id !== s.id))}>Remove</button>}
            </div>)} />
      </fieldset>
      {canEdit && <div><button type="button" className={btnSecondary} onClick={() => add()}>Add your own specification</button></div>}
      <SaveRow label="Save specifications" canSave={canEdit} dirty={l.dirty} saving={l.saving} savedAt={l.savedAt} error={l.error} onSave={save} />
    </div>
  );
}

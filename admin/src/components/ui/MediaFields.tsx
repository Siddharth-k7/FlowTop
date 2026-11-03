'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { assetName, assetThumb } from '@/lib/media';
import { btnSecondary, inputCls } from '@/lib/ui-classes';
import { MediaPicker } from '@/components/media/MediaPicker';
import type { MediaAsset } from '@flowtop/types';
import { RefSelectField } from './RefFields';
import { SortableList } from './SortableList';

function useAsset(id: string) {
  const [a, setA] = useState<MediaAsset>();
  useEffect(() => { setA(undefined); if (id) api<MediaAsset>(`/admin/media/${id}`).then(setA).catch(() => setA(undefined)); }, [id]);
  return a;
}

function Thumb({ id }: { id: string }) {
  const a = useAsset(id);
  // eslint-disable-next-line @next/next/no-img-element
  return a ? <img src={assetThumb(a)} alt={a.alt} className="h-16 w-16 rounded object-cover" /> : <div className="h-16 w-16 rounded bg-grey-200" aria-hidden />;
}

export function MediaField({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const a = useAsset(value);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? <Thumb id={value} /> : <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-grey-500 text-xs text-grey-500">None</div>}
      <span className="min-w-0 flex-1 truncate text-sm">{a ? assetName(a) : value ? 'Loading…' : 'No file chosen'}</span>
      <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>{value ? 'Change' : 'Choose from library'}</button>
      {value && <button type="button" className={btnSecondary} onClick={() => onChange('')}>Remove</button>}
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(x) => onChange(x.id)} />
    </div>
  );
}

export function MediaListField({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && <p className="text-sm text-grey-500">No files yet. The first one is the main image.</p>}
      <SortableList items={value} getKey={(x) => x} onChange={onChange} label={label}
        render={(id) => (
          <div className="flex items-center gap-3"><Thumb id={id} />
            <span className="flex-1" /><button type="button" className="min-h-touch px-2 text-sm text-error" aria-label="Remove file" onClick={() => onChange(value.filter((x) => x !== id))}>Remove</button></div>)} />
      <div><button type="button" className={btnSecondary} onClick={() => setOpen(true)}>Add from library</button></div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(x) => !value.includes(x.id) && onChange([...value, x.id])} />
    </div>
  );
}

export function StringListField({ value, onChange, label, placeholder }: { value: string[]; onChange: (v: string[]) => void; label: string; placeholder?: string }) {
  // Items are keyed by index-stable ids so typing does not lose focus.
  const [ids, setIds] = useState(() => value.map((_, i) => i));
  const rows = value.map((v, i) => ({ v, k: String(ids[i] ?? i) }));
  const sync = (next: { v: string; k: string }[]) => { setIds(next.map((r) => Number(r.k))); onChange(next.map((r) => r.v)); };
  const nextId = () => Math.max(-1, ...ids) + 1;
  return (
    <div className="flex flex-col gap-2">
      <SortableList items={rows} getKey={(r) => r.k} onChange={sync} label={label}
        render={(r, i) => (
          <div className="flex gap-2">
            <input className={inputCls} aria-label={`${label} ${i + 1}`} placeholder={placeholder} value={r.v} onChange={(e) => sync(rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
            <button type="button" className="min-h-touch px-2 text-sm text-error" aria-label={`Remove ${label} ${i + 1}`} onClick={() => sync(rows.filter((_, j) => j !== i))}>Remove</button>
          </div>)} />
      <div><button type="button" className={btnSecondary} onClick={() => { setIds([...ids, nextId()]); onChange([...value, '']); }}>Add another</button></div>
    </div>
  );
}

type Spot = { productId: string; x: number; y: number };
/** "Shop this look" hotspots: product plus a position as a percentage of the image. */
export function HotspotsField({ value, onChange }: { value: Spot[]; onChange: (v: Spot[]) => void }) {
  const set = (i: number, p: Partial<Spot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const pct = 'min-h-touch w-24 rounded border border-grey-500 bg-white px-2';
  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && <p className="text-sm text-grey-500">No tagged products yet.</p>}
      {value.map((s, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded border border-grey-200 bg-white p-2">
          <label className="min-w-40 flex-1 text-sm">Product<RefSelectField of="products" value={s.productId} onChange={(x) => set(i, { productId: x })} /></label>
          <label className="text-sm">Across (%)<input type="number" min={0} max={100} className={pct} value={s.x} onChange={(e) => set(i, { x: Number(e.target.value) })} /></label>
          <label className="text-sm">Down (%)<input type="number" min={0} max={100} className={pct} value={s.y} onChange={(e) => set(i, { y: Number(e.target.value) })} /></label>
          <button type="button" className="min-h-touch px-2 text-sm text-error" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove tag</button>
        </div>))}
      <div><button type="button" className={btnSecondary} onClick={() => onChange([...value, { productId: '', x: 50, y: 50 }])}>Tag a product</button></div>
    </div>
  );
}

export interface Cta { label: string; href: string; style: string }
/** Hero buttons: a label, a link and one of two approved styles. */
export function CtasField({ value, onChange }: { value: Cta[]; onChange: (v: Cta[]) => void }) {
  const set = (i: number, p: Partial<Cta>) => onChange(value.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="flex flex-col gap-2">
      {value.map((c, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded border border-grey-200 bg-white p-2">
          <label className="min-w-32 flex-1 text-sm">Label<input className={inputCls} value={c.label} onChange={(e) => set(i, { label: e.target.value })} /></label>
          <label className="min-w-32 flex-1 text-sm">Link<input className={inputCls} value={c.href} onChange={(e) => set(i, { href: e.target.value })} /></label>
          <label className="text-sm">Style<select className={inputCls} value={c.style} onChange={(e) => set(i, { style: e.target.value })}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></label>
          <button type="button" className="min-h-touch px-2 text-sm text-error" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button>
        </div>))}
      {value.length < 2 && <div><button type="button" className={btnSecondary} onClick={() => onChange([...value, { label: '', href: '', style: 'primary' }])}>Add a button</button></div>}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { MediaField } from '@/components/ui/MediaFields';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SortableList } from '@/components/ui/SortableList';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import type { SpecItem, Variant } from '@/types/cms';

const small = `${inputCls} !min-h-0 py-2`;
const uid = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const Lbl = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-sm">{t}{children}</label>;

/** Finishes. `price` is the resolved variant price in paise; staff type rupees. */
export function VariantsTab({ value, onChange, errors }: { value: Variant[]; onChange: (v: Variant[]) => void; errors: Record<string, string> }) {
  const [rm, setRm] = useState<Variant>();
  const set = (id: string, p: Partial<Variant>) => onChange(value.map((v) => (v.id === id ? { ...v, ...p } : v)));
  const makeDefault = (id: string) => onChange(value.map((v) => ({ ...v, isDefault: v.id === id })));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-grey-700">Finishes shoppers can choose between. Drag to set the order they appear in.</p>
      {errors.variants && <p role="alert" className="text-sm text-error">{errors.variants}</p>}
      {value.length === 0 && <div className={cardCls}><p className="text-sm">No finishes yet. A product without finishes is sold as one option.</p></div>}
      <SortableList items={value} getKey={(v) => v.id} onChange={onChange} label="finish"
        render={(v) => (
          <div className="grid gap-3 md:grid-cols-3">
            <Lbl t="Finish name"><input className={small} value={v.name} onChange={(e) => set(v.id, { name: e.target.value })} /></Lbl>
            <Lbl t="SKU ending"><input className={small} value={v.skuSuffix} onChange={(e) => set(v.id, { skuSuffix: e.target.value })} /></Lbl>
            <Lbl t="Price (₹)"><input type="number" min={0} className={small} value={v.price / 100} onChange={(e) => set(v.id, { price: Math.round(Number(e.target.value) * 100) })} /></Lbl>
            <Lbl t="Swatch colour code"><input className={small} value={v.swatchHex} placeholder="#1A1A1A" pattern="#[0-9A-Fa-f]{6}" onChange={(e) => set(v.id, { swatchHex: e.target.value })} /></Lbl>
            <div className="md:col-span-2"><span className="text-sm">Photo of this finish</span><MediaField value={v.imageId} onChange={(imageId) => set(v.id, { imageId })} /></div>
            <label className="flex min-h-touch items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.isAvailable} onChange={(e) => set(v.id, { isAvailable: e.target.checked })} />In stock</label>
            <label className="flex min-h-touch items-center gap-2 text-sm"><input type="radio" name="default-finish" className="h-5 w-5" checked={v.isDefault} onChange={() => makeDefault(v.id)} />Show first</label>
            <button type="button" className="min-h-touch text-left text-sm text-error" onClick={() => setRm(v)}>Remove finish</button>
          </div>)} />
      <div><button type="button" className={btnPrimary} onClick={() => onChange([...value, { id: uid(), name: '', skuSuffix: '', price: 0, swatchHex: '', imageId: '', isAvailable: true, isDefault: value.length === 0 }])}>Add a finish</button></div>
      <ConfirmDialog open={!!rm} onClose={() => setRm(undefined)} title={`Remove ${rm?.name || 'this finish'}?`} confirmLabel="Remove finish"
        body="This removes the finish from this product only. The product and its other finishes are not affected. Existing orders keep their own copy of what was bought."
        onConfirm={() => { onChange(value.filter((v) => v.id !== rm?.id)); setRm(undefined); }} />
    </div>
  );
}

const COMMON: [string, string, string][] = [['Material', 'Technical', ''], ['Flow Rate', 'Technical', 'LPM'], ['Spout Reach', 'Dimensions', 'mm'], ['Height', 'Dimensions', 'mm'], ['Weight', 'Dimensions', 'kg'], ['Warranty', 'General', 'years'], ['Water Pressure', 'Technical', 'bar']];

/** Any field, any name: adding "Spout Reach" needs no developer. */
export function SpecsTab({ value, onChange }: { value: SpecItem[]; onChange: (v: SpecItem[]) => void }) {
  const set = (id: string, p: Partial<SpecItem>) => onChange(value.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const add = (name = '', group = 'Technical', unit = '') => onChange([...value, { id: uid(), group, name, value: '', unit }]);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-grey-700">Anything shoppers compare on. A specification with no value is not shown on the site.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common specifications">
        {COMMON.filter(([n]) => !value.some((s) => s.name === n)).map(([n, g, u]) => <button key={n} type="button" className={btnSecondary} onClick={() => add(n, g, u)}>+ {n}</button>)}
      </div>
      {value.length === 0 && <div className={cardCls}><p className="text-sm">No specifications yet. Use a shortcut above or add your own.</p></div>}
      <SortableList items={value} getKey={(s) => s.id} onChange={onChange} label="specification"
        render={(s) => (
          <div className="grid gap-2 md:grid-cols-4">
            <Lbl t="Group"><input className={small} value={s.group} onChange={(e) => set(s.id, { group: e.target.value })} /></Lbl>
            <Lbl t="Name"><input className={small} value={s.name} onChange={(e) => set(s.id, { name: e.target.value })} /></Lbl>
            <Lbl t="Value"><input className={small} value={s.value} onChange={(e) => set(s.id, { value: e.target.value })} /></Lbl>
            <Lbl t="Unit"><input className={small} value={s.unit} onChange={(e) => set(s.id, { unit: e.target.value })} /></Lbl>
            <button type="button" className="min-h-touch text-left text-sm text-error" onClick={() => onChange(value.filter((x) => x.id !== s.id))}>Remove</button>
          </div>)} />
      <div><button type="button" className={btnPrimary} onClick={() => add()}>Add your own specification</button></div>
    </div>
  );
}

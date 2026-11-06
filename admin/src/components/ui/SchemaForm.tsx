'use client';
import { useState } from 'react';
import { Field as UiField } from '@flowtop/ui';
import { inputCls } from '@/lib/ui-classes';
import { RefListField, RefSelectField } from './RefFields';
import { type Cta, CtasField, MediaField, MediaListField, StringListField } from './MediaFields';

import { type Field, type Values } from '@/lib/fields';
export { opts, type Field, type FieldType, type Values } from '@/lib/fields';

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
/** Fields that block publishing until filled. */
export function missingRequired(fields: Field[], v: Values): Record<string, string> {
  const e: Record<string, string> = {};
  for (const f of fields) if (f.required && empty(v[f.key])) e[f.key] = `${f.label} is required before publishing.`;
  return e;
}

/**
 * One renderer for every CMS form. There is deliberately no colour, CSS or class-name field type:
 * visual options are always `select` with approved presets (admin/AGENTS.md).
 */
export function SchemaForm({ fields, value, onChange, errors = {}, idPrefix = 'f', compact }: {
  fields: Field[]; value: Values; onChange: (key: string, v: unknown) => void; errors?: Record<string, string>; idPrefix?: string; compact?: boolean;
}) {
  const [local, setLocal] = useState<Record<string, string>>({});
  const blur = (f: Field) => setLocal((l) => ({ ...l, [f.key]: f.required && empty(value[f.key]) ? `${f.label} is required.` : '' }));
  return (
    <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.key}`;
        const error = errors[f.key] || local[f.key] || undefined;
        const v = value[f.key];
        const wide = ['textarea', 'media', 'mediaList', 'refList', 'stringList', 'ctas'].includes(f.type);
                const body = (a: Record<string, unknown>) => {
          switch (f.type) {
            case 'textarea': return <textarea {...a} rows={4} className={`${inputCls} py-2`} value={String(v ?? '')} onBlur={() => blur(f)} onChange={(e) => onChange(f.key, e.target.value)} />;
            case 'number': return <input {...a} type="number" className={inputCls} value={v === null || v === undefined ? '' : String(v)} onBlur={() => blur(f)} onChange={(e) => onChange(f.key, e.target.value === '' ? null : Number(e.target.value))} />;
            case 'price': // staff type rupees; the API only ever sees integer paise
              return <input {...a} type="number" min={0} step="0.01" inputMode="decimal" className={inputCls} value={typeof v === 'number' ? v / 100 : ''} onBlur={() => blur(f)} onChange={(e) => onChange(f.key, e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))} />;
            case 'date': return <input {...a} type="date" className={inputCls} value={String(v ?? '')} onChange={(e) => onChange(f.key, e.target.value)} />;
            case 'select': return (
              <select {...a} className={inputCls} value={String(v ?? '')} onBlur={() => blur(f)} onChange={(e) => onChange(f.key, f.numeric && e.target.value ? Number(e.target.value) : e.target.value)}>
                <option value="">Choose…</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>);
            case 'toggle': return <label className="flex min-h-touch items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={!!v} onChange={(e) => onChange(f.key, e.target.checked)} />{f.hint ?? 'On'}</label>;
            case 'media': return <MediaField value={String(v ?? '')} onChange={(x) => onChange(f.key, x)} />;
            case 'mediaList': return <MediaListField value={(v as string[]) ?? []} onChange={(x) => onChange(f.key, x)} label={f.label} />;
            case 'ref': return <RefSelectField {...a} of={f.of ?? ''} value={String(v ?? '')} onChange={(x) => onChange(f.key, x)} />;
            case 'refList': return <RefListField of={f.of ?? ''} value={(v as string[]) ?? []} onChange={(x) => onChange(f.key, x)} label={f.label} />;
            case 'stringList': return <StringListField value={(v as string[]) ?? []} onChange={(x) => onChange(f.key, x)} label={f.label} placeholder={f.placeholder} />;
            case 'ctas': return <CtasField value={(v as Cta[]) ?? []} onChange={(x) => onChange(f.key, x)} />;
            default: return <input {...a} type="text" className={inputCls} placeholder={f.placeholder} value={String(v ?? '')} onBlur={() => blur(f)} onChange={(e) => onChange(f.key, e.target.value)} />;
          }
        };
        return (
          <div key={f.key} className={wide && !compact ? 'md:col-span-2' : ''}>
            <UiField id={id} label={f.label} required={f.required} error={error} hint={f.type === 'toggle' ? undefined : f.hint}>{(a) => body(a)}</UiField>
          </div>
        );
      })}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { btnSecondary, inputCls } from '@/lib/ui-classes';
import type { Doc } from '@/lib/doc';
import { SortableList } from './SortableList';

export const docLabel = (d: Doc) => String(d.title ?? d.name ?? d.question ?? d.term ?? d.finish ?? d.id);

/** Options for a reference field, loaded from the same admin list endpoint the list screens use. */
export function useOptions(of: string): Doc[] | undefined {
  const [docs, setDocs] = useState<Doc[]>();
  useEffect(() => { api<Doc[]>(`/admin/${of}`).then(setDocs).catch(() => setDocs([])); }, [of]);
  return docs;
}

export function RefSelectField({ of, value, onChange, ...aria }: { of: string; value: string; onChange: (v: string) => void } & Record<string, unknown>) {
  const docs = useOptions(of);
  return (
    <select {...aria} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} disabled={!docs}>
      <option value="">{docs ? 'Choose…' : 'Loading…'}</option>
      {docs?.map((d) => <option key={d.id} value={d.id}>{docLabel(d)}</option>)}
    </select>
  );
}

/** Ordered multi-pick: the order here is the ranking shown on the site. */
export function RefListField({ of, value, onChange, label }: { of: string; value: string[]; onChange: (v: string[]) => void; label: string }) {
  const docs = useOptions(of);
  const [q, setQ] = useState('');
  const name = (id: string) => { const d = docs?.find((x) => x.id === id); return d ? docLabel(d) : id; };
  const matches = (docs ?? []).filter((d) => !value.includes(d.id) && docLabel(d).toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 ? <p className="text-sm text-grey-500">Nothing chosen yet. Search below to add.</p> : (
        <SortableList items={value} getKey={(x) => x} onChange={onChange} label={label}
          render={(id) => (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm">{name(id)}</span>
              <button type="button" className="min-h-touch px-2 text-sm text-error" onClick={() => onChange(value.filter((x) => x !== id))} aria-label={`Remove ${name(id)}`}>Remove</button>
            </div>)} />)}
      <input type="search" className={inputCls} placeholder={`Search ${label.toLowerCase()} to add`} value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Search ${label}`} />
      {q && (matches.length === 0 ? <p className="text-sm text-grey-500">No matches.</p> : (
        <ul className="flex flex-wrap gap-2">{matches.map((d) => (
          <li key={d.id}><button type="button" className={btnSecondary} onClick={() => { onChange([...value, d.id]); setQ(''); }}>+ {docLabel(d)}</button></li>))}</ul>))}
    </div>
  );
}

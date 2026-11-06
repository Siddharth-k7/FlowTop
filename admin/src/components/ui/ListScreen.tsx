'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import type { Doc } from '@/lib/doc';
import { LoadError, Skeleton } from './EditorBar';

export interface Column { key: string; label: string; render?: (d: Doc) => ReactNode }
export interface ListFilter { key: string; label: string; options: { value: string; label: string }[] }
const PAGE = 25;

/** Table on desktop; on a phone it scrolls inside its own container so the page never scrolls sideways. */
export function ListScreen({ title, endpoint, columns, rowHref, newHref, newLabel = 'Add new', filters = [], emptyText, bulk, headerExtra, initialFilters }: {
  title: string; endpoint: string; columns: Column[]; rowHref: (d: Doc) => string; newHref?: string; newLabel?: string;
  filters?: ListFilter[]; emptyText: string; headerExtra?: ReactNode; initialFilters?: Record<string, string>;
  bulk?: { label: string; run: (ids: string[]) => Promise<unknown> }[];
}) {
  const [rows, setRows] = useState<Doc[]>();
  const [error, setError] = useState<string>();
  const [q, setQ] = useState('');
  const [fv, setFv] = useState<Record<string, string>>(initialFilters ?? {});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>();
  const [shown, setShown] = useState(PAGE);
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>();

  const load = useCallback(() => {
    setError(undefined);
    api<Doc[]>(endpoint).then(setRows).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load this list.'));
  }, [endpoint]);
  useEffect(load, [load]);

  const view = useMemo(() => {
    let r = (rows ?? []).filter((d) => !q || JSON.stringify(Object.values(d)).toLowerCase().includes(q.toLowerCase()));
    for (const [k, v] of Object.entries(fv)) if (v) r = r.filter((d) => String(d[k]) === v);
    if (sort) r = [...r].sort((a, b) => (String(a[sort.key] ?? '') < String(b[sort.key] ?? '') ? -sort.dir : sort.dir));
    return r;
  }, [rows, q, fv, sort]);

  const runBulk = async (b: NonNullable<typeof bulk>[number]) => {
    setMsg(undefined);
    try { await b.run(picked); setPicked([]); load(); setMsg(`${b.label} done. Items that are not ready were left as they were.`); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'That did not work. Nothing was changed.'); }
  };

  return (
    <PageWrapper title={title} actions={<>{headerExtra}{newHref && <Link href={newHref} className={btnPrimary}>{newLabel}</Link>}</>}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <input type="search" className={`${inputCls} md:max-w-sm`} placeholder="Search" aria-label={`Search ${title}`} value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} />
        {filters.map((f) => (
          <select key={f.key} aria-label={f.label} className={`${inputCls} md:w-48`} value={fv[f.key] ?? ''} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })}>
            <option value="">{f.label}: all</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>))}
      </div>
      {bulk && picked.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded bg-purple-pale p-2 text-sm">
          <span>{picked.length} selected</span>{bulk.map((b) => <button key={b.label} className={btnSecondary} onClick={() => runBulk(b)}>{b.label}</button>)}
        </div>)}
      {msg && <p role="status" className="mb-3 text-sm">{msg}</p>}
      {error ? <LoadError message={error} onRetry={load} /> : !rows ? <Skeleton rows={6} /> : view.length === 0 ? (
        <div className={cardCls}>
          <p className="text-sm">{rows.length === 0 ? emptyText : 'Nothing matches your search or filters.'}</p>
          {rows.length === 0 && newHref && <Link href={newHref} className={`${btnPrimary} mt-3`}>{newLabel}</Link>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-card">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-grey-200 text-grey-700"><tr>
              {bulk && <th className="w-10 p-3"><input type="checkbox" aria-label="Select all shown" className="h-5 w-5" checked={picked.length === Math.min(view.length, shown)} onChange={(e) => setPicked(e.target.checked ? view.slice(0, shown).map((d) => d.id) : [])} /></th>}
              {columns.map((c) => (
                <th key={c.key} className="p-3 font-medium" aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  <button className="min-h-touch" onClick={() => setSort({ key: c.key, dir: sort?.key === c.key && sort.dir === 1 ? -1 : 1 })}>{c.label}{sort?.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}</button>
                </th>))}
            </tr></thead>
            <tbody>
              {view.slice(0, shown).map((d) => (
                <tr key={d.id} className="border-b border-grey-100 hover:bg-purple-pale">
                  {bulk && <td className="p-3"><input type="checkbox" className="h-5 w-5" aria-label={`Select ${String(d.name ?? d.title ?? d.id)}`} checked={picked.includes(d.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, d.id] : picked.filter((x) => x !== d.id))} /></td>}
                  {columns.map((c, i) => (
                    <td key={c.key} className="p-3">
                      {i === 0 ? <Link href={rowHref(d)} className="font-medium text-purple-deep underline">{c.render ? c.render(d) : String(d[c.key] ?? '')}</Link> : c.render ? c.render(d) : String(d[c.key] ?? '')}
                    </td>))}
                </tr>))}
            </tbody>
          </table>
          {view.length > shown && <div className="p-3"><button className={btnSecondary} onClick={() => setShown(shown + PAGE)}>Show {Math.min(PAGE, view.length - shown)} more</button></div>}
        </div>)}
    </PageWrapper>
  );
}

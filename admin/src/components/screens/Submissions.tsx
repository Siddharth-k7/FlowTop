'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { LoadError, Skeleton } from '@/components/ui/EditorBar';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import { formatDate } from '@/lib/utils/formatDate';
import type { Doc } from '@/lib/doc';
import { csvDownload } from './Orders';

const TYPES = [
  { value: 'purchase_assistance', label: 'Where to buy (customers)' }, { value: 'contact', label: 'Contact' }, { value: 'dealer_application', label: 'Dealer applications (trade)' },
];
const typeLabel = (t: unknown) => TYPES.find((x) => x.value === t)?.label ?? String(t);

/** Inbox with a detail panel. Customer "where to buy" requests and trade dealer applications are kept apart on purpose. */
export function SubmissionsInbox() {
  const user = useCurrentUser();
  const canExport = user.permissions.includes('order:export'); // COSMETIC ONLY: the server enforces export rights.
  const [rows, setRows] = useState<Doc[]>();
  const [error, setError] = useState<string>();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState<string>();
  const [msg, setMsg] = useState<string>();
  const load = useCallback(() => { api<Doc[]>('/admin/submissions').then(setRows).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load submissions.')); }, []);
  useEffect(load, [load]);
  const view = useMemo(() => (rows ?? []).filter((d) => (!type || d.type === type) && (!status || d.status === status)), [rows, type, status]);
  const cur = rows?.find((d) => d.id === sel);
  const mark = async (d: Doc, next: string) => {
    setMsg(undefined);
    try { const u = await api<Doc>(`/admin/submissions/${d.id}`, { method: 'PATCH', body: { status: next } }); setRows((r) => r?.map((x) => (x.id === u.id ? u : x))); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not update. Nothing was changed.'); }
  };
  return (
    <PageWrapper title="Submissions" actions={canExport && rows ? <button className={btnSecondary} onClick={() => csvDownload('submissions.csv', view, ['reference', 'type', 'name', 'email', 'phone', 'city', 'status', 'createdAt'])}>Export CSV</button> : undefined}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <select className={`${inputCls} md:w-64`} aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}><option value="">Type: all</option>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <select className={`${inputCls} md:w-48`} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Status: all</option><option value="new">New</option><option value="handled">Handled</option></select>
      </div>
      {error ? <LoadError message={error} onRetry={() => { setError(undefined); load(); }} /> : !rows ? <Skeleton rows={5} /> : view.length === 0 ? (
        <div className={cardCls}><p className="text-sm">{rows.length ? 'Nothing matches those filters.' : 'No submissions yet. Messages and “where to buy” requests land here.'}</p></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <ul className={`${cur ? 'hidden lg:flex' : 'flex'} flex-col gap-2`}>
            {view.map((d) => (
              <li key={d.id}><button onClick={() => setSel(d.id)} aria-pressed={d.id === sel} className={`${cardCls} block w-full text-left ${d.id === sel ? 'ring-2 ring-purple-deep' : ''}`}>
                <span className={`block text-sm ${d.status === 'new' ? 'font-semibold' : ''}`}>{String(d.name)}{d.status === 'new' ? ' · new' : ''}</span>
                <span className="block text-xs text-grey-500">{typeLabel(d.type)} · {formatDate(String(d.createdAt))}</span></button></li>))}
          </ul>
          <section aria-label="Submission detail" className={`${cur ? '' : 'hidden lg:block'} ${cardCls}`}>
            {!cur ? <p className="text-sm">Choose a submission to read it.</p> : (
              <div className="flex flex-col gap-2 text-sm">
                <button className="self-start underline lg:hidden" onClick={() => setSel(undefined)}>← Back to list</button>
                <h2 className="text-lg font-semibold">{String(cur.name)}</h2>
                <p className="text-grey-700">{typeLabel(cur.type)} · {String(cur.reference)} · {formatDate(String(cur.createdAt))}</p>
                <p>{String(cur.email)}{cur.phone ? ` · ${String(cur.phone)}` : ''}{cur.city ? ` · ${String(cur.city)}` : ''}</p>
                {cur.fittingInterest ? <p>Interested in: <strong>{String(cur.fittingInterest)}</strong></p> : null}
                <p className="whitespace-pre-wrap rounded bg-grey-100 p-3">{String(cur.message)}</p>
                {!cur.emailSent && <p role="alert" className="text-warning">The email notification for this one failed. It is saved here, so please follow up yourself.</p>}
                {cur.type === 'purchase_assistance' && <p className="text-xs text-grey-500">Reply personally. The customer was never shown any dealer names or contact details.</p>}
                {msg && <p role="alert" className="text-error">{msg}</p>}
                <div><button className={cur.status === 'new' ? btnPrimary : btnSecondary} onClick={() => mark(cur, cur.status === 'new' ? 'handled' : 'new')}>{cur.status === 'new' ? 'Mark as handled' : 'Mark as new'}</button></div>
              </div>)}
          </section>
        </div>)}
    </PageWrapper>
  );
}

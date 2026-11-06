'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, apiDownload, ApiError, saveBlob } from '@/lib/api';
import { useCan } from '@/hooks/useCurrentUser';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ListScreen } from '@/components/ui/ListScreen';
import { ConfirmDialog } from '@/components/ui/Modal';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import { formatDate } from '@/lib/utils/formatDate';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { AdminOrderDetail } from '@flowtop/types';

const STATUSES = ['received', 'confirmed', 'shipped', 'cancelled'];
const opt = (v: string[]) => v.map((x) => ({ value: x, label: x[0]?.toUpperCase() + x.slice(1) }));
const cap = (s: unknown) => <span className="capitalize">{String(s)}</span>;

export function OrderList() {
  // COSMETIC ONLY: the export button is hidden without order:export; the server enforces it on GET /admin/orders/export.
  const canExport = useCan()('order:export');
  const [exportErr, setExportErr] = useState<string>();
  /** The server builds the CSV (docs/03: GET /admin/orders/export). The browser only saves what it sent. */
  const exportCsv = async () => {
    setExportErr(undefined);
    try { const { blob, filename } = await apiDownload('/admin/orders/export', 'orders.csv'); saveBlob(blob, filename); }
    catch (e) { setExportErr(e instanceof ApiError ? e.message : 'Could not export. Nothing was downloaded.'); }
  };
  return (
    <ListScreen title="Orders" endpoint="/admin/orders" rowHref={(d) => `/orders/${d.id}`} emptyText="No orders yet. They appear here as soon as a customer checks out."
      headerExtra={canExport ? <><button className={btnSecondary} onClick={exportCsv}>Export CSV</button>{exportErr && <p role="alert" className="w-full text-sm text-error">{exportErr}</p>}</> : undefined}
      filters={[{ key: 'status', label: 'Status', options: opt(STATUSES) }, { key: 'paymentStatus', label: 'Payment', options: opt(['pending', 'paid', 'failed', 'refunded']) }]}
      columns={[{ key: 'reference', label: 'Order' }, { key: 'customerName', label: 'Customer' }, { key: 'total', label: 'Total', render: (d) => formatPrice(Number(d.total)) },
        { key: 'status', label: 'Status', render: (d) => cap(d.status) }, { key: 'paymentStatus', label: 'Payment', render: (d) => cap(d.paymentStatus) }, { key: 'createdAt', label: 'Placed', render: (d) => formatDate(String(d.createdAt)) }]} />
  );
}

export function OrderDetail({ id }: { id: string }) {
  const canChange = useCan()('order:status_change'); // COSMETIC ONLY: the server checks order:status_change.
  const [o, setO] = useState<AdminOrderDetail>();
  const [err, setErr] = useState<string>();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [fieldErr, setFieldErr] = useState<string>();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { api<AdminOrderDetail>(`/admin/orders/${id}`).then((d) => { setO(d); setStatus(d.status); }).catch((e) => setErr(e instanceof ApiError ? e.message : 'Could not load this order.')); }, [id]);
  useEffect(load, [load]);
  if (err && !o) return <PageWrapper title="Order"><LoadError message={err} onRetry={() => { setErr(undefined); load(); }} /></PageWrapper>;
  if (!o) return <PageWrapper title="Order"><Skeleton rows={5} /></PageWrapper>;
  const items = o.items; const steps = o.timeline;
  const address = [o.delivery.line1, o.delivery.line2, o.delivery.city, o.delivery.state, o.delivery.pin].filter(Boolean).join(', ');
  const change = async () => {
    setBusy(true); setErr(undefined); setFieldErr(undefined);
    try { setO(await api<AdminOrderDetail>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note } })); setNote(''); setAsk(false); }
    catch (e) { setAsk(false); if (e instanceof ApiError) { setErr(e.message); setFieldErr(e.fields.note); } else setErr('Could not change the status. Nothing was changed.'); }
    finally { setBusy(false); }
  };
  return (
    <PageWrapper title={`Order ${String(o.reference)}`} actions={<><Link href="/orders" className="text-sm underline print:hidden">← All orders</Link><button className={`${btnSecondary} print:hidden`} onClick={() => window.print()}>Print</button></>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${cardCls} lg:col-span-2`} aria-label="Items">
          <table className="w-full text-left text-sm"><thead className="text-grey-700"><tr><th className="py-2">Item</th><th>Qty</th><th className="text-right">Line total</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.id} className="border-t border-grey-100"><td className="py-2">{i.name}<span className="block text-xs text-grey-500">{i.sku}{i.finish ? ` · ${i.finish}` : ''}</span></td><td>{i.quantity}</td><td className="text-right">{formatPrice(i.lineTotal)}</td></tr>)}</tbody>
            <tfoot><tr className="border-t border-grey-200 font-semibold"><td className="py-2" colSpan={2}>Total (as charged)</td><td className="text-right">{formatPrice(Number(o.total))}</td></tr></tfoot></table>
        </section>
        <section className={cardCls} aria-label="Customer"><h2 className="mb-1 font-medium">{String(o.customerName)}</h2>
          <p className="text-sm">{o.customerEmail}<br />{o.customerPhone}</p><p className="mt-2 text-sm">{address}</p>
          <p className="mt-3 text-sm">Payment: <strong className="capitalize">{String(o.paymentStatus)}</strong></p></section>
        <section className={`${cardCls} lg:col-span-2`} aria-label="Status history"><h2 className="mb-2 font-medium">History</h2>
          <ol className="flex flex-col gap-2 text-sm">{steps.map((s, i) => <li key={i} className="border-l-2 border-purple-light pl-3"><strong className="capitalize">{s.status}</strong> · {formatDate(s.at)} · {s.by}<br />{s.note}</li>)}</ol></section>
        {canChange && <section className={`${cardCls} print:hidden`} aria-label="Change status"><h2 className="mb-2 font-medium">Change status</h2>
          <p className="mb-2 text-xs text-grey-500">Every change is logged with your name and the note.</p>
          <select className={inputCls} aria-label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>{opt(STATUSES).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          <label className="mt-2 block text-sm">Note<textarea className={`${inputCls} mt-1 py-2`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!fieldErr} /></label>
          {fieldErr && <p className="text-sm text-error">{fieldErr}</p>}
          {err && <p role="alert" className="mt-2 text-sm text-error">{err}</p>}
          <button className={`${btnPrimary} mt-3`} disabled={status === o.status} onClick={() => (note.trim() ? setAsk(true) : setFieldErr('Say why the status is changing.'))}>Update status</button>
        </section>}
      </div>
      <ConfirmDialog open={ask} danger={false} busy={busy} onClose={() => setAsk(false)} onConfirm={change} confirmLabel="Change status" title={`Mark order as ${status}?`}
        body="The status changes for the team. This does not email or notify the customer, and the change is logged with your name." />
    </PageWrapper>
  );
}

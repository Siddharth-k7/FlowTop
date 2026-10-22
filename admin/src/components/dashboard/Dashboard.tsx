'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils/formatPrice';
import { btnSecondary, cardCls } from '@/lib/ui-classes';
import type { DashboardSummary } from '@/types';

const TILES = [
  { href: '/products/new', label: 'Add Product', icon: '▣' },
  { href: '/pages/new', label: 'Create Page', icon: '▤' },
  { href: '/collections/new', label: 'Add Collection', icon: '❖' },
  { href: '/journal/new', label: 'Write Journal', icon: '✎' },
  { href: '/media', label: 'Upload Media', icon: '▨' },
  { href: '/orders', label: 'View Orders', icon: '☷' },
  { href: '/submissions', label: 'View Submissions', icon: '✉' },
  { href: '/navigation', label: 'Navigation', icon: '⇄' },
];

function Card({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${cardCls} block hover:bg-purple-pale`}>
      <h3 className="text-sm text-grey-700">{title}</h3>
      {children}
    </Link>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary>();
  const [error, setError] = useState<string>();
  const load = useCallback(() => {
    setError(undefined);
    api<DashboardSummary>('/admin/dashboard').then(setData).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load.'));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="quick">
        <h2 id="quick" className="mb-3 text-lg font-semibold">Quick actions</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILES.map((t) => (
            <li key={t.label}>
              <Link href={t.href} className={`${cardCls} flex min-h-touch flex-col items-start gap-2 hover:bg-purple-pale`}>
                <span aria-hidden className="text-xl text-purple-deep">{t.icon}</span>
                <span className="text-sm font-medium">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="attn">
        <h2 id="attn" className="mb-3 text-lg font-semibold">Needs your attention</h2>
        {error ? (
          <div role="alert" className={cardCls}>
            <p className="text-sm text-error">{error}</p>
            <button className={`${btnSecondary} mt-3`} onClick={load}>Try again</button>
          </div>
        ) : !data ? (
          <div className="grid gap-3 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-grey-200" />)}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <Card href="/pages?status=draft" title="Draft pages"><p className="text-2xl font-semibold">{data.draftPages}</p></Card>
            <Card href="/products?missing=images" title="Products missing images"><p className="text-2xl font-semibold">{data.productsMissingImages}</p></Card>
            <Card href="/products?missing=specs" title="Products missing specifications"><p className="text-2xl font-semibold">{data.productsMissingSpecs}</p></Card>
            <Card href="/orders" title="Recent orders">
              {data.recentOrders.length === 0 ? <p className="text-sm">No orders yet.</p> : (
                <ul className="mt-1 text-sm">{data.recentOrders.map((o) => <li key={o.id}>{o.reference} · {formatPrice(o.total)} · {o.status}</li>)}</ul>
              )}
            </Card>
            <Card href="/submissions" title="Recent submissions">
              {data.recentSubmissions.length === 0 ? <p className="text-sm">No submissions yet.</p> : (
                <ul className="mt-1 text-sm">{data.recentSubmissions.map((s) => <li key={s.id} className={s.read ? '' : 'font-semibold'}>{s.name} · {s.type}{s.read ? '' : ' (new)'}</li>)}</ul>
              )}
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

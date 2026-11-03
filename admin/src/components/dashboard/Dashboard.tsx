'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Table } from '@flowtop/ui';
import { api, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils/formatPrice';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canSee } from '@/components/shell/nav';
import type { DashboardSummary } from '@/lib/dashboard';
import { visibleTiles } from './tiles';

const tileCls = 'flex min-h-touch flex-col items-start gap-2 rounded-card bg-white p-4 shadow-card hover:bg-purple-pale';

function Stat({ href, title, value }: { href: string; title: string; value: number }) {
  return (
    <Link href={href} className="block rounded-card bg-white p-4 shadow-card hover:bg-purple-pale">
      <h3 className="text-sm text-grey-700">{title}</h3>
      <p className="text-2xl font-semibold">{value}</p>
    </Link>
  );
}

export function Dashboard() {
  const { permissions } = useCurrentUser();
  const [data, setData] = useState<DashboardSummary>();
  const [error, setError] = useState<string>();
  const load = useCallback(() => {
    setError(undefined);
    api<DashboardSummary>('/admin/dashboard').then(setData).catch((e) => setError(
      // The summary endpoint is Phase 4 (Dev B). Until it exists the API answers 404 with a raw route message.
      e instanceof ApiError && e.status === 404 ? 'The dashboard summary is not available yet.'
        : e instanceof ApiError ? e.message : 'Could not load.'));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="quick">
        <h2 id="quick" className="mb-3 text-lg font-semibold">Quick actions</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visibleTiles(permissions).map((t) => (
            <li key={t.label}>
              <Link href={t.href} className={tileCls}>
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
          <Card role="alert"><Card.Body>
            <p className="text-sm text-error">{error}</p>
            <Button variant="secondary" className="mt-3" onClick={load}>Try again</Button>
          </Card.Body></Card>
        ) : (
          <div className="flex flex-col gap-3">
            {data && (
              <div className="grid gap-3 md:grid-cols-3">
                <Stat href="/pages?status=draft" title="Draft pages" value={data.draftPages} />
                <Stat href="/products?missing=images" title="Products missing images" value={data.productsMissingImages} />
                <Stat href="/products?missing=specs" title="Products missing specifications" value={data.productsMissingSpecs} />
              </div>
            )}
            {/* COSMETIC ONLY: the same permission filter as the nav and the tiles. */}
            <div className="grid gap-3 lg:grid-cols-2">
              {canSee(permissions, 'order:read') && (
                <Table caption="Recent orders" loading={!data} skeletonRowCount={2} data={data?.recentOrders ?? []} rowKey={(o) => o.id}
                  emptyState="No orders yet."
                  columns={[
                    { id: 'reference', header: 'Order', accessor: (o) => <Link href="/orders" className="underline">{o.reference}</Link> },
                    { id: 'total', header: 'Total', align: 'right', accessor: (o) => formatPrice(o.total) },
                    { id: 'status', header: 'Status' },
                  ]} />
              )}
              {canSee(permissions, 'submission:read') && (
                <Table caption="Recent submissions" loading={!data} skeletonRowCount={2} data={data?.recentSubmissions ?? []} rowKey={(s) => s.id}
                  emptyState="No submissions yet."
                  columns={[
                    { id: 'name', header: 'From', accessor: (s) => <span className={s.read ? '' : 'font-semibold'}>{s.name}{s.read ? '' : ' (new)'}</span> },
                    { id: 'type', header: 'Type' },
                  ]} />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

'use client';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ListScreen } from '@/components/ui/ListScreen';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SortableList } from '@/components/ui/SortableList';
import { btnPrimary, cardCls, inputCls } from '@/lib/ui-classes';
import { formatDate } from '@/lib/utils/formatDate';
import type { Doc } from '@/types/cms';

export function PageList() {
  const status = useSearchParams().get('status') ?? '';
  return (
    <ListScreen title="Pages" endpoint="/admin/pages" newHref="/pages/new" newLabel="Create page" rowHref={(d) => `/pages/${d.id}`} initialFilters={{ status }}
      emptyText="No pages yet. Create one to build a landing page or a campaign."
      filters={[{ key: 'status', label: 'Status', options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }] }]}
      columns={[{ key: 'title', label: 'Page' }, { key: 'slug', label: 'Address', render: (d: Doc) => `/${String(d.slug)}` }, { key: 'status', label: 'Status', render: (d: Doc) => <span className="capitalize">{String(d.status)}</span> },
        { key: 'updatedAt', label: 'Updated', render: (d: Doc) => formatDate(String(d.updatedAt)) }]} />
  );
}

/** Inline rename, drag reorder, add and delete in one place. Each change saves immediately and says so. */
export function CategoryScreen() {
  const [rows, setRows] = useState<Doc[]>();
  const [error, setError] = useState<string>();
  const [name, setName] = useState('');
  const [rm, setRm] = useState<Doc>();
  const [rmErr, setRmErr] = useState<string>();
  const load = useCallback(() => { api<Doc[]>('/admin/categories').then(setRows).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load categories.')); }, []);
  useEffect(load, [load]);
  const run = async (fn: () => Promise<unknown>) => { setError(undefined); try { await fn(); load(); } catch (e) { setError(e instanceof ApiError ? e.message : 'That did not work. Nothing was changed.'); load(); } };
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <PageWrapper title="Categories">
      {error && rows ? <p role="alert" className="mb-3 text-sm text-error">{error}</p> : null}
      {!rows ? (error ? <LoadError message={error} onRetry={load} /> : <Skeleton />) : (
        <div className={`${cardCls} flex flex-col gap-4`}>
          {rows.length === 0 && <p className="text-sm">No categories yet. Add the first one below, like “Basin Mixers”.</p>}
          <SortableList items={rows} getKey={(d) => d.id} label="category"
            onChange={(n) => { setRows(n); run(() => api('/admin/categories/reorder', { method: 'POST', body: { ids: n.map((d) => d.id) } })); }}
            render={(d) => (
              <div className="flex gap-2">
                <input className={inputCls} aria-label={`Rename ${String(d.name)}`} defaultValue={String(d.name)}
                  onBlur={(e) => e.target.value && e.target.value !== d.name && run(() => api(`/admin/categories/${d.id}`, { method: 'PATCH', body: { name: e.target.value } }))} />
                <button className="min-h-touch px-2 text-sm text-error" onClick={() => { setRmErr(undefined); setRm(d); }}>Delete</button>
              </div>)} />
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(async () => { await api('/admin/categories', { method: 'POST', body: { name: name.trim(), slug: slug(name), description: '' } }); setName(''); }); }}>
            <input className={inputCls} aria-label="New category name" placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
            <button className={btnPrimary} type="submit">Add</button>
          </form>
        </div>)}
      <ConfirmDialog open={!!rm} onClose={() => setRm(undefined)} title={`Delete ${String(rm?.name ?? '')}?`} confirmLabel="Delete category" error={rmErr}
        body="This removes the category and its page from the site. If any products still use it, the delete is refused and nothing changes. Products are never deleted."
        onConfirm={async () => { try { await api(`/admin/categories/${rm?.id}`, { method: 'DELETE' }); setRm(undefined); load(); } catch (e) { setRmErr(e instanceof ApiError ? e.message : 'Could not delete.'); } }} />
    </PageWrapper>
  );
}

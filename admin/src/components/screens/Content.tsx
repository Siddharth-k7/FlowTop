'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { capturePublish } from '@/lib/capture-publish';
import { rankAfterSave } from '@/lib/collection-save';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { DraftBanner, EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ListScreen } from '@/components/ui/ListScreen';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SchemaForm, missingRequired } from '@/components/ui/SchemaForm';
import { useCan } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { btnDanger } from '@/lib/ui-classes';
import type { ContentType } from '@/lib/content-types';
import type { Doc } from '@/lib/doc';

export function ContentList({ ct }: { ct: ContentType }) {
  const can = useCan(); // COSMETIC ONLY: the server checks the write permission.
  return (
    <ListScreen title={ct.title} endpoint={`/admin/${ct.section}`} newHref={can(ct.write) ? `/${ct.section}/new` : undefined} newLabel={`Add ${ct.singular}`} emptyText={ct.emptyText}
      columns={ct.columns.map((c) => ({ ...c, render: (d: Doc) => (c.key === 'filterable' ? (d[c.key] ? 'Yes' : 'No') : String(d[c.key] ?? '') || '—') }))}
      rowHref={(d) => `/${ct.section}/${d.id}`} />
  );
}

export function ContentEditor({ ct, id }: { ct: ContentType; id: string }) {
  const router = useRouter();
  const can = useCan(); // COSMETIC ONLY: hiding a button is presentation; the server checks the permission.
  const canWrite = can(ct.write);
  const idsRef = useRef<unknown>(undefined);
  const publishing = useRef(false);
  const publishError = useRef<string | undefined>(undefined);
  const doc = useDocument<Doc>(ct.section, id, () => (ct.hasStatus ? { status: 'draft' } : {}), ct.toBody, async (saved) => {
    if (ct.section === 'collections') {
      const productIds = idsRef.current;
      if (Array.isArray(productIds)) {
        await api(`/admin/collections/${saved.id}/products`, { method: 'PUT', body: { items: productIds.map((productId, index) => ({ productId: String(productId), position: index + 1 })) } });
      }
      if (publishing.current) {
        publishError.current = await capturePublish(() => api(`/admin/collections/${saved.id}`, { method: 'PATCH', body: { status: 'published' } }).then(() => undefined));
      }
      const fresh = await api<Doc>(`/admin/collections/${saved.id}`);
      if (!Array.isArray(productIds)) return fresh;
      const patchIds = Array.isArray(saved.productIds) ? saved.productIds.map(String) : [];
      return { ...fresh, productIds: rankAfterSave(productIds.map(String), patchIds) };
    }
    if (ct.section === 'journal' && publishing.current) {
      publishError.current = await capturePublish(() => api(`/admin/journal/${saved.id}/publish`, { method: 'POST' }).then(() => undefined));
      return api<Doc>(`/admin/journal/${saved.id}`);
    }
  });
  idsRef.current = doc.value?.productIds;
  const [del, setDel] = useState(false);
  const [delErr, setDelErr] = useState<string>();
  const v = doc.value;
  if (doc.loadError) return <PageWrapper title={ct.title}><LoadError message={doc.loadError} onRetry={doc.reload} /></PageWrapper>;
  if (!v) return <PageWrapper title={ct.title}><Skeleton /></PageWrapper>;
  const missing = missingRequired(ct.fields, v);
  const missingList = Object.values(missing);
  const save = () => doc.save();
  const publish = async () => {
    publishError.current = undefined;
    publishing.current = true;
    try {
      const saved = await doc.save();
      if (saved && publishError.current) doc.setError(publishError.current);
    } finally { publishing.current = false; }
  };
  const remove = async () => {
    try { await api(`/admin/${ct.section}/${id}`, { method: 'DELETE' }); router.replace(`/${ct.section}`); }
    catch (e) { setDelErr(e instanceof ApiError ? e.message : 'Could not delete. Nothing was removed.'); }
  };
  return (
    <PageWrapper title={doc.isNew ? `New ${ct.singular}` : String(v[ct.titleKey] || ct.singular)}
      actions={<Link href={`/${ct.section}`} className="text-sm underline">← All {ct.title.toLowerCase()}</Link>}>
      {doc.draft && <DraftBanner onUse={doc.useDraft} onDrop={doc.dropDraft} />}
      <div className="rounded-lg bg-white p-4 shadow-card">
        <SchemaForm fields={ct.fields} value={v} onChange={(k, x) => doc.set({ [k]: x })} errors={doc.errors} idPrefix={ct.section} />
        {!doc.isNew && canWrite && ct.section !== 'collections' && ct.section !== 'journal' && <button className={`${btnDanger} mt-6`} onClick={() => setDel(true)}>Delete {ct.singular}</button>}
      </div>
      <EditorBar status={ct.hasStatus ? String(v.status) : undefined} dirty={doc.dirty} saving={doc.saving} savedAt={doc.savedAt} error={doc.error} onSave={() => save()} canSave={canWrite}
        onPublish={ct.hasStatus && can(ct.publish) ? () => publish() : undefined}
        publishLabel={v.status === 'published' ? 'Save and keep published' : 'Publish'}
        blockedReason={ct.hasStatus && missingList.length ? `Before publishing: ${missingList[0]}` : undefined} />
      <ConfirmDialog open={del} onClose={() => setDel(false)} title={`Delete this ${ct.singular}?`} body={ct.deleteNote} confirmLabel={`Delete ${ct.singular}`} error={delErr} onConfirm={remove} />
    </PageWrapper>
  );
}

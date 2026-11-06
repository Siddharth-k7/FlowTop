'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { DraftBanner, EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ListScreen } from '@/components/ui/ListScreen';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SchemaForm, missingRequired } from '@/components/ui/SchemaForm';
import { useDocument } from '@/hooks/useDocument';
import { btnDanger } from '@/lib/ui-classes';
import type { ContentType } from '@/lib/content-types';
import type { Doc } from '@/lib/doc';

export function ContentList({ ct }: { ct: ContentType }) {
  return (
    <ListScreen title={ct.title} endpoint={`/admin/${ct.section}`} newHref={`/${ct.section}/new`} newLabel={`Add ${ct.singular}`} emptyText={ct.emptyText}
      columns={ct.columns.map((c) => ({ ...c, render: (d: Doc) => (c.key === 'filterable' ? (d[c.key] ? 'Yes' : 'No') : String(d[c.key] ?? '') || '—') }))}
      rowHref={(d) => `/${ct.section}/${d.id}`} />
  );
}

export function ContentEditor({ ct, id }: { ct: ContentType; id: string }) {
  const router = useRouter();
  const doc = useDocument<Doc>(ct.section, id, () => (ct.hasStatus ? { status: 'draft' } : {}));
  const [del, setDel] = useState(false);
  const [delErr, setDelErr] = useState<string>();
  const v = doc.value;
  if (doc.loadError) return <PageWrapper title={ct.title}><LoadError message={doc.loadError} onRetry={doc.reload} /></PageWrapper>;
  if (!v) return <PageWrapper title={ct.title}><Skeleton /></PageWrapper>;
  const missing = missingRequired(ct.fields, v);
  const missingList = Object.values(missing);
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
        {!doc.isNew && <button className={`${btnDanger} mt-6`} onClick={() => setDel(true)}>Delete {ct.singular}</button>}
      </div>
      <EditorBar status={ct.hasStatus ? String(v.status) : undefined} dirty={doc.dirty} saving={doc.saving} savedAt={doc.savedAt} error={doc.error} onSave={() => doc.save()}
        onPublish={ct.hasStatus ? () => doc.save({ status: 'published' }) : undefined}
        publishLabel={v.status === 'published' ? 'Save and keep published' : 'Publish'}
        blockedReason={ct.hasStatus && missingList.length ? `Before publishing: ${missingList[0]}` : undefined} />
      <ConfirmDialog open={del} onClose={() => setDel(false)} title={`Delete this ${ct.singular}?`} body={ct.deleteNote} confirmLabel={`Delete ${ct.singular}`} error={delErr} onConfirm={remove} />
    </PageWrapper>
  );
}

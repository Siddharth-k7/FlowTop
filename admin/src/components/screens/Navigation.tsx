'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { SortableList } from '@/components/ui/SortableList';
import { btnSecondary, inputCls } from '@/lib/ui-classes';
import type { NavNode } from '@/types/cms';

const uid = () => `nv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;

function Level({ nodes, onChange, depth }: { nodes: NavNode[]; onChange: (n: NavNode[]) => void; depth: number }) {
  const set = (id: string, p: Partial<NavNode>) => onChange(nodes.map((n) => (n.id === id ? { ...n, ...p } : n)));
  return (
    <div className="flex flex-col gap-2">
      <SortableList items={nodes} getKey={(n) => n.id} onChange={onChange} label="menu item"
        render={(n) => (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input className={`${inputCls} flex-1`} aria-label="Menu label" placeholder="Label" value={n.label} onChange={(e) => set(n.id, { label: e.target.value })} />
              <input className={`${inputCls} flex-1`} aria-label="Menu link" placeholder="/products" value={n.href} onChange={(e) => set(n.id, { href: e.target.value })} />
              <button className="min-h-touch px-2 text-sm text-error" onClick={() => onChange(nodes.filter((x) => x.id !== n.id))}>Remove{n.children.length ? ' with sub-items' : ''}</button>
            </div>
            {depth < 1 && (
              <div className="ml-4 border-l-2 border-purple-pale pl-3">
                <Level nodes={n.children} depth={depth + 1} onChange={(c) => set(n.id, { children: c })} />
              </div>)}
          </div>)} />
      <div><button className={btnSecondary} onClick={() => onChange([...nodes, { id: uid(), label: '', href: '', children: [] }])}>{depth ? 'Add sub-item' : 'Add menu item'}</button></div>
    </div>
  );
}

/** Two levels, drag to reorder. Saved as one replacement, same as the API (PUT replaces the tree). */
export function NavigationEditor() {
  const [tree, setTree] = useState<NavNode[]>();
  const [base, setBase] = useState('');
  const [error, setError] = useState<string>();
  const [loadErr, setLoadErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const load = () => api<NavNode[]>('/admin/navigation').then((t) => { setTree(t); setBase(JSON.stringify(t)); }).catch((e) => setLoadErr(e instanceof ApiError ? e.message : 'Could not load the menu.'));
  useEffect(() => { load(); }, []);
  if (loadErr) return <PageWrapper title="Navigation"><LoadError message={loadErr} onRetry={() => { setLoadErr(undefined); load(); }} /></PageWrapper>;
  if (!tree) return <PageWrapper title="Navigation"><Skeleton /></PageWrapper>;
  const blankLabel = JSON.stringify(tree).includes('"label":""');
  const save = async () => {
    setSaving(true); setError(undefined);
    try { const t = await api<NavNode[]>('/admin/navigation', { method: 'PUT', body: { tree } }); setBase(JSON.stringify(t)); setSavedAt(new Date()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save. Your changes are still here.'); }
    finally { setSaving(false); }
  };
  return (
    <PageWrapper title="Navigation">
      <p className="mb-3 text-sm text-grey-700">This is the site menu. Drag to reorder. A menu item can have one level of sub-items.</p>
      <div className="rounded-lg bg-white p-4 shadow-card"><Level nodes={tree} depth={0} onChange={(t) => { setTree(t); setSavedAt(undefined); }} /></div>
      <EditorBar dirty={JSON.stringify(tree) !== base} saving={saving} savedAt={savedAt} error={error} onSave={save} onPublish={save} publishLabel="Save menu" blockedReason={blockedMsg(blankLabel)} />
    </PageWrapper>
  );
}
const blockedMsg = (blank: boolean) => (blank ? 'Every menu item needs a label before saving.' : undefined);

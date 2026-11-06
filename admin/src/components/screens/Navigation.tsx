'use client';
import { useEffect, useState } from 'react';
import type { AdminNavigation, NavNode, NavigationLinkTypeName } from '@flowtop/types';
import { api, ApiError } from '@/lib/api';
import { useCan } from '@/hooks/useCurrentUser';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { SortableList } from '@/components/ui/SortableList';
import { btnSecondary, inputCls } from '@/lib/ui-classes';

const LINKS: NavigationLinkTypeName[] = ['page', 'category', 'collection', 'product', 'external'];
const uid = () => `nv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
const blank = (): NavNode => ({ id: uid(), label: '', linkType: 'external', destination: '/', openInNewTab: false, children: [] });

function Level({ nodes, onChange, depth }: { nodes: NavNode[]; onChange: (n: NavNode[]) => void; depth: number }) {
  const set = (id: string, patch: Partial<NavNode>) => onChange(nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)));
  return (
    <div className="flex flex-col gap-2">
      <SortableList items={nodes} getKey={(node) => node.id} onChange={onChange} label="menu item"
        render={(node) => (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input className={`${inputCls} min-w-32 flex-1`} aria-label="Menu label" placeholder="Label" value={node.label} onChange={(e) => set(node.id, { label: e.target.value })} />
              <select className={`${inputCls} w-36`} aria-label="Link type" value={node.linkType} onChange={(e) => set(node.id, { linkType: e.target.value as NavigationLinkTypeName })}>
                {LINKS.map((link) => <option key={link} value={link}>{link}</option>)}
              </select>
              <input className={`${inputCls} min-w-32 flex-1`} aria-label="Destination" placeholder={node.linkType === 'external' ? 'https://, mailto: or tel:' : 'id of the page, category, collection or product'} value={node.destination} onChange={(e) => set(node.id, { destination: e.target.value })} />
              <label className="flex min-h-touch items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={node.openInNewTab} onChange={(e) => set(node.id, { openInNewTab: e.target.checked })} />New tab</label>
              <button className="min-h-touch px-2 text-sm text-error" onClick={() => onChange(nodes.filter((item) => item.id !== node.id))}>Remove{node.children.length ? ' with sub-items' : ''}</button>
            </div>
            {depth < 1 && (
              <div className="ml-4 border-l-2 border-purple-pale pl-3">
                <Level nodes={node.children} depth={depth + 1} onChange={(children) => set(node.id, { children })} />
              </div>)}
          </div>)} />
      <div><button className={btnSecondary} onClick={() => onChange([...nodes, blank()])}>{depth ? 'Add sub-item' : 'Add menu item'}</button></div>
    </div>
  );
}

/** Header and footer, one level of sub-items. PUT replaces both menus. */
export function NavigationEditor() {
  const canWrite = useCan()('navigation:write'); // COSMETIC ONLY: the server checks navigation:write.
  const [tree, setTree] = useState<AdminNavigation>();
  const [base, setBase] = useState('');
  const [error, setError] = useState<string>();
  const [loadErr, setLoadErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const load = () => api<AdminNavigation>('/admin/navigation').then((next) => { setTree(next); setBase(JSON.stringify(next)); }).catch((e) => setLoadErr(e instanceof ApiError ? e.message : 'Could not load the menu.'));
  useEffect(() => { load(); }, []);
  if (loadErr) return <PageWrapper title="Navigation"><LoadError message={loadErr} onRetry={() => { setLoadErr(undefined); load(); }} /></PageWrapper>;
  if (!tree) return <PageWrapper title="Navigation"><Skeleton /></PageWrapper>;
  const blankLabel = JSON.stringify(tree).includes('"label":""');
  const save = async () => {
    setSaving(true); setError(undefined);
    try { const next = await api<AdminNavigation>('/admin/navigation', { method: 'PUT', body: tree }); setTree(next); setBase(JSON.stringify(next)); setSavedAt(new Date()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save. Your changes are still here.'); }
    finally { setSaving(false); }
  };
  return (
    <PageWrapper title="Navigation">
      <p className="mb-3 text-sm text-grey-700">Header and footer. A menu item points at a page, category, collection, product, or an external address. Drag to reorder.</p>
      <fieldset disabled={!canWrite} className="flex flex-col gap-6 rounded-lg bg-white p-4 shadow-card">
        <section aria-label="Header"><h2 className="mb-2 font-medium">Header</h2><Level nodes={tree.header} depth={0} onChange={(header) => { if (canWrite) { setTree({ ...tree, header }); setSavedAt(undefined); } }} /></section>
        <section aria-label="Footer"><h2 className="mb-2 font-medium">Footer</h2><Level nodes={tree.footer} depth={0} onChange={(footer) => { if (canWrite) { setTree({ ...tree, footer }); setSavedAt(undefined); } }} /></section>
      </fieldset>
      <EditorBar dirty={JSON.stringify(tree) !== base} saving={saving} savedAt={savedAt} error={error} onSave={save} canSave={canWrite} onPublish={canWrite ? save : undefined} publishLabel="Save menu" blockedReason={blankLabel ? 'Every menu item needs a label before saving.' : undefined} />
    </PageWrapper>
  );
}

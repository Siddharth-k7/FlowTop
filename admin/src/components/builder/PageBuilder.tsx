'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { DraftBanner, EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SchemaForm, type Field } from '@/components/ui/SchemaForm';
import { SortableList } from '@/components/ui/SortableList';
import { useDocument } from '@/hooks/useDocument';
import { SECTIONS, SECTION_TYPES, TEMPLATES, defaultConfig } from '@/lib/sections';
import { btnPrimary, btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import type { Page, Section } from '@flowtop/types';
import { DEVICES, PagePreview, type Device } from './PagePreview';
import { SectionEditor } from './SectionEditor';

const SETTINGS: Field[] = [
  { key: 'title', label: 'Page title', type: 'text', required: true }, { key: 'slug', label: 'Web address', type: 'text', required: true, hint: 'Leave empty only for the homepage.' },
  { key: 'seoTitle', label: 'Search result title', type: 'text' }, { key: 'seoDescription', label: 'Search result description', type: 'textarea' },
];
const blank = (): Omit<Page, 'id'> => ({ title: '', slug: '', status: 'draft', sections: [], seo: { title: '', description: '', canonical: null, shareImage: null } });
const renumber = (s: Section[]): Section[] => s.map((x, i) => ({ ...x, position: i + 1 }));
const sid = () => `sec${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const summary = (s: Section) => String(s.config.headline ?? s.config.heading ?? s.config.question ?? '') || 'Untitled';
const HISTORY = 20;

/** Three columns on desktop (list, live preview, editor); tabs on tablet and phone. */
export function PageBuilder({ id }: { id: string }) {
  const doc = useDocument<Page>('pages', id, blank);
  const [pane, setPane] = useState<'sections' | 'preview' | 'edit'>('sections');
  const [selected, setSelected] = useState<string>();
  const [device, setDevice] = useState<Device>('desktop');
  const [past, setPast] = useState<Section[][]>([]);
  const [future, setFuture] = useState<Section[][]>([]);
  const [add, setAdd] = useState('hero');
  const [rm, setRm] = useState<Section>();
  const [busy, setBusy] = useState(false);
  const lastEdit = useRef(0);
  const v = doc.value;

  // Server autosave every 30s, drafts only: saving a published page would change the live site.
  const autosave = useRef<() => void>(() => {});
  autosave.current = () => { if (v && doc.dirty && !doc.isNew && v.status === 'draft' && !doc.saving) doc.save(); };
  useEffect(() => { const t = setInterval(() => autosave.current(), 30_000); return () => clearInterval(t); }, []);

  if (doc.loadError) return <PageWrapper title="Page"><LoadError message={doc.loadError} onRetry={doc.reload} /></PageWrapper>;
  if (!v) return <PageWrapper title="Page"><Skeleton rows={6} /></PageWrapper>;
  const secs = v.sections;
  const sel = secs.find((s) => s.id === selected);

  /** Every change goes through here so undo and redo cover it. Rapid typing in one field counts as one step. */
  const apply = (next: Section[], coalesce = false) => {
    const t = Date.now();
    if (!(coalesce && t - lastEdit.current < 1000)) setPast((p) => [...p.slice(-(HISTORY - 1)), secs]);
    lastEdit.current = t; setFuture([]); doc.set({ sections: renumber(next) });
  };
  const undo = () => { const p = past.at(-1); if (!p) return; setPast(past.slice(0, -1)); setFuture([secs, ...future].slice(0, HISTORY)); doc.set({ sections: p }); };
  const redo = () => { const f = future[0]; if (!f) return; setFuture(future.slice(1)); setPast([...past, secs].slice(-HISTORY)); doc.set({ sections: f }); };
  const patch = (secId: string, p: Partial<Section>, coalesce = false) => apply(secs.map((s) => (s.id === secId ? { ...s, ...p } : s)), coalesce);
  const addType = (type: string) => { const s: Section = { id: sid(), type, position: secs.length + 1, visible: true, config: defaultConfig(type) }; apply([...secs, s]); setSelected(s.id); setPane('edit'); };
  const duplicate = (s: Section) => { const copy: Section = { ...structuredClone(s), id: sid() }; apply([...secs.slice(0, secs.indexOf(s) + 1), copy, ...secs.slice(secs.indexOf(s) + 1)]); setSelected(copy.id); };

  const publish = async () => {
    setBusy(true);
    try { const saved = await doc.save(); if (saved) { await api(`/admin/pages/${saved.id}/publish`, { method: 'POST' }); doc.set({ status: 'published' }); await doc.save(); } }
    catch (e) { doc.setError(e instanceof ApiError ? e.message : 'Could not publish. The page was not changed.'); }
    finally { setBusy(false); }
  };

  return (
    <PageWrapper title={doc.isNew ? 'New page' : v.title || 'Page'} actions={<Link href="/pages" className="text-sm underline">← All pages</Link>}>
      {doc.draft && <DraftBanner onUse={doc.useDraft} onDrop={doc.dropDraft} />}
      {doc.isNew && secs.length === 0 && (
        <div className={`${cardCls} mb-4`}>
          <h2 className="mb-2 font-medium">Start from</h2>
          <div className="flex flex-wrap gap-2">{TEMPLATES.map((t) => (
            <button key={t.id} className={btnSecondary} onClick={() => apply(t.types.map((type) => ({ id: sid(), type, position: 0, visible: true, config: defaultConfig(type) })))}>{t.label}</button>))}</div>
        </div>)}
      <div className="mb-3 flex items-center gap-2 lg:hidden" role="tablist" aria-label="Builder panels">
        {(['sections', 'preview', 'edit'] as const).map((p) => <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={`${btnSecondary} flex-1 capitalize ${pane === p ? '!bg-purple-deep !text-white' : ''}`}>{p === 'edit' ? 'Edit section' : p}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <section aria-label="Sections" className={`${pane === 'sections' ? '' : 'hidden'} flex flex-col gap-3 lg:flex`}>
          <div className="flex flex-wrap gap-2">
            <button className={btnSecondary} onClick={undo} disabled={!past.length} aria-label="Undo">↶ Undo</button>
            <button className={btnSecondary} onClick={redo} disabled={!future.length} aria-label="Redo">↷ Redo</button>
          </div>
          {secs.length === 0 ? <div className={cardCls}><p className="text-sm">No sections yet. Pick a type below and add the first one.</p></div> : (
            <SortableList items={secs} getKey={(s) => s.id} onChange={(n) => apply(n)} label="section"
              render={(s) => (
                <div className={`flex flex-col gap-1 rounded p-1 ${s.id === selected ? 'bg-purple-pale' : ''} ${s.visible ? '' : 'opacity-60'}`}>
                  <button className="min-h-touch text-left" onClick={() => { setSelected(s.id); setPane('edit'); }} aria-pressed={s.id === selected}>
                    <span className="block text-sm font-medium">{SECTIONS[s.type]?.label ?? s.type}{s.visible ? '' : ' (hidden)'}</span>
                    <span className="block truncate text-xs text-grey-500">{summary(s)}</span>
                  </button>
                  <span className="flex flex-wrap gap-3 text-xs">
                    <button className="min-h-touch underline" onClick={() => patch(s.id, { visible: !s.visible })}>{s.visible ? 'Hide' : 'Show'}</button>
                    <button className="min-h-touch underline" onClick={() => duplicate(s)}>Duplicate</button>
                    <button className="min-h-touch text-error underline" onClick={() => setRm(s)}>Delete</button>
                  </span>
                </div>)} />)}
          <div className="flex gap-2">
            <select className={inputCls} aria-label="Section type to add" value={add} onChange={(e) => setAdd(e.target.value)}>
              {SECTION_TYPES.map((t) => <option key={t} value={t}>{SECTIONS[t]?.label}</option>)}
            </select>
            <button className={btnPrimary} onClick={() => addType(add)}>Add</button>
          </div>
          <details className={cardCls}>
            <summary className="min-h-touch cursor-pointer font-medium">Page settings</summary>
            <div className="mt-3"><SchemaForm compact idPrefix="pg" fields={SETTINGS} value={{ ...v, seoTitle: v.seo.title, seoDescription: v.seo.description }} onChange={(k, x) => doc.set((k === 'seoTitle' ? { seo: { ...v.seo, title: String(x) } } : k === 'seoDescription' ? { seo: { ...v.seo, description: String(x) } } : { [k]: x }) as Partial<Page>)} errors={doc.errors} /></div>
          </details>
        </section>
        <section aria-label="Live preview" className={`${pane === 'preview' ? '' : 'hidden'} min-w-0 lg:block`}>
          <div className="mb-2 flex gap-2" role="group" aria-label="Preview device">
            {(Object.keys(DEVICES) as Device[]).map((d) => <button key={d} className={`${btnSecondary} capitalize`} aria-pressed={device === d} onClick={() => setDevice(d)}>{d}</button>)}
          </div>
          <PagePreview sections={secs} device={device} />
        </section>
        <section aria-label="Section editor" className={`${pane === 'edit' ? '' : 'hidden'} lg:block`}>
          <div className={cardCls}>
            {sel ? <SectionEditor section={sel} onChange={(config) => patch(sel.id, { config }, true)} /> : <p className="text-sm">Pick a section on the left to edit its content and layout.</p>}
          </div>
        </section>
      </div>
      <EditorBar status={v.status} dirty={doc.dirty} saving={doc.saving || busy} savedAt={doc.savedAt} error={doc.error} onSave={() => doc.save()}
        onPublish={publish} publishLabel={v.status === 'published' ? 'Publish changes' : 'Publish'}
        blockedReason={!v.title ? 'Before publishing: give the page a title (Page settings).' : undefined}
        extra={v.status === 'draft' && !doc.isNew ? <span className="text-xs text-grey-500">Autosaves every 30s</span> : undefined} />
      <ConfirmDialog open={!!rm} onClose={() => setRm(undefined)} title={`Delete this ${rm ? SECTIONS[rm.type]?.label : ''} section?`} confirmLabel="Delete section"
        body="This removes the section from this page only. Products, images and other pages are not affected. You can undo this until you leave the page."
        onConfirm={() => { if (rm) { apply(secs.filter((s) => s.id !== rm.id)); if (selected === rm.id) setSelected(undefined); } setRm(undefined); }} />
    </PageWrapper>
  );
}

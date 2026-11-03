'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { DraftBanner, EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { MediaListField } from '@/components/ui/MediaFields';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SchemaForm, missingRequired, type Field } from '@/components/ui/SchemaForm';
import { useDocument } from '@/hooks/useDocument';
import { btnSecondary, cardCls } from '@/lib/ui-classes';
import type { Product } from '@/types/cms';
import { PlacementPanel } from './PlacementPanel';
import { SpecsTab, VariantsTab } from './VariantsAndSpecs';

const IDENTITY: Field[] = [
  { key: 'name', label: 'Product name', type: 'text', required: true }, { key: 'slug', label: 'Web address', type: 'text', hint: 'Lowercase letters and dashes. Filled in from the name.' },
  { key: 'sku', label: 'SKU', type: 'text', required: true }, { key: 'categoryId', label: 'Category', type: 'ref', of: 'categories', required: true },
  { key: 'collectionIds', label: 'Collections', type: 'refList', of: 'collections' },
  { key: 'shortDescription', label: 'Short description', type: 'textarea', hint: 'One or two sentences for product cards.' },
  { key: 'fullDescription', label: 'Full description', type: 'textarea' },
];
const COMMERCE: Field[] = [
  { key: 'price', label: 'Price (₹)', type: 'price', required: true }, { key: 'salePrice', label: 'Sale price (₹)', type: 'price', hint: 'Leave empty if not on sale.' },
  { key: 'isPurchasable', label: 'Can be bought online', type: 'toggle', hint: 'Buyers can add this to the cart' }, { key: 'isAvailable', label: 'In stock', type: 'toggle', hint: 'Available to order' },
  { key: 'availabilityMessage', label: 'Availability message', type: 'text', placeholder: 'Ships in 3 working days' },
];
const SEO: Field[] = [
  { key: 'seoTitle', label: 'Search result title', type: 'text', hint: 'Aim for under 60 characters.' }, { key: 'seoDescription', label: 'Search result description', type: 'textarea', hint: 'Aim for under 160 characters.' },
  { key: 'seoCanonical', label: 'Preferred address (advanced)', type: 'text' }, { key: 'shareImageId', label: 'Share image', type: 'media' },
];
const GUIDE: Field[] = [
  { key: 'beforeYouBuy', label: 'Before you buy checklist', type: 'stringList', placeholder: 'e.g. Needs a 35mm tap hole' },
  { key: 'fitChecks', label: 'Will this fit? Measurements', type: 'stringList', placeholder: 'e.g. Spout reach: 120 mm' },
  { key: 'relatedIds', label: 'Style-related products', type: 'refList', of: 'products' }, { key: 'compatibleIds', label: 'Compatible installation hardware', type: 'refList', of: 'products' },
];
const TABS = ['Identity', 'Commerce', 'Variants', 'Specifications', 'Media', 'SEO', 'Guidance', 'Placement'] as const;
type Tab = (typeof TABS)[number];
const FIELD_TAB: Record<string, Tab> = { ...Object.fromEntries(IDENTITY.map((f) => [f.key, 'Identity'])), ...Object.fromEntries(COMMERCE.map((f) => [f.key, 'Commerce'])), galleryIds: 'Media', variants: 'Variants' };
const blank = (): Omit<Product, 'id'> => ({ name: '', slug: '', sku: '', status: 'draft', shortDescription: '', fullDescription: '', price: 0, salePrice: null, isPurchasable: true, isAvailable: true, availabilityMessage: '', categoryId: '', collectionIds: [], variants: [], specs: [], galleryIds: [], documentIds: [], seoTitle: '', seoDescription: '', seoCanonical: '', shareImageId: '', relatedIds: [], compatibleIds: [], beforeYouBuy: [], fitChecks: [], updatedAt: '' });
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ProductEditor({ id }: { id: string }) {
  const doc = useDocument<Product>('products', id, blank);
  const [tab, setTab] = useState<Tab>('Identity');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'archive' | 'unpublish'>();
  const v = doc.value;
  if (doc.loadError) return <PageWrapper title="Product"><LoadError message={doc.loadError} onRetry={doc.reload} /></PageWrapper>;
  if (!v) return <PageWrapper title="Product"><Skeleton rows={6} /></PageWrapper>;

  const change = (k: string, x: unknown) => doc.set({ [k]: x, ...(k === 'name' && (!v.slug || v.slug === slugify(v.name)) ? { slug: slugify(String(x)) } : {}) } as Partial<Product>);
  const need = missingRequired([...IDENTITY, ...COMMERCE, { key: 'galleryIds', label: 'At least one image', type: 'mediaList', required: true }], { ...v, price: v.price > 0 ? v.price : null });
  const errTab = (t: Tab) => Object.keys(doc.errors).some((k) => FIELD_TAB[k] === t);

  /** Publish / unpublish / archive: save first, then the lifecycle call. A failure shows the server's reasons per field. */
  const lifecycle = async (action: 'publish' | 'unpublish' | 'archive') => {
    setBusy(true);
    try {
      const saved = doc.dirty || doc.isNew ? await doc.save() : v;
      if (!saved) return;
      await api(`/admin/products/${saved.id}/${action}`, { method: 'POST' });
      doc.set({ status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft' });
      await doc.save(); // refreshes baseline so the bar reads clean
    } catch (e) {
      if (e instanceof ApiError) { doc.setError(e.message); doc.setErrors(e.fields); const first = Object.keys(e.fields)[0]; if (first && FIELD_TAB[first]) setTab(FIELD_TAB[first]); }
      else doc.setError('That did not work. Nothing was changed.');
    } finally { setBusy(false); setConfirm(undefined); }
  };
  const first = Object.values(need)[0];
  const seoLen = (n: number, max: number) => <span className={n > max ? 'text-error' : 'text-grey-500'}>{n}/{max}</span>;

  return (
    <PageWrapper title={doc.isNew ? 'New product' : v.name || 'Product'} actions={<Link href="/products" className="text-sm underline">← All products</Link>}>
      {doc.draft && <DraftBanner onUse={doc.useDraft} onDrop={doc.dropDraft} />}
      <div role="tablist" aria-label="Product sections" className="mb-4 flex gap-1 overflow-x-auto border-b border-grey-200">
        {TABS.map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="tabpanel" onClick={() => setTab(t)}
            className={`min-h-touch shrink-0 whitespace-nowrap px-4 text-sm ${tab === t ? 'border-b-2 border-purple-deep font-semibold text-purple-deep' : 'text-grey-700'}`}>
            {t}{errTab(t) && <span aria-label="has errors" className="ml-1 text-error">●</span>}
          </button>))}
      </div>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="rounded-lg bg-white p-4 shadow-card">
        {tab === 'Identity' && <SchemaForm fields={IDENTITY} value={v} onChange={change} errors={doc.errors} idPrefix="p" />}
        {tab === 'Commerce' && <SchemaForm fields={COMMERCE} value={v} onChange={change} errors={doc.errors} idPrefix="p" />}
        {tab === 'Variants' && <VariantsTab value={v.variants} onChange={(x) => doc.set({ variants: x })} errors={doc.errors} />}
        {tab === 'Specifications' && <SpecsTab value={v.specs} onChange={(x) => doc.set({ specs: x })} />}
        {tab === 'Media' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-grey-700">The first image is the main one. Describe each image in Media so it works for screen readers.</p>
            {doc.errors.galleryIds && <p role="alert" className="text-sm text-error">{doc.errors.galleryIds}</p>}
            <h3 className="font-medium">Gallery</h3><MediaListField value={v.galleryIds} onChange={(x) => doc.set({ galleryIds: x })} label="Image" />
            <h3 className="font-medium">Downloads (manuals, spec sheets)</h3><MediaListField value={v.documentIds} onChange={(x) => doc.set({ documentIds: x })} label="Document" />
            <Link href="/media" className={`${btnSecondary} self-start`}>Edit alt text in Media</Link>
          </div>)}
        {tab === 'SEO' && (
          <div className="flex flex-col gap-4">
            <SchemaForm fields={SEO} value={v} onChange={change} errors={doc.errors} idPrefix="p" />
            <p className="text-xs">Title {seoLen(v.seoTitle.length, 60)} · Description {seoLen(v.seoDescription.length, 160)}</p>
            <div className={cardCls} aria-label="How it may look on Google">
              <p className="text-sm text-info">flowtop.in › products › {v.slug || 'your-product'}</p>
              <p className="text-lg text-info">{v.seoTitle || v.name || 'Product title'}</p>
              <p className="text-sm text-grey-700">{v.seoDescription || v.shortDescription || 'Description appears here.'}</p>
            </div>
          </div>)}
        {tab === 'Guidance' && <SchemaForm fields={GUIDE} value={v} onChange={change} errors={doc.errors} idPrefix="p" />}
        {tab === 'Placement' && (doc.isNew || doc.dirty
          ? <p className="text-sm">Save this product first, then choose where it appears on the site.</p>
          : <PlacementPanel product={v} />)}
      </div>
      {!doc.isNew && v.status !== 'archived' && (
        <div className="mt-4 flex gap-2">
          {v.status === 'published' && <button className={btnSecondary} onClick={() => setConfirm('unpublish')}>Unpublish</button>}
          <button className={btnSecondary} onClick={() => setConfirm('archive')}>Archive</button>
        </div>)}
      <EditorBar status={v.status} dirty={doc.dirty} saving={doc.saving || busy} savedAt={doc.savedAt} error={doc.error} onSave={() => doc.save()}
        onPublish={v.status === 'published' ? undefined : () => lifecycle('publish')} blockedReason={first ? `Before publishing: ${first}` : undefined}
        previewHref={v.slug ? `/products/${v.id}` : undefined} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(undefined)} busy={busy} danger={confirm === 'archive'} confirmLabel={confirm === 'archive' ? 'Archive product' : 'Unpublish'}
        title={confirm === 'archive' ? `Archive ${v.name}?` : `Unpublish ${v.name}?`}
        body={confirm === 'archive' ? 'The product disappears from the site and from every placement, and cannot be bought. Nothing is deleted; orders keep their record.' : 'The product disappears from the site until you publish it again. Its placements are kept.'}
        onConfirm={() => confirm && lifecycle(confirm)} />
    </PageWrapper>
  );
}

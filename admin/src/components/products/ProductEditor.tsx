'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { AdminProduct } from '@flowtop/types';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { DraftBanner, EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { SchemaForm, missingRequired, type Field } from '@/components/ui/SchemaForm';
import { useCan } from '@/hooks/useCurrentUser';
import { useDocument } from '@/hooks/useDocument';
import { btnSecondary, cardCls } from '@/lib/ui-classes';
import { PlacementPanel } from './PlacementPanel';
import { SpecsTab, VariantsTab } from './VariantsAndSpecs';

const IDENTITY: Field[] = [
  { key: 'name', label: 'Product name', type: 'text', required: true }, { key: 'slug', label: 'Web address', type: 'text', hint: 'Lowercase letters and dashes. Filled in from the name.' },
  { key: 'sku', label: 'SKU', type: 'text', required: true }, { key: 'categoryId', label: 'Category', type: 'ref', of: 'categories', required: true },
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
  { key: 'seoCanonical', label: 'Preferred address (advanced)', type: 'text' },
];
const TABS = ['Identity', 'Commerce', 'Variants', 'Specifications', 'SEO', 'Placement'] as const;
type Tab = (typeof TABS)[number];
const FIELD_TAB: Record<string, Tab> = { ...Object.fromEntries(IDENTITY.map((f) => [f.key, 'Identity'])), ...Object.fromEntries(COMMERCE.map((f) => [f.key, 'Commerce'])), ...Object.fromEntries(SEO.map((f) => [f.key, 'SEO'])) };
const blank = (): Omit<AdminProduct, 'id'> => ({
  name: '', slug: '', sku: '', categoryId: null, shortDescription: '', fullDescription: '', price: 0, salePrice: null, taxClass: 'standard', isPurchasable: true, isAvailable: true,
  availabilityMessage: null, isFeatured: false, isNewArrival: false, isBestseller: false, status: 'draft', publishedAt: null, seoTitle: '', seoDescription: '', seoCanonical: null,
  seoShareImageId: null, modelUrl: null, videoUrl: null, createdAt: '', updatedAt: '',
});
/** Only what CreateProductDto and UpdateProductDto accept. The API refuses unknown fields, so `status`, dates and ids are never sent. */
const toBody = (p: AdminProduct) => ({
  name: p.name, sku: p.sku, slug: p.slug, categoryId: p.categoryId || undefined, shortDescription: p.shortDescription, fullDescription: p.fullDescription,
  price: p.price, salePrice: p.salePrice, isPurchasable: p.isPurchasable, isAvailable: p.isAvailable, availabilityMessage: p.availabilityMessage || null,
  seoTitle: p.seoTitle, seoDescription: p.seoDescription, seoCanonical: p.seoCanonical || null,
});
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ProductEditor({ id }: { id: string }) {
  const doc = useDocument<AdminProduct>('products', id, blank, toBody);
  const can = useCan(); // COSMETIC ONLY: hiding a button is presentation. The server checks the permission on every call.
  const canSave = doc.isNew ? can('product:create') : can('product:update');
  const [tab, setTab] = useState<Tab>('Identity');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'archive' | 'unpublish'>();
  const v = doc.value;
  if (doc.loadError) return <PageWrapper title="Product"><LoadError message={doc.loadError} onRetry={doc.reload} /></PageWrapper>;
  if (!v) return <PageWrapper title="Product"><Skeleton rows={6} /></PageWrapper>;

  const change = (k: string, x: unknown) => doc.set({ [k]: x, ...(k === 'name' && (!v.slug || v.slug === slugify(v.name)) ? { slug: slugify(String(x)) } : {}) } as Partial<AdminProduct>);
  const need = missingRequired([...IDENTITY, ...COMMERCE], { ...v, price: v.price > 0 ? v.price : null });
  const errTab = (t: Tab) => Object.keys(doc.errors).some((k) => FIELD_TAB[k] === t);

  /** Publish / unpublish / archive: save first, then the lifecycle call. A failure shows the server's reasons per field. */
  const lifecycle = async (action: 'publish' | 'unpublish' | 'archive') => {
    setBusy(true);
    try {
      const saved = doc.dirty || doc.isNew ? await doc.save() : v;
      if (!saved) return;
      await api(`/admin/products/${saved.id}/${action}`, { method: 'POST' });
      doc.reload(); // the server's status is the truth, not a guess
    } catch (e) {
      if (e instanceof ApiError) { doc.setError(e.message); doc.setErrors(e.fields); const first = Object.keys(e.fields)[0]; if (first && FIELD_TAB[first]) setTab(FIELD_TAB[first]); }
      else doc.setError('That did not work. Nothing was changed.');
    } finally { setBusy(false); setConfirm(undefined); }
  };
  const first = Object.values(need)[0];
  const seoLen = (n: number, max: number) => <span className={n > max ? 'text-error' : 'text-grey-500'}>{n}/{max}</span>;
  const canPublish = can('product:publish');
  const canArchive = can('product:archive');

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
        {tab === 'Identity' && <SchemaForm fields={IDENTITY} value={{ ...v }} onChange={change} errors={doc.errors} idPrefix="p" />}
        {tab === 'Commerce' && <SchemaForm fields={COMMERCE} value={{ ...v }} onChange={change} errors={doc.errors} idPrefix="p" />}
        {tab === 'Variants' && (doc.isNew ? <p className="text-sm">Save this product first, then add its finishes.</p> : <VariantsTab productId={v.id} canEdit={can('product:update')} />)}
        {tab === 'Specifications' && (doc.isNew ? <p className="text-sm">Save this product first, then add its specifications.</p> : <SpecsTab productId={v.id} canEdit={can('product:update')} />)}
        {tab === 'SEO' && (
          <div className="flex flex-col gap-4">
            <SchemaForm fields={SEO} value={{ ...v }} onChange={change} errors={doc.errors} idPrefix="p" />
            <p className="text-xs">Title {seoLen(v.seoTitle.length, 60)} · Description {seoLen(v.seoDescription.length, 160)}</p>
            <div className={cardCls} aria-label="How it may look on Google">
              <p className="text-sm text-info">flowtop.in › products › {v.slug || 'your-product'}</p>
              <p className="text-lg text-info">{v.seoTitle || v.name || 'Product title'}</p>
              <p className="text-sm text-grey-700">{v.seoDescription || v.shortDescription || 'Description appears here.'}</p>
            </div>
          </div>)}
        {tab === 'Placement' && (doc.isNew || doc.dirty
          ? <p className="text-sm">Save this product first, then choose where it appears on the site.</p>
          : <PlacementPanel product={v} />)}
      </div>
      {!doc.isNew && v.status !== 'archived' && (canPublish || canArchive) && (
        <div className="mt-4 flex gap-2">
          {canPublish && v.status === 'published' && <button className={btnSecondary} onClick={() => setConfirm('unpublish')}>Unpublish</button>}
          {canArchive && <button className={btnSecondary} onClick={() => setConfirm('archive')}>Archive</button>}
        </div>)}
      <EditorBar status={v.status} dirty={doc.dirty} saving={doc.saving || busy} savedAt={doc.savedAt} error={doc.error} onSave={() => doc.save()} canSave={canSave}
        onPublish={v.status === 'published' || !canPublish ? undefined : () => lifecycle('publish')} blockedReason={first ? `Before publishing: ${first}` : undefined} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(undefined)} busy={busy} danger={confirm === 'archive'} confirmLabel={confirm === 'archive' ? 'Archive product' : 'Unpublish'}
        title={confirm === 'archive' ? `Archive ${v.name}?` : `Unpublish ${v.name}?`}
        body={confirm === 'archive' ? 'The product disappears from the site and from every placement, and cannot be bought. Nothing is deleted; orders keep their record.' : 'The product disappears from the site until you publish it again. Its placements are kept.'}
        onConfirm={() => confirm && lifecycle(confirm)} />
    </PageWrapper>
  );
}

'use client';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ListScreen } from '@/components/ui/ListScreen';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { Doc, Product } from '@/types/cms';

const STATUS = [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }];

export function ProductList() {
  const missing = useSearchParams().get('missing');
  const bulk = (action: string) => (ids: string[]) => api('/admin/products/bulk', { method: 'POST', body: { ids, action } });
  return (
    <ListScreen title={missing ? `Products missing ${missing}` : 'Products'} endpoint={`/admin/products${missing ? `?missing=${missing}` : ''}`}
      newHref="/products/new" newLabel="Add product" rowHref={(d) => `/products/${d.id}`}
      emptyText="No products yet. Add your first product and choose where it appears on the site."
      filters={[{ key: 'status', label: 'Status', options: STATUS }]}
      bulk={[{ label: 'Publish selected', run: bulk('publish') }, { label: 'Move to draft', run: bulk('unpublish') }]}
      columns={[
        { key: 'name', label: 'Product' }, { key: 'sku', label: 'SKU' },
        { key: 'price', label: 'Price', render: (d: Doc) => formatPrice((d as Product).price) },
        { key: 'status', label: 'Status', render: (d: Doc) => <span className="capitalize">{String(d.status)}</span> },
      ]} />
  );
}

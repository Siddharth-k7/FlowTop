'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Select, Table } from '@flowtop/ui';
import type { MediaAsset } from '@flowtop/types';
import { ApiError } from '@/lib/api';
import { assetName, assetThumb, listMedia, type MediaTypeFilter } from '@/lib/media';
import { formatBytes, formatDate } from '@/lib/utils/formatDate';
import { UploadZone } from './UploadZone';

const TYPE_OPTIONS: { label: string; value: MediaTypeFilter }[] = [
  { label: 'All types', value: '' },
  { label: 'Images', value: 'image' },
  { label: 'PDFs', value: 'document' }, // the API filter is image | document (docs/03), not "pdf"
];

/** Search + filter + grid or list. Shared by /media (onSelect opens detail) and MediaPicker (onSelect picks). */
export function MediaBrowser({ onSelect, selectedId }: { onSelect: (a: MediaAsset) => void; selectedId?: string }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setType] = useState<MediaTypeFilter>('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<MediaAsset[]>();
  const [error, setError] = useState<string>();

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  const load = useCallback(() => {
    setError(undefined);
    listMedia(debounced, type).then(setItems).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load media.'));
  }, [debounced, type]);
  useEffect(load, [load]);

  const empty = debounced || type ? 'No files match. Try a different search.' : 'No files yet. Drag some in above to get started.';

  return (
    <div className="flex flex-col gap-4">
      <UploadZone onUploaded={(a) => setItems((l) => (l ? [a, ...l] : [a]))} />
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <Input type="search" aria-label="Search files" placeholder="Search by file name"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="md:w-48">
          <Select aria-label="File type" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value as MediaTypeFilter)} />
        </div>
        <Button variant="secondary" className="whitespace-nowrap" aria-pressed={view === 'list'} onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
          {view === 'grid' ? 'List view' : 'Grid view'}
        </Button>
      </div>
      {error ? (
        <Card role="alert"><Card.Body>
          <p className="text-sm text-error">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={load}>Try again</Button>
        </Card.Body></Card>
      ) : view === 'list' ? (
        <Table caption="Media files" loading={!items} data={items ?? []} rowKey={(a) => a.id} emptyState={empty} onRowClick={onSelect}
          columns={[
            { id: 'name', header: 'File', accessor: (a) => assetName(a) },
            { id: 'type', header: 'Type', accessor: (a) => (a.mimeType.startsWith('image/') ? 'Image' : 'PDF') },
            { id: 'size', header: 'Size', align: 'right', accessor: (a) => formatBytes(a.sizeBytes) },
            { id: 'created', header: 'Added', accessor: (a) => formatDate(a.createdAt) },
            { id: 'alt', header: 'Alt text', accessor: (a) => (a.alt ? 'Yes' : <span className="text-warning">Needs alt text</span>) },
          ]} />
      ) : !items ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-48 animate-pulse rounded-card bg-grey-200" />)}</div>
      ) : items.length === 0 ? (
        <Card><Card.Body><p className="text-center text-sm">{empty}</p></Card.Body></Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((a) => (
            <li key={a.id}>
              <button onClick={() => onSelect(a)} aria-pressed={a.id === selectedId} data-testid="media-tile"
                className={`w-full rounded-card bg-white p-4 text-left shadow-card ${a.id === selectedId ? 'ring-2 ring-purple-deep' : ''}`}>
                {a.mimeType.startsWith('image/')
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={assetThumb(a)} alt={a.alt} width={200} height={200} loading="lazy" className="aspect-square w-full rounded object-cover" />
                  : <div className="flex aspect-square w-full items-center justify-center rounded bg-grey-200 text-lg font-semibold text-grey-700">PDF</div>}
                <p className="mt-2 truncate text-sm font-medium">{assetName(a)}</p>
                <p className="text-xs text-grey-500">{formatBytes(a.sizeBytes)} · {formatDate(a.createdAt)}</p>
                {!a.alt && <p className="text-xs text-warning">Needs alt text</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

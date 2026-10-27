'use client';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { assetName, assetThumb, listMedia } from '@/lib/media';
import { formatBytes, formatDate } from '@/lib/utils/formatDate';
import { btnSecondary, cardCls, inputCls } from '@/lib/ui-classes';
import type { MediaAsset } from '@/types';
import { UploadZone } from './UploadZone';

/** Search + filter + grid. Shared by /media (onSelect opens detail) and MediaPicker (onSelect picks). */
export function MediaBrowser({ onSelect, selectedId }: { onSelect: (a: MediaAsset) => void; selectedId?: string }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setType] = useState('');
  const [items, setItems] = useState<MediaAsset[]>();
  const [error, setError] = useState<string>();

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  const load = useCallback(() => {
    setError(undefined);
    listMedia(debounced, type).then(setItems).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load media.'));
  }, [debounced, type]);
  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-4">
      <UploadZone onUploaded={(a) => setItems((l) => (l ? [a, ...l] : [a]))} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1"><span className="sr-only">Search files</span>
          <input type="search" placeholder="Search by file name" className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label><span className="sr-only">File type</span>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option><option value="image">Images</option><option value="pdf">PDFs</option>
          </select>
        </label>
      </div>
      {error ? (
        <div role="alert" className={cardCls}><p className="text-sm text-error">{error}</p><button className={`${btnSecondary} mt-3`} onClick={load}>Try again</button></div>
      ) : !items ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg bg-grey-200" />)}</div>
      ) : items.length === 0 ? (
        <p className={`${cardCls} text-center text-sm`}>{debounced || type ? 'No files match. Try a different search.' : 'No files yet. Drag some in above to get started.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((a) => (
            <li key={a.id}>
              <button onClick={() => onSelect(a)} aria-pressed={a.id === selectedId}
                className={`${cardCls} w-full text-left ${a.id === selectedId ? 'ring-2 ring-purple-deep' : ''}`}>
                {a.mimeType.startsWith('image/')
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={assetThumb(a)} alt={a.alt} width={200} height={200} loading="lazy" className="aspect-square w-full rounded object-cover" />
                  : <div className="flex aspect-square w-full items-center justify-center rounded bg-grey-200 text-lg font-semibold text-grey-700">PDF</div>}
                <p className="mt-2 truncate text-sm font-medium">{assetName(a)}</p>
                <p className="text-xs text-grey-500">{formatBytes(a.sizeBytes)}{a.createdAt && ` · ${formatDate(a.createdAt)}`}</p>
                {!a.alt && <p className="text-xs text-warning">Needs alt text</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

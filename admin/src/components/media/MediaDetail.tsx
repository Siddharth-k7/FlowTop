'use client';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { assetName, assetThumb, deleteMedia, updateAlt } from '@/lib/media';
import { formatBytes, formatDate } from '@/lib/utils/formatDate';
import { btnDanger, btnPrimary, btnSecondary, inputCls } from '@/lib/ui-classes';
import { FormField } from '@/components/FormField';
import type { MediaAsset } from '@/types';

export function MediaDetail({ asset, onClose, onChanged, onDeleted }: {
  asset: MediaAsset; onClose: () => void; onChanged: (a: MediaAsset) => void; onDeleted: (id: string) => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [status, setStatus] = useState<{ ok: boolean; msg: string }>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isImage = asset.mimeType.startsWith('image/');

  async function saveAlt() {
    setBusy(true); setStatus(undefined);
    try { onChanged(await updateAlt(asset.id, alt)); setStatus({ ok: true, msg: 'Alt text saved.' }); }
    catch (e) { setStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Could not save.' }); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setStatus(undefined);
    try { await deleteMedia(asset.id); onDeleted(asset.id); }
    catch (e) { setStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Could not delete.' }); setConfirming(false); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(asset.url); setStatus({ ok: true, msg: 'URL copied.' }); }
    catch { setStatus({ ok: false, msg: 'Could not copy. Select the URL below and copy it manually.' }); }
  }

  return (
    <aside aria-label="File details" className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="truncate text-lg font-semibold">{assetName(asset)}</h2>
        <button className="min-h-touch min-w-touch" aria-label="Close details" onClick={onClose}>✕</button>
      </div>
      {isImage && /* eslint-disable-next-line @next/next/no-img-element */
        <img src={assetThumb(asset, 'medium')} alt={asset.alt} width={400} height={400} className="w-full rounded object-cover" />}
      <p className="text-sm text-grey-700">{formatBytes(asset.sizeBytes)}{asset.createdAt && ` · ${formatDate(asset.createdAt)}`}</p>
      <FormField id="alt" label="Alt text" hint="Describe the image for people who cannot see it. Required for accessibility.">
        {(p) => <textarea {...p} rows={3} className={`${inputCls} py-2`} value={alt} onChange={(e) => setAlt(e.target.value)} />}
      </FormField>
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={saveAlt} disabled={busy || alt === asset.alt}>Save alt text</button>
        <button className={btnSecondary} onClick={copy}>Copy URL</button>
      </div>
      {status && <p role={status.ok ? 'status' : 'alert'} className={`text-sm ${status.ok ? 'text-success' : 'text-error'}`}>{status.msg}</p>}
      {confirming ? (
        <div className="rounded bg-purple-pale p-3 text-sm">
          <p className="font-medium">Delete {assetName(asset)}?</p>
          <p className="mt-1">This permanently removes the file from the library. If anything still uses it, the delete is refused and nothing changes.</p>
          <div className="mt-3 flex gap-2">
            <button className={btnDanger} onClick={remove} disabled={busy}>Delete file</button>
            <button className={btnSecondary} onClick={() => setConfirming(false)}>Keep it</button>
          </div>
        </div>
      ) : <button className={btnSecondary} onClick={() => setConfirming(true)}>Delete…</button>}
    </aside>
  );
}

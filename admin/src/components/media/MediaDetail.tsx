'use client';
import { useState } from 'react';
import { Button, Modal, Textarea } from '@flowtop/ui';
import type { MediaAsset } from '@flowtop/types';
import { ApiError } from '@/lib/api';
import { assetName, assetThumb, deleteMedia, updateAlt } from '@/lib/media';
import { formatBytes, formatDate } from '@/lib/utils/formatDate';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canSee } from '@/components/shell/nav';

export function MediaDetail({ asset, onClose, onChanged, onDeleted }: {
  asset: MediaAsset; onClose: () => void; onChanged: (a: MediaAsset) => void; onDeleted: (id: string) => void;
}) {
  const { permissions } = useCurrentUser();
  const [alt, setAlt] = useState(asset.alt);
  const [status, setStatus] = useState<{ ok: boolean; msg: string }>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isImage = asset.mimeType.startsWith('image/');
  // COSMETIC ONLY: hides Delete for roles without media:delete (product_manager). The API still returns 403.
  const canDelete = canSee(permissions, 'media:delete');
  const canEdit = canSee(permissions, 'media:write');

  async function saveAlt() {
    setBusy(true); setStatus(undefined);
    try { onChanged(await updateAlt(asset.id, alt)); setStatus({ ok: true, msg: 'Alt text saved.' }); }
    catch (e) { setStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Could not save.' }); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setStatus(undefined);
    try { await deleteMedia(asset.id); setConfirming(false); onDeleted(asset.id); }
    catch (e) { setStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Could not delete.' }); setConfirming(false); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(asset.url); setStatus({ ok: true, msg: 'URL copied.' }); }
    catch { setStatus({ ok: false, msg: 'Could not copy. Select the URL below and copy it manually.' }); }
  }

  return (
    <aside aria-label="File details" className="flex flex-col gap-4 rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="truncate text-lg font-semibold">{assetName(asset)}</h2>
        <button className="min-h-touch min-w-touch" aria-label="Close details" onClick={onClose}>✕</button>
      </div>
      {isImage && /* eslint-disable-next-line @next/next/no-img-element */
        <img src={assetThumb(asset, 'medium')} alt={asset.alt} width={400} height={400} className="w-full rounded object-cover" />}
      <p className="text-sm text-grey-700">{formatBytes(asset.sizeBytes)} · {formatDate(asset.createdAt)}</p>
      <Textarea id="alt" label="Alt text" hint="Describe the image for people who cannot see it. Required for accessibility."
        rows={3} value={alt} onChange={(e) => setAlt(e.target.value)} readOnly={!canEdit} />
      <div className="flex flex-wrap gap-2">
        {canEdit && <Button onClick={saveAlt} loading={busy && !confirming} disabled={alt === asset.alt}>Save alt text</Button>}
        <Button variant="secondary" onClick={copy}>Copy URL</Button>
        {canDelete && <Button variant="ghost" onClick={() => setConfirming(true)}>Delete…</Button>}
      </div>
      {status && <p role={status.ok ? 'status' : 'alert'} className={`text-sm ${status.ok ? 'text-success' : 'text-error'}`}>{status.msg}</p>}
      {canDelete && (
        <Modal open={confirming} onClose={() => setConfirming(false)} busy={busy} maxWidth="sm"
          title={`Delete ${assetName(asset)}?`}
          description="This permanently removes the file from the library. If anything still uses it, the delete is refused and nothing changes."
          footer={<>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>Keep it</Button>
            <Button variant="danger" onClick={remove} loading={busy}>Delete file</Button>
          </>}>
          <p className="text-sm">{asset.url}</p>
        </Modal>
      )}
    </aside>
  );
}

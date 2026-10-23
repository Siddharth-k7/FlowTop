'use client';
import { useRef, useState } from 'react';
import { uploadFile, validateFile } from '@/lib/media';
import { Button } from '@flowtop/ui';
import type { MediaAsset } from '@flowtop/types';

interface Item { key: string; name: string; pct: number; error?: string }

export function UploadZone({ onUploaded }: { onUploaded: (a: MediaAsset) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const patch = (key: string, p: Partial<Item>) => setItems((l) => l.map((i) => (i.key === key ? { ...i, ...p } : i)));

  function start(files: FileList | null) {
    Array.from(files ?? []).forEach((f) => {
      const key = `${f.name}-${f.size}-${Math.random()}`;
      const err = validateFile(f);
      setItems((l) => [...l, { key, name: f.name, pct: 0, error: err ?? undefined }]);
      if (err) return;
      uploadFile(f, (pct) => patch(key, { pct }))
        .then((a) => { patch(key, { pct: 100 }); onUploaded(a); setTimeout(() => setItems((l) => l.filter((i) => i.key !== key)), 1500); })
        .catch((e: Error) => patch(key, { error: e.message }));
    });
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); start(e.dataTransfer.files); }}
        className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-6 text-center ${over ? 'border-purple-deep bg-purple-pale' : 'border-grey-500 bg-white'}`}>
        <p className="text-sm">Drag images or PDFs here, or</p>
        <Button variant="secondary" onClick={() => input.current?.click()}>Browse files</Button>
        <p className="text-xs text-grey-500">JPG, PNG, WebP, AVIF or PDF, up to 10 MB each</p>
        <input ref={input} type="file" multiple hidden aria-label="Choose files to upload" onChange={(e) => start(e.target.files)} />
      </div>
      <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
        {items.map((i) => (
          <li key={i.key} className="rounded bg-white p-3 text-sm shadow-card">
            <div className="flex justify-between gap-2">
              <span className="truncate">{i.name}</span>
              {i.error ? (
                <button className="min-h-touch text-purple-deep underline" onClick={() => setItems((l) => l.filter((x) => x.key !== i.key))}>Dismiss</button>
              ) : <span>{i.pct}%</span>}
            </div>
            {i.error ? <p role="alert" className="text-error">{i.error}</p>
              : <progress className="h-2 w-full" value={i.pct} max={100} aria-label={`Uploading ${i.name}`} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

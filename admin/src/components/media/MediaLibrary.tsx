'use client';
import { useState } from 'react';
import type { MediaAsset } from '@/types';
import { MediaBrowser } from './MediaBrowser';
import { MediaDetail } from './MediaDetail';

export function MediaLibrary() {
  const [sel, setSel] = useState<MediaAsset>();
  // key forces the browser to reload after a change/delete so the grid never shows stale data
  const [version, setVersion] = useState(0);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_var(--panel-w)]">
      <MediaBrowser key={version} onSelect={setSel} selectedId={sel?.id} />
      {sel && (
        <MediaDetail asset={sel} onClose={() => setSel(undefined)}
          onChanged={(a) => { setSel(a); setVersion((v) => v + 1); }}
          onDeleted={() => { setSel(undefined); setVersion((v) => v + 1); }} />
      )}
    </div>
  );
}

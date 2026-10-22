'use client';
import { useEffect, useRef } from 'react';
import type { MediaAsset } from '@/types';
import { btnSecondary } from '@/lib/ui-classes';
import { MediaBrowser } from './MediaBrowser';

/** Reusable modal: product forms, section editors, collections and journal pick existing media through this. */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (a: MediaAsset) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]') ?? []).filter((e) => !e.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const f = focusable(); const first = f[0]; const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-2 md:p-6" role="dialog" aria-modal="true" aria-label="Choose media">
      <div ref={ref} className="flex max-h-full w-full max-w-dialog flex-col gap-4 overflow-y-auto rounded-lg bg-grey-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose a file</h2>
          <button className={btnSecondary} onClick={onClose}>Cancel</button>
        </div>
        <MediaBrowser onSelect={(a) => { onPick(a); onClose(); }} />
      </div>
    </div>
  );
}

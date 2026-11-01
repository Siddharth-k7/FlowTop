'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { btnDanger, btnPrimary, btnSecondary } from '@/lib/ui-classes';

/** Focus-trapped dialog. Escape closes, focus returns to whatever opened it. */
export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-2 md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={ref} className={`flex max-h-full w-full flex-col gap-4 overflow-y-auto rounded-lg bg-white p-4 ${wide ? 'max-w-dialog' : 'max-w-md'}`}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** Destructive actions say what will actually happen, never just "Are you sure?". */
export function ConfirmDialog({ open, title, body, confirmLabel, danger = true, busy, error, onConfirm, onClose }: {
  open: boolean; title: string; body: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; error?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="text-sm text-grey-700">{body}</div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button className={btnSecondary} onClick={onClose}>Keep it</button>
        <button className={danger ? btnDanger : btnPrimary} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}

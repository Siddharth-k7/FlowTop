'use client';
import type { ReactNode } from 'react';
import { Button, Modal as UiModal } from '@flowtop/ui';

/** Thin wrapper over the @flowtop/ui Modal (native <dialog>: focus trap, Escape, focus return). */
export function Modal({ open, title, onClose, children, wide, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  return <UiModal open={open} onClose={onClose} title={title} maxWidth={wide ? 'xl' : 'sm'} footer={footer}><div className="flex flex-col gap-4">{children}</div></UiModal>;
}

/** Destructive actions say what will actually happen, never just "Are you sure?". */
export function ConfirmDialog({ open, title, body, confirmLabel, danger = true, busy, error, onConfirm, onClose }: {
  open: boolean; title: string; body: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; error?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Keep it</Button><Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className="text-sm text-grey-700">{body}</div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </Modal>
  );
}

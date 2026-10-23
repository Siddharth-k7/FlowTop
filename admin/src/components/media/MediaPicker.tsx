'use client';
import { Button, Modal } from '@flowtop/ui';
import type { MediaAsset } from '@flowtop/types';
import { MediaBrowser } from './MediaBrowser';

/**
 * Reusable modal: product forms, section editors, collections and journal pick existing media through this.
 * The ui Modal is a native <dialog> (showModal): focus is contained, Escape and the backdrop close it,
 * and focus returns to the opener.
 */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (a: MediaAsset) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Choose a file" maxWidth="xl"
      footer={<Button variant="secondary" onClick={onClose}>Cancel</Button>}>
      {open && <MediaBrowser onSelect={(a) => { onPick(a); onClose(); }} />}
    </Modal>
  );
}

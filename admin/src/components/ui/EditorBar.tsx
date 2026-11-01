'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { btnPrimary, btnSecondary } from '@/lib/ui-classes';

const BADGE: Record<string, string> = { draft: 'bg-grey-200 text-ink', published: 'bg-success text-white', archived: 'bg-warning text-white' };

/** Sticky bottom bar used by every form: Save Draft, Publish, Preview, status badge, honest save state. */
export function EditorBar({ status, dirty, saving, savedAt, error, onSave, onPublish, publishLabel = 'Publish', blockedReason, previewHref, extra }: {
  status?: string; dirty: boolean; saving: boolean; savedAt?: Date; error?: string;
  onSave: () => void; onPublish?: () => void; publishLabel?: string; blockedReason?: string; previewHref?: string; extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-t border-grey-200 bg-white p-3 md:-mx-6 md:px-6">
      {status && <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${BADGE[status] ?? BADGE.draft}`}>{status}</span>}
      <p className="min-w-0 flex-1 text-sm" role="status" aria-live="polite">
        {error ? <span className="text-error">{error}</span>
          : saving ? 'Saving…' : dirty ? <span className="text-warning">Unsaved changes</span>
          : savedAt ? <span className="text-success">Saved at {savedAt.toLocaleTimeString('en-IN')}</span> : ''}
      </p>
      {extra}
      {previewHref && <Link href={previewHref} target="_blank" className={btnSecondary}>Preview</Link>}
      <button className={btnSecondary} disabled={saving || !dirty} onClick={onSave}>Save Draft</button>
      {onPublish && <button className={btnPrimary} disabled={saving || !!blockedReason} title={blockedReason} onClick={onPublish}>{publishLabel}</button>}
      {blockedReason && <p className="w-full text-right text-xs text-grey-700">{blockedReason}</p>}
    </div>
  );
}

export function DraftBanner({ onUse, onDrop }: { onUse: () => void; onDrop: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-purple-pale p-3 text-sm">
      <span className="flex-1">We found changes you had not saved from earlier. Want them back?</span>
      <button className={btnPrimary} onClick={onUse}>Restore my changes</button>
      <button className={btnSecondary} onClick={onDrop}>Discard them</button>
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return <div aria-busy="true" className="flex flex-col gap-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 animate-pulse rounded bg-grey-200" />)}</div>;
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg bg-white p-4 shadow-card">
      <p className="text-sm text-error">{message}</p>
      <button className={`${btnSecondary} mt-3`} onClick={onRetry}>Try again</button>
    </div>
  );
}

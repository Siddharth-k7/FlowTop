import React from 'react';
import { CATALOGUE_FINISHES } from '../../lib/filters';

export interface FinishStripProps {
  finishCodes: string[];
}

export function FinishStrip({ finishCodes }: FinishStripProps) {
  if (!finishCodes || finishCodes.length === 0) return null;

  // Resolve finish metadata from catalogue
  const resolvedFinishes = finishCodes.map((code) => {
    const found = CATALOGUE_FINISHES.find((f) => f.code === code);
    return {
      code,
      name: found?.name || code.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  });

  return (
    <div className="bg-surface rounded-lg p-space-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-space-4">
      <div>
        <h3 className="text-small font-medium uppercase tracking-wide text-fg mb-space-1">
          Architectural Finishes in this Series
        </h3>
        <p className="text-caption text-fg-muted">
          All pieces in this collection are surface-bonded with physical vapor deposition (PVD) or mirror chrome.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-space-3">
        {resolvedFinishes.map((f) => (
          <div
            key={f.code}
            className="inline-flex items-center gap-space-2 px-space-3 py-space-2 rounded-sm bg-surface-solid border border-border shadow-xs text-small text-fg"
          >
            <span
              className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary/40 shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium text-caption">{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

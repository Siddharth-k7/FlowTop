import React from 'react';
import { CATALOGUE_FINISHES } from '../../lib/filters';

export interface FinishStripProps {
  finishCodes: string[];
}

const FINISH_SWATCH_CLASSES: Record<string, string> = {
  chrome: 'bg-grey-200 border-grey-300',
  'brushed-gold': 'bg-warning-tint border-warning/40',
  'matte-black': 'bg-ink border-ink',
  'rose-gold': 'bg-error-tint border-error/30',
};

export function FinishStrip({ finishCodes }: FinishStripProps) {
  if (!finishCodes || finishCodes.length === 0) return null;

  // Resolve finish metadata from catalogue
  const resolvedFinishes = finishCodes.map((code) => {
    const found = CATALOGUE_FINISHES.find((f) => f.code === code);
    return {
      code,
      name: found?.name || code.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      swatchClass: FINISH_SWATCH_CLASSES[code] || 'bg-primary/20 border-primary/40',
    };
  });

  return (
    <div className="bg-surface rounded-md p-space-6 sm:p-space-7 border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-space-6">
      <div className="max-w-md">
        <h2 className="text-caption font-semibold uppercase tracking-widest text-fg mb-space-1">
          Architectural Finishes in this Series
        </h2>
        <p className="text-caption text-fg-muted font-light">
          All pieces in this collection are surface-bonded with physical vapor deposition (PVD) or mirror chrome.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-space-6 gap-y-space-3 text-caption text-fg">
        {resolvedFinishes.map((f) => (
          <div
            key={f.code}
            className="inline-flex items-center gap-space-2"
          >
            <span
              className={`w-3.5 h-3.5 rounded-pill border shadow-sm shrink-0 ${f.swatchClass}`}
              aria-hidden="true"
            />
            <span className="font-regular text-caption text-fg">{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

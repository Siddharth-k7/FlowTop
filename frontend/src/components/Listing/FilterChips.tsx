'use client';

import React from 'react';
import Link from 'next/link';
import type { FilterChip } from '../../lib/filters';

export interface FilterChipsProps {
  chips: FilterChip[];
  clearAllHref: string;
  onRemoveChip: (chip: FilterChip) => void;
  onClearAll: () => void;
}

export function FilterChips({
  chips,
  clearAllHref,
  onRemoveChip,
  onClearAll,
}: FilterChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-space-2 mb-space-4"
    >
      <span className="text-caption font-medium text-text-muted mr-space-1">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemoveChip(chip)}
          aria-label={chip.ariaLabel}
          className="inline-flex items-center gap-space-2 px-space-3 py-space-1 rounded-pill border border-border bg-surface hover:bg-surface-light text-caption font-medium text-fg transition-colors focus-ring touch-target"
        >
          <span>{chip.label}</span>
          <span
            className="w-4 h-4 rounded-pill flex items-center justify-center text-text-muted hover:text-fg text-caption font-semibold select-none"
            aria-hidden="true"
          >
            ×
          </span>
        </button>
      ))}

      <Link
        href={clearAllHref}
        onClick={(e) => {
          e.preventDefault();
          onClearAll();
        }}
        className="text-caption text-primary hover:underline font-semibold px-space-2 py-space-1 rounded-sm focus-ring ml-space-1"
      >
        Clear all
      </Link>
    </div>
  );
}

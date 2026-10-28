'use client';

import React from 'react';
import {
  ALLOWED_SORT_VALUES,
  SORT_LABELS,
  SortOption,
} from '../../lib/filters';

export interface SortSelectProps {
  currentSort: SortOption;
  onChange: (sort: SortOption) => void;
  disabled?: boolean;
}

export function SortSelect({
  currentSort,
  onChange,
  disabled = false,
}: SortSelectProps) {
  return (
    <div className="flex items-center gap-space-2">
      <label
        htmlFor="listing-sort-select"
        className="text-small font-medium text-text-muted shrink-0"
      >
        Sort by:
      </label>
      <select
        id="listing-sort-select"
        value={currentSort}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-space-3 py-space-2 rounded-sm border border-border-input bg-surface-solid text-small font-medium text-fg focus-ring touch-target transition-colors cursor-pointer"
      >
        {ALLOWED_SORT_VALUES.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

'use client';

import React from 'react';
import type { ListingParams } from '../../lib/filters';
import { PriceRangeFilter } from './PriceRangeFilter';
import { isValidHex } from '../../lib/format';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface FinishOption {
  id?: string;
  name: string;
  code: string;
  swatchHex?: string;
}

export interface FilterSidebarProps {
  categories: CategoryOption[];
  finishes: FinishOption[];
  currentParams: ListingParams;
  onFilterChange: (updates: Partial<ListingParams>) => void;
  onClearAll: () => void;
  lockCategory?: boolean;
  minBoundRupees?: number;
  maxBoundRupees?: number;
}

const FINISH_SWATCH_CLASSES: Record<string, string> = {
  chrome: 'bg-grey-200 border-grey-300',
  'brushed-gold': 'bg-warning-tint border-warning/40',
  'matte-black': 'bg-ink border-ink',
  'rose-gold': 'bg-error-tint border-error/30',
};

export function FilterSidebar({
  categories,
  finishes,
  currentParams,
  onFilterChange,
  onClearAll,
  lockCategory = false,
  minBoundRupees,
  maxBoundRupees,
}: FilterSidebarProps) {
  return (
    <div className="flex flex-col gap-space-6 bg-surface-solid rounded-md border border-border shadow-sm p-space-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-space-4">
        <h2 className="font-body font-medium text-body tracking-tight text-fg">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-caption text-primary hover:underline font-semibold focus-ring rounded-sm py-space-1 px-space-1"
        >
          Reset
        </button>
      </div>

      {/* 1. Category Filter (unless locked by category page) */}
      {!lockCategory && categories.length > 0 && (
        <fieldset className="flex flex-col gap-space-2 border-none p-0 m-0">
          <legend className="text-caption font-semibold uppercase tracking-wider text-fg mb-space-2">
            Category
          </legend>
          <div className="flex flex-col gap-space-2 max-h-56 overflow-y-auto pr-space-1">
            {/* All Categories Option */}
            <label className="flex items-center gap-space-3 text-small text-fg cursor-pointer min-h-touch py-space-1 select-none">
              <input
                type="radio"
                name="filter-category"
                checked={!currentParams.category}
                onChange={() => onFilterChange({ category: undefined })}
                className="w-4 h-4 text-primary focus-ring border-border-input"
              />
              <span>All Categories</span>
            </label>

            {categories.map((cat) => (
              <label
                key={cat.id || cat.slug}
                className="flex items-center justify-between gap-space-3 text-small text-fg cursor-pointer min-h-touch py-space-1 select-none hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-space-3">
                  <input
                    type="radio"
                    name="filter-category"
                    checked={currentParams.category === cat.slug}
                    onChange={() => onFilterChange({ category: cat.slug })}
                    className="w-4 h-4 text-primary focus-ring border-border-input"
                  />
                  <span>{cat.name}</span>
                </div>
                {cat.productCount !== undefined && (
                  <span className="text-caption text-text-muted">
                    {cat.productCount}
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* 2. Finish Swatches with Text Labels */}
      {finishes.length > 0 && (
        <fieldset className="flex flex-col gap-space-2 border-t border-border pt-space-4 border-b-0 border-l-0 border-r-0 p-0 m-0">
          <legend className="text-caption font-semibold uppercase tracking-wider text-fg mb-space-2">
            Finish & Material
          </legend>
          <div className="flex flex-col gap-space-2">
            {/* All Finishes Option */}
            <label className="flex items-center gap-space-3 text-small text-fg cursor-pointer min-h-touch py-space-1 select-none">
              <input
                type="radio"
                name="filter-finish"
                checked={!currentParams.finish}
                onChange={() => onFilterChange({ finish: undefined })}
                className="w-4 h-4 text-primary focus-ring border-border-input"
              />
              <span>All Finishes</span>
            </label>

            {finishes.map((f) => (
              <label
                key={f.code}
                className="flex items-center gap-space-3 text-small text-fg cursor-pointer min-h-touch py-space-1 select-none hover:text-primary transition-colors"
              >
                <input
                  type="radio"
                  name="filter-finish"
                  checked={currentParams.finish === f.code}
                  onChange={() => onFilterChange({ finish: f.code })}
                  className="w-4 h-4 text-primary focus-ring border-border-input"
                />
                <span
                  className={`w-3.5 h-3.5 rounded-pill border shadow-sm flex-shrink-0 ${
                    FINISH_SWATCH_CLASSES[f.code] || 'border-border bg-surface'
                  }`}
                  style={{
                    backgroundColor: isValidHex(f.swatchHex) ? f.swatchHex : undefined,
                  }}
                  aria-hidden="true"
                />
                <span>{f.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* 3. Price Range Slider */}
      <div className="flex flex-col gap-space-3 border-t border-border pt-space-4">
        <span className="text-small font-semibold text-fg">Price Range</span>
        <PriceRangeFilter
          currentMinPaise={currentParams.minPrice}
          currentMaxPaise={currentParams.maxPrice}
          minBoundRupees={minBoundRupees}
          maxBoundRupees={maxBoundRupees}
          onChange={(minPaise, maxPaise) =>
            onFilterChange({ minPrice: minPaise, maxPrice: maxPaise })
          }
        />
      </div>

      {/* 4. Availability Filter */}
      <div className="flex flex-col gap-space-3 border-t border-border pt-space-4">
        <label className="flex items-center gap-space-3 text-small text-fg cursor-pointer min-h-touch select-none">
          <input
            type="checkbox"
            checked={Boolean(currentParams.available)}
            onChange={(e) => onFilterChange({ available: e.target.checked ? true : undefined })}
            className="w-4 h-4 rounded-sm text-primary focus-ring border-border-input cursor-pointer"
          />
          <span className="font-medium">In Stock Only</span>
        </label>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCard as ProductCardType } from '../../lib/types-pending';
import {
  ListingParams,
  buildListingHref,
  getActiveFilterChips,
  isFilteredListing,
  FilterChip,
  SortOption,
} from '../../lib/filters';
import { FilterSidebar, CategoryOption, FinishOption } from './FilterSidebar';
import { FilterChips } from './FilterChips';
import { SortSelect } from './SortSelect';
import { ProductGrid } from './ProductGrid';
import { Pagination, Drawer, Button } from '@flowtop/ui';

export interface ListingShellProps {
  products: ProductCardType[];
  total: number;
  page: number;
  totalPages: number;
  basePath: string;
  currentParams: ListingParams;
  categories: CategoryOption[];
  finishes: FinishOption[];
  categoryNameMap?: Record<string, string>;
  finishNameMap?: Record<string, string>;
  lockCategory?: boolean;
  pageTitle: string;
  pageSubtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ListingShell({
  products,
  total,
  page,
  totalPages,
  basePath,
  currentParams,
  categories,
  finishes,
  categoryNameMap = {},
  finishNameMap = {},
  lockCategory = false,
  pageTitle,
  pageSubtitle,
  emptyTitle,
  emptyDescription,
}: ListingShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Active filter chips
  const chips = useMemo(
    () => getActiveFilterChips(currentParams, categoryNameMap, finishNameMap),
    [currentParams, categoryNameMap, finishNameMap]
  );

  const isFiltered = isFilteredListing(currentParams);

  // Filter change handler (resets to page 1, uses router.replace to avoid history flooding)
  const handleFilterChange = (updates: Partial<ListingParams>) => {
    startTransition(() => {
      const nextHref = buildListingHref(basePath, currentParams, {
        ...updates,
        page: 1, // changing a filter always resets to page 1
      });
      router.replace(nextHref);
    });
  };

  // Sort change handler (retains page)
  const handleSortChange = (sort: SortOption) => {
    startTransition(() => {
      const nextHref = buildListingHref(basePath, currentParams, { sort });
      router.replace(nextHref);
    });
  };

  // Remove single active chip
  const handleRemoveChip = (chip: FilterChip) => {
    if (chip.type === 'category') handleFilterChange({ category: undefined });
    else if (chip.type === 'finish') handleFilterChange({ finish: undefined });
    else if (chip.type === 'price') handleFilterChange({ minPrice: undefined, maxPrice: undefined });
    else if (chip.type === 'available') handleFilterChange({ available: undefined });
  };

  // Clear all filters
  const handleClearAll = () => {
    startTransition(() => {
      router.replace(basePath);
    });
  };

  // Result count text for live region and display
  const resultText =
    total === 0
      ? '0 products found'
      : total === 1
      ? 'Showing 1 product'
      : `Showing ${products.length} of ${total} products`;

  return (
    <div className="flex flex-col gap-space-6 w-full">
      {/* Polite Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultText}
      </div>

      {/* Header & Title Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 border-b border-border pb-space-6">
        <div>
          <h1 className="font-display font-light text-display tracking-tight text-fg mb-space-1">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-body text-fg-muted max-w-measure leading-relaxed">
              {pageSubtitle}
            </p>
          )}
        </div>

        {/* Mobile Filter Toggle & Desktop Sort */}
        <div className="flex items-center gap-space-3 shrink-0">
          {/* Mobile Drawer Trigger (44px touch target) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open filter and sorting options"
            className="lg:hidden min-h-touch min-w-touch px-space-4 py-space-2 rounded-sm border border-border-input bg-surface-solid text-fg text-small font-medium flex items-center gap-space-2 focus-ring shadow-sm"
          >
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters {chips.length > 0 ? `(${chips.length})` : ''}</span>
          </button>

          {/* Sort Select */}
          <SortSelect
            currentSort={currentParams.sort}
            onChange={handleSortChange}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      <FilterChips
        chips={chips}
        clearAllHref={basePath}
        onRemoveChip={handleRemoveChip}
        onClearAll={handleClearAll}
      />

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 items-start">
        {/* Desktop Sidebar (3 columns on 12-col grid) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-space-6">
          <FilterSidebar
            categories={categories}
            finishes={finishes}
            currentParams={currentParams}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            lockCategory={lockCategory}
          />
        </aside>

        {/* Product Grid & Pagination (9 columns on 12-col grid) */}
        <section
          aria-label="Products Catalogue"
          className="lg:col-span-9 flex flex-col gap-space-8 min-w-0"
        >
          {/* Result Count Subtext */}
          <div className="flex items-center justify-between text-small text-text-muted">
            <span>{resultText}</span>
            {isPending && (
              <span className="text-primary font-medium flex items-center gap-space-1 animate-pulse">
                Updating results...
              </span>
            )}
          </div>

          {/* Products Grid with real cards and transition skeletons */}
          <ProductGrid
            products={products}
            isLoading={isPending}
            isFiltered={isFiltered}
            onClearFilters={handleClearAll}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />

          {/* Pagination with getHref for non-JS static compatibility */}
          {totalPages > 1 && (
            <div className="pt-space-6 border-t border-border flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                getHref={(p) => buildListingHref(basePath, currentParams, { page: p })}
                onPageChange={(p) => {
                  startTransition(() => {
                    const nextHref = buildListingHref(basePath, currentParams, { page: p });
                    router.push(nextHref);
                  });
                }}
              />
            </div>
          )}
        </section>
      </div>

      {/* Mobile Drawer (Bottom sheet) */}
      <Drawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        title="Filter & Refine"
        position="bottom"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-small text-text-muted hover:text-fg font-medium py-space-2 px-space-2 rounded-sm focus-ring"
            >
              Reset All
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsMobileDrawerOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="py-space-2">
          <FilterSidebar
            categories={categories}
            finishes={finishes}
            currentParams={currentParams}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            lockCategory={lockCategory}
          />
        </div>
      </Drawer>
    </div>
  );
}

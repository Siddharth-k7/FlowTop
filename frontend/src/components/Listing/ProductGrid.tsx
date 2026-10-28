'use client';

import React from 'react';
import type { ProductCard as ProductCardType } from '../../lib/types-pending';
import { ProductCard, ProductCardSkeleton } from '../Product/ProductCard';
import { EmptyState, Button } from '@flowtop/ui';

export interface ProductGridProps {
  products: ProductCardType[];
  isLoading?: boolean;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  isLoading = false,
  isFiltered = false,
  onClearFilters,
  emptyTitle,
  emptyDescription,
}: ProductGridProps) {
  // If loading during transition, render skeleton cards matching real card shape
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading products"
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-4 md:gap-space-6"
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} style="standard" />
        ))}
      </div>
    );
  }

  // If no products match
  if (!products || products.length === 0) {
    const title =
      emptyTitle || (isFiltered ? 'No matching products found' : 'No products in this category');
    const description =
      emptyDescription ||
      (isFiltered
        ? 'Try relaxing your filter criteria or adjusting price bounds to see available brassware.'
        : 'Explore our full architectural collections or contact our showroom team for custom orders.');

    return (
      <div className="py-space-8 w-full flex items-center justify-center">
        <EmptyState
          title={title}
          description={description}
          action={
            isFiltered && onClearFilters ? (
              <Button variant="secondary" size="md" onClick={onClearFilters}>
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  // Pass API's order through untouched, with no client sorting
  return (
    <div
      aria-busy="false"
      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-4 md:gap-space-6"
    >
      {products.map((product, idx) => (
        <ProductCard
          key={product.id || product.slug}
          product={product}
          style="standard"
          priority={idx < 4}
        />
      ))}
    </div>
  );
}

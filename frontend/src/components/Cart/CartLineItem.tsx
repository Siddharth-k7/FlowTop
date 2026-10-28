'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CartItem, CartWarning } from '../../lib/types-pending';
import { formatPaise } from '../../lib/format';
import { QuantityStepper } from './QuantityStepper';

export interface CartLineItemProps {
  item: CartItem;
  isUpdating?: boolean;
  warnings?: CartWarning[];
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  className?: string;
}

export function CartLineItem({
  item,
  isUpdating = false,
  warnings,
  onUpdateQuantity,
  onRemove,
  className = '',
}: CartLineItemProps) {
  const itemWarning = warnings?.find((w) => w.itemId === item.id);

  // Contract compatibility: supports either flat or nested product properties
  const name = item.productName || item.product?.name || 'Architectural Brassware';
  const slug = item.slug || item.product?.slug || '';
  const finish = item.finishName || item.variant?.name || '';
  const imageUrl =
    item.imageUrl ||
    item.product?.primaryImage ||
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80';

  return (
    <article
      className={`relative flex gap-space-4 py-space-4 border-b border-border transition-opacity ${
        isUpdating ? 'opacity-60' : 'opacity-100'
      } ${className}`}
    >
      {/* 1. Thumbnail */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-surface shrink-0 border border-border">
        <Image
          src={imageUrl}
          alt={name}
          width={96}
          height={96}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* 2. Details Column */}
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        <div className="flex items-start justify-between gap-space-2">
          <div className="min-w-0">
            <h3 className="font-display font-medium text-small sm:text-body text-fg truncate">
              {slug ? (
                <Link
                  href={`/products/${slug}`}
                  className="hover:text-primary transition-colors focus-ring rounded-xs"
                >
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>

            {finish && (
              <p className="text-caption text-fg-muted mt-px truncate">
                Finish: <span className="text-fg font-medium">{finish}</span>
              </p>
            )}

            {item.sku && (
              <p className="text-caption text-fg-muted">
                SKU: {item.sku}
              </p>
            )}

            {itemWarning && (
              <div className="mt-space-1 inline-flex items-center gap-space-1 text-caption text-warning font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
                <span>{itemWarning.message}</span>
              </div>
            )}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            disabled={isUpdating}
            aria-label={`Remove ${name} from cart`}
            className="touch-target text-fg-muted hover:text-error focus-ring rounded-pill p-space-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 -mr-space-1"
          >
            <svg
              className="w-space-4 h-space-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* 3. Bottom Row: Stepper & Server-Calculated Line Total */}
        <div className="flex items-center justify-between gap-space-3 mt-space-3 pt-space-2">
          <QuantityStepper
            quantity={item.quantity}
            isUpdating={isUpdating}
            onChange={onUpdateQuantity}
            ariaLabel={`Quantity for ${name}`}
          />

          <div className="text-right">
            {/* NEVER calculate in JS: lineTotal is taken directly from the API response */}
            <span className="font-semibold text-small sm:text-body text-fg block">
              {formatPaise(item.lineTotal)}
            </span>
            {item.quantity > 1 && (
              <span className="text-caption text-fg-muted block">
                {formatPaise(item.unitPrice)} each
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

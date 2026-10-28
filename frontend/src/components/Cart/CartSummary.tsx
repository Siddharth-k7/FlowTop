'use client';

import React from 'react';
import Link from 'next/link';
import type { Cart } from '../../lib/types-pending';
import { formatPaise } from '../../lib/format';
import { Button } from '@flowtop/ui';

export interface CartSummaryProps {
  cart: Cart;
  onCheckout?: () => void;
  onContinueShopping?: () => void;
  continueShoppingHref?: string;
  isDrawer?: boolean;
  className?: string;
}

/**
 * CartSummary
 *
 * CRITICAL FINANCIAL ARCHITECTURE RULE:
 * Subtotal, shipping, tax and total are taken STRICTLY from the API response.
 * NEVER add anything up in JavaScript.
 *
 * Calculating money client-side leads to price drift, discount manipulation,
 * and tax discrepancies with Indian GST compliance. The server's response
 * is the single source of truth.
 */
export function CartSummary({
  cart,
  onCheckout,
  onContinueShopping,
  continueShoppingHref = '/products',
  isDrawer = false,
  className = '',
}: CartSummaryProps) {
  return (
    <div className={`flex flex-col gap-space-4 ${className}`}>
      {/* Financial Breakdown Table */}
      <div className="space-y-space-2 text-small text-fg">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-fg-muted">Subtotal</span>
          {/* Taken strictly from API */}
          <span className="font-medium text-fg">{formatPaise(cart.subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <span className="text-fg-muted">White-Glove Shipping</span>
          {/* Taken strictly from API */}
          <span className="font-medium text-fg">
            {cart.shipping === 0 ? (
              <span className="text-success font-semibold">Complimentary</span>
            ) : (
              formatPaise(cart.shipping)
            )}
          </span>
        </div>

        {/* Tax (GST) */}
        <div className="flex items-center justify-between">
          <span className="text-fg-muted">Estimated GST (18%)</span>
          {/* Taken strictly from API */}
          <span className="font-medium text-fg">{formatPaise(cart.tax)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-space-2" />

        {/* Total */}
        <div className="flex items-baseline justify-between pt-space-1">
          <span className="font-display font-medium text-body sm:text-title text-fg">Total</span>
          <div className="text-right">
            {/* Taken strictly from API */}
            <span className="font-display font-semibold text-title sm:text-headline text-primary block">
              {formatPaise(cart.total)}
            </span>
            <span className="text-caption text-fg-muted block">
              Inclusive of all taxes &amp; duties
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-space-2 pt-space-2">
        {/* Checkout Button */}
        {onCheckout ? (
          <Button
            variant="primary"
            size={isDrawer ? 'md' : 'lg'}
            onClick={onCheckout}
            className="w-full flex items-center justify-center gap-space-2 font-medium"
          >
            <span>Proceed to Checkout</span>
            <span aria-hidden="true">→</span>
          </Button>
        ) : (
          <Link href="/checkout" className="w-full block">
            <Button
              variant="primary"
              size={isDrawer ? 'md' : 'lg'}
              className="w-full flex items-center justify-center gap-space-2 font-medium"
            >
              <span>Proceed to Checkout</span>
              <span aria-hidden="true">→</span>
            </Button>
          </Link>
        )}

        {/* Continue Shopping Button */}
        {onContinueShopping ? (
          <button
            type="button"
            onClick={onContinueShopping}
            className="w-full text-center py-space-2 text-small text-fg-muted hover:text-primary transition-colors focus-ring rounded-sm font-medium"
          >
            Continue Shopping
          </button>
        ) : (
          <Link
            href={continueShoppingHref}
            className="w-full text-center py-space-2 text-small text-fg-muted hover:text-primary transition-colors focus-ring rounded-sm font-medium block"
          >
            Continue Shopping
          </Link>
        )}
      </div>

      {/* Trust & Craft Specifications (Full page layout / desktop support) */}
      {!isDrawer && (
        <div className="mt-space-6 p-space-4 rounded-md bg-surface border border-border text-caption text-fg-muted space-y-space-2">
          <div className="flex items-center gap-space-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>Cast &amp; machined in Lead-Free CuZn39Pb3 Brass</span>
          </div>
          <div className="flex items-center gap-space-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>15-Year Structural &amp; Cartridge Warranty</span>
          </div>
          <div className="flex items-center gap-space-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>Hydrostatically tested to 16 bar pressure</span>
          </div>
        </div>
      )}
    </div>
  );
}

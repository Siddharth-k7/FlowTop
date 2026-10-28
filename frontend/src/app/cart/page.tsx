'use client';

import React from 'react';
import Link from 'next/link';
import { Button, EmptyState } from '@flowtop/ui';
import {
  useCart,
  CartLineItem,
  CartWarnings,
  CartSummary,
} from '../../components/Cart';

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeItem, updatingItemId, itemCount } = useCart();

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="w-full bg-surface-muted min-h-[calc(100vh-16rem)] py-space-8 sm:py-space-12">
      <main className="max-w-container mx-auto px-space-4 sm:px-space-6 lg:px-space-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-space-6">
          <ol className="flex items-center gap-space-2 text-caption text-fg-muted">
            <li>
              <Link href="/" className="hover:text-primary transition-colors focus-ring rounded-xs">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-fg font-medium" aria-current="page">
              Shopping Cart
            </li>
          </ol>
        </nav>

        {/* Page Title & Count Badge */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-space-2 pb-space-8 border-b border-border">
          <h1 className="font-display font-light text-display sm:text-headline text-fg">
            Shopping Cart
          </h1>
          <span className="text-small text-fg-muted">
            {itemCount} {itemCount === 1 ? 'architectural fixture' : 'architectural fixtures'}
          </span>
        </div>

        {/* Content Area */}
        <div className="pt-space-8">
          {isLoading && !cart ? (
            /* Loading State */
            <div className="py-space-16 text-center text-fg-muted text-body" aria-live="polite">
              Loading your shopping cart...
            </div>
          ) : !hasItems ? (
            /* Empty State */
            <div className="py-space-12">
              <EmptyState
                title="Your shopping cart is empty"
                headingLevel="h2"
                description="Explore our precision architectural fittings and collections to begin designing your space."
                action={
                  <Link href="/products">
                    <Button variant="primary" size="lg">
                      Explore Collections
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            /* Full Page Two-Column Cart Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 lg:gap-space-12 items-start">
              {/* Left Column: Line Items (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-6">
                {/* Warnings banner (e.g. finish unavailable) */}
                <CartWarnings warnings={cart.warnings} />

                {/* Card enclosing line items */}
                <div className="bg-surface-solid rounded-lg border border-border shadow-sm px-space-6 py-space-2 divide-y divide-border">
                  <h2 className="sr-only">Items in your cart</h2>
                  {cart.items.map((item) => (
                    <CartLineItem
                      key={item.id}
                      item={item}
                      warnings={cart.warnings}
                      isUpdating={updatingItemId === item.id}
                      onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>

                {/* Back to Products Link */}
                <div className="pt-space-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-space-2 text-small text-primary hover:underline font-medium focus-ring rounded-xs"
                  >
                    <span aria-hidden="true">←</span>
                    <span>Continue shopping in catalogue</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary Card (4 Cols) */}
              <aside className="lg:col-span-4 sticky top-24">
                <div className="bg-surface-solid rounded-lg border border-border shadow-sm p-space-6">
                  <h2 className="font-display font-medium text-title text-fg mb-space-4 pb-space-3 border-b border-border">
                    Order Summary
                  </h2>

                  <CartSummary cart={cart} isDrawer={false} />
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

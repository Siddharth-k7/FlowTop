'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Drawer, EmptyState, Button } from '@flowtop/ui';
import { useCart } from './CartContext';
import { CartLineItem } from './CartLineItem';
import { CartWarnings } from './CartWarnings';
import { CartSummary } from './CartSummary';
import { analytics } from '../../lib/analytics';

export function CartDrawer() {
  const router = useRouter();
  const { cart, isOpen, closeCart, updateQuantity, removeItem, updatingItemId, itemCount } = useCart();

  const handleCheckout = () => {
    if (cart) {
      analytics.beginCheckout({
        itemCount: cart.itemCount,
        total: cart.total,
      });
    }
    closeCart();
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    closeCart();
  };

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      position="right"
      title={`Shopping Bag${itemCount > 0 ? ` (${itemCount})` : ''}`}
      footer={
        hasItems ? (
          <div className="w-full">
            <CartSummary
              cart={cart}
              isDrawer={true}
              onCheckout={handleCheckout}
              onContinueShopping={handleContinueShopping}
            />
          </div>
        ) : undefined
      }
      className="max-w-md w-full"
    >
      {/* Empty State */}
      {!hasItems ? (
        <div className="py-space-8 flex flex-col items-center justify-center h-full">
          <EmptyState
            headingLevel="h3"
            title="Your bag is empty"
            description="Explore our precision brassware collections to begin crafting your considered space."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  closeCart();
                  router.push('/products');
                }}
              >
                Explore Collections
              </Button>
            }
          />
        </div>
      ) : (
        /* Cart Contents */
        <div className="flex flex-col gap-space-4">
          {/* Warnings Banner (Unavailable products or finishes) */}
          <CartWarnings warnings={cart.warnings} />

          {/* Line Items List */}
          <div className="divide-y divide-border">
            {cart.items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                warnings={cart.warnings}
                isUpdating={updatingItemId === item.id}
                onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                onRemove={() => {
                  analytics.removeFromCart({
                    id: item.productId,
                    name: item.productName,
                    category: 'general',
                    price: item.unitPrice,
                  });
                  removeItem(item.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Cart } from '../../lib/types-pending';
import { api, ApiError } from '../../lib/api';
import { useToast } from '@flowtop/ui';

export interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  updatingItemId: string | null;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (params: { productId: string; variantId?: string; quantity: number }) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // useToast is safe inside ToastProvider (UiProvider wraps the app)
  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch {
    toast = null;
  }

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getCart();
      setCart(res.data);
    } catch (err) {
      console.error('[CartContext] Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial cart on mount (client-side only, sending credentials)
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  /**
   * CRITICAL SECURITY ARCHITECTURE RULE:
   * addToCart sends ONLY productId, variantId, quantity. NOTHING ELSE.
   * NEVER SEND A PRICE. Any client-supplied price is ignored by the server and
   * must never exist in the client payload. Prices are strictly determined server-side.
   */
  const addToCart = useCallback(
    async ({
      productId,
      variantId,
      quantity,
    }: {
      productId: string;
      variantId?: string;
      quantity: number;
    }) => {
      try {
        const res = await api.addToCart({
          productId,
          variantId,
          quantity,
        });
        setCart(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not add item to cart';
        toast?.error(message);
        throw err;
      }
    },
    [toast]
  );

  /**
   * Optimistic UI on quantity change:
   * 1. Save snapshot of current cart.
   * 2. Optimistically update line item quantity.
   * 3. Send update to API (PATCH /cart/items/:id { quantity }).
   * 4. Receive authoritative server response (subtotal, tax, shipping, lineTotal).
   * 5. If rejected, roll back to snapshot and notify user with error toast.
   */
  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) {
        return;
      }

      const previousCart = cart;
      setUpdatingItemId(itemId);

      // 1. Optimistic update
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          ),
        };
      });

      // 2. Perform API call
      try {
        const res = await api.updateCartItem(itemId, newQuantity);
        // Authoritative server state takes over
        setCart(res.data);
      } catch (err: unknown) {
        // Rollback on rejection
        setCart(previousCart);
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to update quantity. Restoring previous state.';
        toast?.error(message);
      } finally {
        setUpdatingItemId(null);
      }
    },
    [cart, toast]
  );

  /**
   * Optimistic UI on remove item:
   * 1. Save snapshot of current cart.
   * 2. Optimistically remove item from list.
   * 3. Send DELETE /cart/items/:id.
   * 4. Receive authoritative server response.
   * 5. If rejected, roll back to snapshot and show error toast.
   */
  const removeItem = useCallback(
    async (itemId: string) => {
      const previousCart = cart;
      setUpdatingItemId(itemId);

      // Optimistic remove
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
        };
      });

      try {
        const res = await api.removeCartItem(itemId);
        setCart(res.data);
        toast?.success('Item removed from cart');
      } catch (err: unknown) {
        // Rollback
        setCart(previousCart);
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to remove item. Restoring item.';
        toast?.error(message);
      } finally {
        setUpdatingItemId(null);
      }
    },
    [cart, toast]
  );

  const itemCount = useMemo(() => {
    if (!cart) return 0;
    if (typeof cart.itemCount === 'number') return cart.itemCount;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      isOpen,
      updatingItemId,
      itemCount,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateQuantity,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      isLoading,
      isOpen,
      updatingItemId,
      itemCount,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateQuantity,
      removeItem,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext);
}

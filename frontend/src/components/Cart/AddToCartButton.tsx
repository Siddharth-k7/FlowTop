'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '@flowtop/ui';
import { useCart } from './CartContext';

export interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  openDrawerOnSuccess?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * AddToCartButton
 *
 * CRITICAL SECURITY ARCHITECTURE RULE:
 * This component sends ONLY { productId, variantId, quantity } to the API.
 * It NEVER sends a unit price, discount, or calculated total.
 *
 * Sending a price from the client browser is a critical vulnerability and attack
 * vector (client tampering / price manipulation). All pricing, taxes, shipping,
 * discounts, and currency calculations are strictly authorized and computed
 * server-side by the commerce engine.
 *
 * DO NOT AT ANY POINT ADD A `price` FIELD TO THIS COMPONENT'S CALL OR PAYLOAD.
 */
export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'lg',
  children,
  openDrawerOnSuccess = true,
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const { addToCart, openCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setIsSuccess(false);

    try {
      /**
       * CRITICAL ATTACK VECTOR PREVENTION:
       * Sends productId, variantId, and quantity. NOTHING ELSE.
       * NEVER SEND A PRICE.
       */
      await addToCart({
        productId,
        variantId,
        quantity,
      });

      setIsSuccess(true);
      if (openDrawerOnSuccess) {
        openCart();
      }
      onSuccess?.();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsSuccess(false);
      }, 2400);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to add item to cart');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      loading={isLoading}
      onClick={handleClick}
      className={className}
      aria-label={isSuccess ? 'Added to bag' : undefined}
    >
      {isSuccess ? (
        <span className="inline-flex items-center gap-space-2 text-on-primary">
          <svg
            className="w-space-4 h-space-4 text-on-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Added to Bag</span>
        </span>
      ) : (
        children || 'Add to Cart'
      )}
    </Button>
  );
}

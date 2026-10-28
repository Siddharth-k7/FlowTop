'use client';

import React, { useState, useEffect } from 'react';
import { formatPaise } from '../../lib/format';
import { Button } from '@flowtop/ui';

export interface MobileStickyBarProps {
  productName: string;
  price: number;
  isPurchasable: boolean;
  isEnquiryOnly: boolean;
  whatsappHref: string;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
  mainButtonElement?: HTMLElement | null;
}

export function MobileStickyBar({
  productName,
  price,
  isPurchasable,
  isEnquiryOnly,
  whatsappHref,
  onAddToCart,
  isAddingToCart = false,
  mainButtonElement,
}: MobileStickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!mainButtonElement || typeof IntersectionObserver === 'undefined') {
      // Default to visible if no main element passed
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // When main button is in view, hide the sticky bar
          setIsVisible(!entry.isIntersecting);
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    observer.observe(mainButtonElement);
    return () => observer.disconnect();
  }, [mainButtonElement]);

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed bottom-0 left-0 right-0 z-sticky lg:hidden bg-surface-solid border-t border-border shadow-lg p-space-3 pb-[calc(env(safe-area-inset-bottom,0px)+var(--space-3))] transition-transform duration-base motion-reduce:transition-none ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between gap-space-3 max-w-lg mx-auto">
        {/* Name and Price */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-display font-medium text-small text-fg truncate">
            {productName}
          </span>
          <span className="font-semibold text-small text-primary">
            {formatPaise(price)}
          </span>
        </div>

        {/* Action Button */}
        {isEnquiryOnly ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium rounded-pill focus-ring touch-target text-caption bg-primary text-on-primary hover:bg-primary-dark px-space-4 py-space-2 gap-space-2 flex-shrink-0"
          >
            <span>WhatsApp</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <Button
            variant="primary"
            size="sm"
            loading={isAddingToCart}
            disabled={!isPurchasable}
            onClick={onAddToCart}
            className="flex-shrink-0"
          >
            <span>{isPurchasable ? 'Add to Cart' : 'Unavailable'}</span>
            <span aria-hidden="true">→</span>
          </Button>
        )}
      </div>
    </div>
  );
}

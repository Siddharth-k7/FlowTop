'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@flowtop/ui';
import type { Cart, CheckoutContact, CheckoutDelivery } from '../../lib/types-pending';
import { formatPaise } from '../../lib/format';

export interface ReviewStepProps {
  contact: CheckoutContact;
  delivery: CheckoutDelivery;
  cart: Cart;
  isSubmitting?: boolean;
  onEditContact: () => void;
  onEditDelivery: () => void;
  onPay: () => void;
  className?: string;
}

export function ReviewStep({
  contact,
  delivery,
  cart,
  isSubmitting = false,
  onEditContact,
  onEditDelivery,
  onPay,
  className = '',
}: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setTermsError('Please agree to the Terms of Service & Warranty Policy to proceed with payment');
      return;
    }
    setTermsError(null);
    onPay();
  };

  return (
    <div className={`space-y-space-6 ${className}`}>
      <div>
        <h2 className="font-display font-medium text-title text-fg">Review &amp; Confirm</h2>
        <p className="text-small text-fg-muted mt-space-1">
          Please review your contact, delivery address, and cart specifications before proceeding to the
          secure payment gateway.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
        {/* Contact Summary */}
        <div className="p-space-4 rounded-md border border-border bg-surface-solid flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-2">
              <span className="text-caption uppercase tracking-wider font-semibold text-fg-muted">
                1. Contact Details
              </span>
              <button
                type="button"
                onClick={onEditContact}
                disabled={isSubmitting}
                className="text-caption font-semibold text-primary hover:underline focus-ring rounded-xs"
              >
                Edit
              </button>
            </div>
            <p className="font-medium text-body text-fg">{contact.name}</p>
            <p className="text-small text-fg-muted mt-space-0.5">{contact.email}</p>
            <p className="text-small text-fg-muted">{contact.phone}</p>
          </div>
        </div>

        {/* Delivery Summary */}
        <div className="p-space-4 rounded-md border border-border bg-surface-solid flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-2">
              <span className="text-caption uppercase tracking-wider font-semibold text-fg-muted">
                2. Delivery Address
              </span>
              <button
                type="button"
                onClick={onEditDelivery}
                disabled={isSubmitting}
                className="text-caption font-semibold text-primary hover:underline focus-ring rounded-xs"
              >
                Edit
              </button>
            </div>
            <p className="font-medium text-body text-fg">{delivery.addressLine1}</p>
            {delivery.addressLine2 && (
              <p className="text-small text-fg-muted">{delivery.addressLine2}</p>
            )}
            <p className="text-small text-fg-muted">
              {delivery.city}, {delivery.state} – <span className="font-mono">{delivery.pin}</span>
            </p>
            {delivery.landmark && (
              <p className="text-caption text-fg-muted mt-space-1">Landmark: {delivery.landmark}</p>
            )}
            {delivery.notes && (
              <p className="text-caption text-fg-muted italic mt-space-0.5">Notes: {delivery.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Overview */}
      <div className="rounded-md border border-border bg-surface-solid p-space-4">
        <h3 className="font-display font-medium text-small text-fg mb-space-3 uppercase tracking-wider">
          Items in this order ({cart.items.length})
        </h3>
        <div className="divide-y divide-border">
          {cart.items.map((item) => {
            const imageUrl =
              item.imageUrl ||
              item.product?.primaryImage ||
              'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80';
            const name = item.productName || item.product?.name || 'Architectural Brassware';
            const finish = item.finishName || item.variant?.name || '';

            return (
              <div key={item.id} className="py-space-3 flex items-center gap-space-4">
                <div className="relative w-14 h-14 rounded-sm overflow-hidden bg-surface shrink-0 border border-border">
                  <Image src={imageUrl} alt={name} width={56} height={56} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-small text-fg truncate">{name}</p>
                  {finish && <p className="text-caption text-fg-muted truncate">{finish}</p>}
                  <p className="text-caption text-fg-muted">Qty: {item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-medium text-small text-fg">{formatPaise(item.lineTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terms and Conditions Agreement */}
      <div className="pt-space-2">
        <label htmlFor="terms-agreement" className="flex items-start gap-space-3 cursor-pointer group">
          <input
            id="terms-agreement"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (termsError) setTermsError(null);
            }}
            aria-invalid={termsError ? 'true' : 'false'}
            aria-describedby={termsError ? 'terms-error' : undefined}
            disabled={isSubmitting}
            className="mt-space-1 w-space-4 h-space-4 rounded-xs border-border-input text-primary focus:ring-primary cursor-pointer"
          />
          <span className="text-small text-fg leading-relaxed">
            I agree to Flowtop’s Terms of Service and acknowledge the 15-Year Structural Warranty,
            return guidelines, and white-glove delivery inspection protocol.
          </span>
        </label>
        {termsError && (
          <p id="terms-error" className="text-caption text-error mt-space-1.5" role="alert">
            {termsError}
          </p>
        )}
      </div>

      {/* Pay CTA */}
      <div className="pt-space-4 flex flex-col sm:flex-row items-center justify-between gap-space-4 border-t border-border">
        <button
          type="button"
          onClick={onEditDelivery}
          disabled={isSubmitting}
          className="text-small font-medium text-fg-muted hover:text-primary transition-colors focus-ring rounded-sm py-space-2"
        >
          ← Back to Delivery
        </button>

        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          onClick={handlePayClick}
          className="w-full sm:w-auto px-space-10 font-semibold"
        >
          <span>Pay {formatPaise(cart.total)}</span>
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}

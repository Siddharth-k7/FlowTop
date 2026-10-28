'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@flowtop/ui';
import type { OrderDetailResponse } from '../../lib/types-pending';
import { formatPaise } from '../../lib/format';

export interface ConfirmationViewProps {
  order: OrderDetailResponse;
  className?: string;
}

export function ConfirmationView({ order, className = '' }: ConfirmationViewProps) {
  const whatsappMessage = `Hi Flowtop, I have an enquiry regarding my confirmed order ${order.reference}.`;
  const whatsappHref = `https://wa.me/919876543210?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className={`space-y-space-8 max-w-3xl mx-auto ${className}`}>
      {/* Header Banner */}
      <div className="p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm text-center space-y-space-3">
        <div className="w-space-12 h-space-12 rounded-pill bg-success-tint text-success flex items-center justify-center mx-auto mb-space-2">
          <svg className="w-space-6 h-space-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="text-caption uppercase tracking-widest font-semibold text-success block">
          Payment Confirmed
        </span>

        <h1 className="font-display font-light text-display text-fg">
          Thank you, {order.customerName.split(' ')[0]}
        </h1>

        <p className="text-body text-fg-muted max-w-md mx-auto">
          Your order reference is{' '}
          <span className="font-mono font-semibold text-fg tracking-wide select-all">
            {order.reference}
          </span>
        </p>

        <p className="text-small text-fg-muted">
          A receipt and warranty documentation have been emailed to{' '}
          <span className="font-medium text-fg">{order.customerEmail}</span>.
        </p>
      </div>

      {/* What Happens Next Card */}
      <div className="p-space-6 rounded-lg border border-border bg-surface-solid shadow-sm space-y-space-4">
        <h2 className="font-display font-medium text-title text-fg">What happens next</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4 text-small">
          <div className="flex flex-col gap-space-1">
            <span className="text-caption font-semibold text-primary uppercase tracking-wider">
              1. Inspection
            </span>
            <p className="text-fg font-medium">Hydrostatic QC Testing</p>
            <p className="text-caption text-fg-muted">
              Every fixture is hydrostatically pressure tested to 16 bar and hand-polished before crating.
            </p>
          </div>

          <div className="flex flex-col gap-space-1">
            <span className="text-caption font-semibold text-primary uppercase tracking-wider">
              2. Logistics
            </span>
            <p className="text-fg font-medium">Foam-Cradled Dispatch</p>
            <p className="text-caption text-fg-muted">
              Ships within 2-3 business days. Tracking updates sent via SMS to {order.customerPhone}.
            </p>
          </div>

          <div className="flex flex-col gap-space-1">
            <span className="text-caption font-semibold text-primary uppercase tracking-wider">
              3. Protection
            </span>
            <p className="text-fg font-medium">15-Year Warranty</p>
            <p className="text-caption text-fg-muted">
              Full structural brass and Sedal cartridge coverage registered to your order reference.
            </p>
          </div>
        </div>
      </div>

      {/* Order Details & Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
        {/* Delivery Address Card */}
        <div className="p-space-6 rounded-lg border border-border bg-surface-solid shadow-sm space-y-space-2">
          <h3 className="font-display font-medium text-small text-fg uppercase tracking-wider mb-space-3">
            Delivery Destination
          </h3>
          <p className="font-medium text-body text-fg">{order.customerName}</p>
          <p className="text-small text-fg-muted">{order.deliveryAddressLine1}</p>
          {order.deliveryAddressLine2 && (
            <p className="text-small text-fg-muted">{order.deliveryAddressLine2}</p>
          )}
          <p className="text-small text-fg-muted">
            {order.deliveryCity}, {order.deliveryState} – <span className="font-mono">{order.deliveryPin}</span>
          </p>
          {order.deliveryLandmark && (
            <p className="text-caption text-fg-muted mt-space-1">Landmark: {order.deliveryLandmark}</p>
          )}
          <p className="text-caption text-fg-muted">Contact: {order.customerPhone}</p>
        </div>

        {/* Order Totals Card */}
        <div className="p-space-6 rounded-lg border border-border bg-surface-solid shadow-sm space-y-space-2 text-small">
          <h3 className="font-display font-medium text-small text-fg uppercase tracking-wider mb-space-3">
            Payment Summary
          </h3>
          <div className="flex justify-between text-fg-muted">
            <span>Subtotal</span>
            <span>{formatPaise(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-fg-muted">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Complimentary' : formatPaise(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-fg-muted">
            <span>Estimated GST</span>
            <span>{formatPaise(order.tax)}</span>
          </div>
          <div className="border-t border-border pt-space-2 flex justify-between font-semibold text-body text-fg">
            <span>Total Paid</span>
            <span className="text-primary font-display">{formatPaise(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="p-space-6 rounded-lg border border-border bg-surface-solid shadow-sm">
        <h3 className="font-display font-medium text-small text-fg uppercase tracking-wider mb-space-4">
          Ordered Fixtures ({order.items.length})
        </h3>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="py-space-3 flex items-center gap-space-4">
              <div className="relative w-14 h-14 rounded-sm overflow-hidden bg-surface shrink-0 border border-border">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.productName} width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-small text-fg truncate">{item.productName}</p>
                {item.finishName && <p className="text-caption text-fg-muted truncate">{item.finishName}</p>}
                <p className="text-caption text-fg-muted">Qty: {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-medium text-small text-fg">{formatPaise(item.lineTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Concierge & Support Footer */}
      <div className="p-space-6 rounded-lg border border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-space-4">
        <div>
          <p className="text-small font-medium text-fg">Have an architectural or installation query?</p>
          <p className="text-caption text-fg-muted">Our technical team is available on WhatsApp Mon–Sat, 9am–7pm.</p>
        </div>

        <div className="flex items-center gap-space-3 shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-space-2 px-space-5 py-space-2.5 rounded-pill bg-primary text-on-primary text-small font-medium hover:bg-primary-dark transition-colors focus-ring"
          >
            <span>Message on WhatsApp</span>
            <span aria-hidden="true">→</span>
          </a>

          <Link href="/">
            <Button variant="secondary" size="md">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

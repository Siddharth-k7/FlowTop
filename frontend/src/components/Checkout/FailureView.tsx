'use client';

import React from 'react';
import { Button } from '@flowtop/ui';

export interface FailureViewProps {
  reason?: string;
  reference?: string;
  onTryAgain: () => void;
  className?: string;
}

export function FailureView({
  reason = 'The payment authorization could not be completed by your banking gateway.',
  reference,
  onTryAgain,
  className = '',
}: FailureViewProps) {
  const whatsappText = `Hi Flowtop Support, my payment failed${
    reference ? ` for order reference ${reference}` : ''
  }. Please assist.`;
  const whatsappHref = `https://wa.me/919876543210?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div
      className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-lg mx-auto text-center space-y-space-6 ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className="w-space-12 h-space-12 rounded-pill bg-error-tint text-error flex items-center justify-center mx-auto">
        <svg className="w-space-6 h-space-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div className="space-y-space-2">
        <span className="text-caption uppercase tracking-widest font-semibold text-error block">
          Payment Incomplete
        </span>
        <h1 className="font-display font-light text-headline text-fg">Transaction Unsuccessful</h1>
        <p className="text-small text-fg-muted leading-relaxed max-w-md mx-auto">{reason}</p>
      </div>

      {/* Reassurance Banner */}
      <div className="p-space-4 rounded-md bg-surface border border-border text-small text-fg space-y-space-1 text-left">
        <p className="font-semibold text-fg">Your account has not been charged.</p>
        <p className="text-caption text-fg-muted">
          If any funds were provisionally held by your issuing bank, they will automatically be released back to
          your account according to your bank’s standard timeline.
        </p>
      </div>

      {reference && (
        <p className="text-caption text-fg-muted">
          Order reference: <span className="font-mono font-medium text-fg">{reference}</span>
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-space-2 flex flex-col sm:flex-row items-center justify-center gap-space-3">
        <Button variant="primary" size="lg" onClick={onTryAgain} className="w-full sm:w-auto font-medium">
          Try Payment Again
        </Button>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center px-space-6 py-space-3 rounded-pill border border-border text-small font-medium text-fg hover:bg-surface focus-ring transition-colors"
        >
          Contact Support on WhatsApp
        </a>
      </div>
    </div>
  );
}

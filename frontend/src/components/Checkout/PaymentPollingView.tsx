'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { Button, Spinner } from '@flowtop/ui';

export interface PaymentPollingViewProps {
  reference: string;
  onPaid: () => void;
  onFailed: (reason?: string) => void;
  className?: string;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15; // 30 seconds total

/**
 * PaymentPollingView
 *
 * CRITICAL SECURITY ARCHITECTURE RULE:
 * NEVER read payment success from URL query parameters (e.g. ?status=success or ?payment_id=...).
 * Anyone can type that URL. The redirect proves nothing.
 *
 * An order is ONLY considered paid when the verified webhook has run on the server
 * and GET /orders/:reference/status confirms { paymentStatus: 'paid' }.
 */
export function PaymentPollingView({
  reference,
  onPaid,
  onFailed,
  className = '',
}: PaymentPollingViewProps) {
  const attemptsRef = useRef(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async () => {
    try {
      const res = await api.getOrderStatus(reference);
      const status = res.data.paymentStatus;

      if (status === 'paid') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        onPaid();
        return;
      }

      if (status === 'failed') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        onFailed('Payment authorization was declined or cancelled by the gateway.');
        return;
      }
    } catch (err: unknown) {
      console.warn('[PaymentPollingView] Polling check failed, retrying...', err);
    }

    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setIsTimedOut(true);
    }
  };

  useEffect(() => {
    // Immediate initial check
    checkStatus();

    // Regular polling interval
    pollTimerRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const handleRetryPoll = () => {
    setIsTimedOut(false);
    attemptsRef.current = 0;
    checkStatus();
    pollTimerRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
  };

  const whatsappText = `Hi Flowtop Support, I am checking the status of my order ${reference}.`;
  const whatsappHref = `https://wa.me/919876543210?text=${encodeURIComponent(whatsappText)}`;

  if (isTimedOut) {
    return (
      <div
        className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-lg mx-auto text-center space-y-space-4 ${className}`}
        role="status"
      >
        <div className="w-space-10 h-space-10 rounded-pill bg-warning-tint flex items-center justify-center mx-auto text-warning">
          <svg className="w-space-6 h-space-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="font-display font-medium text-title text-fg">
          We are still checking with the bank
        </h1>

        <p className="text-small text-fg-muted leading-relaxed">
          Your banking gateway is taking slightly longer than usual to confirm the transaction. Your order reference
          is <span className="font-mono font-semibold text-fg">{reference}</span>.
        </p>

        <p className="text-caption text-fg-muted bg-surface p-space-3 rounded-sm border border-border">
          If your account was debited, your order will confirm automatically once the bank releases the
          clearance. You will receive an SMS and email notification.
        </p>

        <div className="pt-space-2 flex flex-col sm:flex-row items-center justify-center gap-space-3">
          <Button variant="primary" size="md" onClick={handleRetryPoll}>
            Check Status Again
          </Button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-space-4 py-space-2 rounded-pill border border-border text-small font-medium text-fg hover:bg-surface focus-ring transition-colors"
          >
            Contact Support on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-space-10 rounded-lg border border-border bg-surface-solid shadow-sm max-w-lg mx-auto text-center space-y-space-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>

      <div className="space-y-space-2">
        <h1 className="font-display font-light text-headline text-fg">Confirming your payment</h1>
        <p className="text-small text-fg-muted leading-relaxed">
          Verifying your transaction with the banking gateway for order{' '}
          <span className="font-mono font-semibold text-fg">{reference}</span>.
        </p>
      </div>

      <div className="p-space-3 rounded-sm bg-surface border border-border text-caption text-fg-muted">
        Please do not refresh or close this window. This usually takes just a few seconds.
      </div>
    </div>
  );
}

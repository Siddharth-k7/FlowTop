'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@flowtop/ui';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    try {
      const consent = window.localStorage.getItem('flowtop_cookie_consent');
      if (!consent) {
        // Small delay to prevent layout flicker on initial paint
        timer = setTimeout(() => setVisible(true), 600);
      }
    } catch {
      // Ignore security errors in sandboxed iframes
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleAccept = () => {
    try {
      window.localStorage.setItem('flowtop_cookie_consent', 'accepted');
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      window.localStorage.setItem('flowtop_cookie_consent', 'declined');
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      className="fixed bottom-0 inset-x-0 z-modal p-space-3 sm:p-space-4 animate-in fade-in duration-300 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto bg-surface-solid border border-border rounded-lg shadow-xl p-space-5 md:p-space-6 pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-4">
        <div className="flex-1 pr-space-2">
          <div className="flex items-center gap-space-2 mb-space-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-deep" aria-hidden="true" />
            <h2 className="text-small font-semibold text-fg tracking-tight uppercase tracking-wider">
              Privacy &amp; Cookie Consent (India DPDP Act 2023)
            </h2>
          </div>
          <p className="text-small text-fg-muted leading-relaxed">
            Flowtop uses essential cookies to manage your checkout session and anonymous first-party telemetry to refine
            architectural browsing. We never sell your data or deploy third-party advertising trackers.{' '}
            <Link
              href="/privacy"
              className="text-purple-deep hover:underline font-medium focus-ring rounded-xs"
            >
              Read our Privacy Policy &rarr;
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={handleDecline}
            className="flex-1 sm:flex-initial text-small"
            aria-label="Accept essential cookies only and decline analytics telemetry"
          >
            Essential Only
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            className="flex-1 sm:flex-initial text-small"
            aria-label="Accept all cookies and analytics telemetry"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

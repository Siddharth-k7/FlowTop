'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@flowtop/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service without exposing raw internals to the user UI
    // In production, this reports to Sentry or the error logging pipeline
    console.error('Handled application error digest:', error.digest);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center py-space-8 px-space-4">
      <div className="max-w-lg w-full mx-auto flex flex-col items-center text-center gap-space-6 bg-surface-solid p-space-6 md:p-space-8 rounded-md border border-border shadow-sm">
        {/* Calm Error Indicator */}
        <div className="w-space-7 h-space-7 rounded-pill bg-error-tint text-error flex items-center justify-center font-semibold text-title">
          !
        </div>

        <div className="flex flex-col gap-space-2">
          <h1 className="text-headline font-display font-semibold text-text-primary tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-body text-text-muted leading-relaxed">
            We were unable to complete your request. Our technical team has been notified.
            Please try reloading the page, or return to our homepage.
          </p>
        </div>

        {/* Retry and Home buttons - Note: zero raw error text displayed */}
        <div className="flex flex-wrap items-center justify-center gap-space-3 pt-space-2">
          <Button variant="primary" onClick={() => reset()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary">Return to Homepage</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

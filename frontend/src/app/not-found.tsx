import React from 'react';
import Link from 'next/link';
import { Button } from '@flowtop/ui';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-space-8 px-space-4">
      <div className="max-w-xl w-full mx-auto flex flex-col items-center text-center gap-space-6 bg-surface-solid p-space-6 md:p-space-8 rounded-md border border-border shadow-sm">
        {/* Architectural indicator */}
        <div className="w-space-7 h-space-7 rounded-pill bg-purple-pale text-purple-deep flex items-center justify-center font-semibold text-title">
          404
        </div>

        <div className="flex flex-col gap-space-2">
          <h1 className="text-headline font-display font-semibold text-text-primary tracking-tight">
            Page or Fitting Not Found
          </h1>
          <p className="text-body text-text-muted leading-relaxed">
            The collection, specification sheet, or page you requested has been relocated or is no
            longer active in our live catalogue.
          </p>
        </div>

        {/* Helpful next steps */}
        <div className="w-full bg-surface p-space-4 rounded-sm border border-border flex flex-col gap-space-3 text-left">
          <span className="text-caption font-semibold uppercase tracking-tight text-text-primary">
            Recommended Next Steps
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2 text-small">
            <Link
              href="/products"
              className="p-space-2 rounded-sm bg-surface-solid border border-border hover:border-primary hover:text-primary transition-colors focus-ring"
            >
              Browse All Products &rarr;
            </Link>
            <Link
              href="/collections"
              className="p-space-2 rounded-sm bg-surface-solid border border-border hover:border-primary hover:text-primary transition-colors focus-ring"
            >
              Explore Collections &rarr;
            </Link>
            <Link
              href="/trade"
              className="p-space-2 rounded-sm bg-surface-solid border border-border hover:border-primary hover:text-primary transition-colors focus-ring"
            >
              Architect & Trade Portal &rarr;
            </Link>
            <Link
              href="/contact"
              className="p-space-2 rounded-sm bg-surface-solid border border-border hover:border-primary hover:text-primary transition-colors focus-ring"
            >
              Contact Studio Support &rarr;
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-space-3 pt-space-2">
          <Link href="/">
            <Button variant="primary">Return to Homepage</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary">Browse Catalogue</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

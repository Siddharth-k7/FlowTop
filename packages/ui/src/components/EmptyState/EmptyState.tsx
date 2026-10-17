'use client';

import React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title, description, icon, action, secondaryAction, className = '', ...props }, ref) => {
    const defaultIcon = (
      <svg
        className="w-space-6 h-space-6 text-purple-deep"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    );

    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center text-center p-space-8 rounded-md border border-dashed border-border-strong bg-surface-solid/50 max-w-lg mx-auto w-full ${className}`}
        {...props}
      >
        <div
          className="w-space-8 h-space-8 rounded-pill bg-purple-pale flex items-center justify-center mb-space-4 shrink-0"
          aria-hidden="true"
        >
          {icon || defaultIcon}
        </div>

        <h3 className="text-title font-medium text-primary">{title}</h3>

        <div className="text-small text-muted mt-space-2 max-w-sm">
          {description}
        </div>

        {(action || secondaryAction) && (
          <div className="mt-space-5 flex items-center justify-center gap-space-3 flex-wrap">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

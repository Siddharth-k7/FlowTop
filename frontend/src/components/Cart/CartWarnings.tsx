'use client';

import React from 'react';
import type { CartWarning } from '../../lib/types-pending';

export interface CartWarningsProps {
  warnings?: CartWarning[];
  className?: string;
}

export function CartWarnings({ warnings, className = '' }: CartWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div
      role="alert"
      className={`p-space-3 rounded-md bg-warning-tint/40 border border-warning text-fg flex flex-col gap-space-2 ${className}`}
    >
      <div className="flex items-center gap-space-2 text-warning font-semibold text-small">
        <svg
          className="w-space-5 h-space-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>Important availability notices:</span>
      </div>

      <ul className="space-y-space-1 pl-space-6 list-disc text-small text-fg">
        {warnings.map((w, idx) => (
          <li key={`${w.itemId || idx}-${w.code}`}>
            <span>{w.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

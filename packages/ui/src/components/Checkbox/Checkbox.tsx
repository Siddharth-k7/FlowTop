'use client';

import React, { useEffect, useRef, useId } from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id: explicitId,
      label,
      hint,
      error,
      indeterminate = false,
      checked = false,
      disabled = false,
      className = '',
      onChange,
      'aria-describedby': explicitDescribedBy,
      ...props
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const internalRef = useRef<HTMLInputElement | null>(null);

    const setRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      explicitDescribedBy || [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-space-1 ${className}`}>
        <label
          htmlFor={id}
          className={[
            'inline-flex items-start gap-space-3 cursor-pointer select-none text-small touch-target py-space-1',
            disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-space-1">
            <input
              ref={setRef}
              id={id}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              aria-checked={indeterminate ? 'mixed' : checked}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              className="sr-only peer"
              {...props}
            />

            {/* Custom box */}
            <div
              className={[
                'w-space-5 h-space-5 rounded-sm border transition-colors flex items-center justify-center focus-ring peer-focus-visible:outline-2 peer-focus-visible:outline-focus-ring',
                error
                  ? 'border-error'
                  : 'border-border-input peer-hover:border-border-strong',
                checked || indeterminate
                  ? 'bg-purple-deep border-purple-deep text-white'
                  : 'bg-surface-solid',
                disabled ? 'bg-surface border-border' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {indeterminate ? (
                // Indeterminate minus mark
                <svg
                  className="w-space-3 h-space-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              ) : checked ? (
                // Checkmark
                <svg
                  className="w-space-3.5 h-space-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
            </div>
          </div>

          {label && (
            <div className="flex flex-col">
              <span className="text-fg font-medium">{label}</span>
              {hint && !error && (
                <span id={hintId} className="text-caption text-fg-muted">
                  {hint}
                </span>
              )}
            </div>
          )}
        </label>

        {error && (
          <p id={errorId} role="alert" className="text-caption text-error font-medium pl-space-7">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

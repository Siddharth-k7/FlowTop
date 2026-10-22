'use client';

import React, { useState, useId } from 'react';
import { Field, getFieldDescribedBy } from '../Field';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: explicitId,
      label,
      hint,
      error,
      type = 'text',
      className = '',
      containerClassName = '',
      leftIcon,
      rightIcon,
      disabled,
      required,
      'aria-describedby': explicitDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const isPassword = type === 'password';
    const isSearch = type === 'search';
    const [showPassword, setShowPassword] = useState(false);

    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const computedDescribedBy =
      explicitDescribedBy || getFieldDescribedBy(id, hint, error);

    const inputElement = (
      <div className={`relative flex items-center w-full ${containerClassName}`}>
        {/* Left icon or Search icon */}
        {leftIcon ? (
          <span className="absolute left-space-3 text-fg-muted pointer-events-none inline-flex items-center">
            {leftIcon}
          </span>
        ) : isSearch ? (
          <span
            className="absolute left-space-3 text-fg-muted pointer-events-none inline-flex items-center"
            aria-hidden="true"
          >
            <svg
              className="w-space-4 h-space-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          type={computedType}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={computedDescribedBy}
          className={[
            'w-full min-h-touch px-space-3 py-space-2 text-small text-fg bg-surface-solid rounded-sm border focus-ring transition-colors placeholder:text-fg-muted',
            error ? 'border-error' : 'border-border-input hover:border-border-strong',
            leftIcon || isSearch ? 'pl-space-7' : '',
            rightIcon || isPassword ? 'pr-space-7' : '',
            disabled ? 'opacity-50 cursor-not-allowed bg-surface' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {/* Password toggle button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-controls={id}
            tabIndex={disabled ? -1 : 0}
            className="absolute right-0 top-0 bottom-0 px-space-3 text-fg-muted hover:text-primary focus-ring touch-target flex items-center justify-center rounded-sm"
          >
            {showPassword ? (
              <svg
                className="w-space-4 h-space-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              <svg
                className="w-space-4 h-space-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Custom right icon if not password */}
        {rightIcon && !isPassword && (
          <span className="absolute right-space-3 text-fg-muted pointer-events-none inline-flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    );

    if (label || hint || error) {
      return (
        <Field id={id} label={label} hint={hint} error={error} required={required}>
          {inputElement}
        </Field>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

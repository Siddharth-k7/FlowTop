'use client';

import React, { useId } from 'react';
import { Field, getFieldDescribedBy } from '../Field';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  options?: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id: explicitId,
      label,
      hint,
      error,
      options,
      className = '',
      containerClassName = '',
      disabled,
      required,
      children,
      'aria-describedby': explicitDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const computedDescribedBy =
      explicitDescribedBy || getFieldDescribedBy(id, hint, error);

    const selectElement = (
      <div className={`relative flex items-center w-full ${containerClassName}`}>
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={computedDescribedBy}
          className={[
            'w-full min-h-touch pl-space-3 pr-space-7 py-space-2 text-small text-fg bg-surface-solid rounded-sm border appearance-none focus-ring transition-colors cursor-pointer select-none',
            error ? 'border-error' : 'border-border-input hover:border-border-strong',
            disabled ? 'opacity-50 cursor-not-allowed bg-surface' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom chevron dropdown icon */}
        <span
          className="absolute right-space-3 pointer-events-none text-fg-muted inline-flex items-center"
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>
    );

    if (label || hint || error) {
      return (
        <Field id={id} label={label} hint={hint} error={error} required={required}>
          {selectElement}
        </Field>
      );
    }

    return selectElement;
  }
);

Select.displayName = 'Select';

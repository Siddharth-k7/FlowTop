'use client';

import React, { useId, useState } from 'react';
import { Field, getFieldDescribedBy } from '../Field';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id: explicitId,
      label,
      hint,
      error,
      showCount = false,
      maxLength,
      className = '',
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      rows = 4,
      'aria-describedby': explicitDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const [internalLength, setInternalLength] = useState<number>(() => {
      if (typeof value === 'string') return value.length;
      if (typeof defaultValue === 'string') return defaultValue.length;
      return 0;
    });

    const currentLength =
      typeof value === 'string' ? value.length : internalLength;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalLength(e.target.value.length);
      onChange?.(e);
    };

    const countId = `${id}-count`;
    let computedDescribedBy =
      explicitDescribedBy || getFieldDescribedBy(id, hint, error);
    if (showCount && maxLength) {
      computedDescribedBy = computedDescribedBy
        ? `${computedDescribedBy} ${countId}`
        : countId;
    }

    const isNearLimit = maxLength && currentLength >= maxLength * 0.9;
    const isOverLimit = maxLength && currentLength > maxLength;

    const textareaElement = (
      <div className="relative flex flex-col w-full">
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          aria-invalid={Boolean(error) || Boolean(isOverLimit)}
          aria-describedby={computedDescribedBy}
          className={[
            'w-full p-space-3 text-small text-primary bg-surface-solid rounded-sm border focus-ring transition-colors placeholder:text-muted resize-y min-h-[5rem]',
            error || isOverLimit
              ? 'border-error'
              : 'border-border-input hover:border-border-strong',
            disabled ? 'opacity-50 cursor-not-allowed bg-surface' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {showCount && maxLength && (
          <div
            id={countId}
            aria-live="polite"
            className={`mt-space-1 text-caption text-right select-none ${
              isOverLimit
                ? 'text-error font-semibold'
                : isNearLimit
                ? 'text-warning font-medium'
                : 'text-muted'
            }`}
          >
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    );

    if (label || hint || error) {
      return (
        <Field id={id} label={label} hint={hint} error={error} required={required}>
          {textareaElement}
        </Field>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = 'Textarea';

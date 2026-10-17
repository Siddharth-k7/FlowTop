'use client';

import React, { useId, useContext } from 'react';
import { RadioGroupContext } from './RadioGroupContext';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id: explicitId,
      name: explicitName,
      value,
      checked: explicitChecked,
      defaultChecked,
      disabled: explicitDisabled,
      label,
      hint,
      error,
      className = '',
      onChange,
      'aria-describedby': explicitDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const group = useContext(RadioGroupContext);

    const name = group?.name ?? explicitName;
    const disabled = explicitDisabled ?? group?.disabled ?? false;

    const isControlled = group ? group.value !== undefined : explicitChecked !== undefined;
    const isChecked = group
      ? group.value !== undefined
        ? group.value === value
        : explicitChecked
      : explicitChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (group?.onChange && value !== undefined) {
        group.onChange(String(value));
      }
    };

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
              ref={ref}
              type="radio"
              id={id}
              name={name}
              value={value}
              disabled={disabled}
              checked={isControlled ? isChecked : undefined}
              defaultChecked={!isControlled ? defaultChecked : undefined}
              onChange={handleChange}
              aria-describedby={describedBy}
              aria-invalid={Boolean(error)}
              className="peer sr-only"
              {...props}
            />

            {/* Custom radio ring */}
            <div
              className={[
                'w-space-5 h-space-5 rounded-pill border transition-all duration-fast flex items-center justify-center bg-surface-solid',
                error
                  ? 'border-error'
                  : 'border-border-input peer-hover:border-primary',
                'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2',
                'peer-checked:border-primary',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {/* Inner dot */}
              <div
                className={[
                  'w-space-2 h-space-2 rounded-pill bg-primary transition-all duration-fast scale-0',
                  'peer-checked:scale-100',
                  disabled ? 'bg-text-muted' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
          </div>

          {(label || hint) && (
            <div className="flex flex-col pt-px">
              {label && (
                <span className="font-medium text-text-primary leading-normal">
                  {label}
                </span>
              )}
              {hint && (
                <span id={hintId} className="text-caption text-text-muted">
                  {hint}
                </span>
              )}
            </div>
          )}
        </label>

        {error && (
          <p id={errorId} className="text-caption text-error pl-space-7" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

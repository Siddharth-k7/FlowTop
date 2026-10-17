'use client';

import React, { useId, useState } from 'react';

export interface SwitchProps {
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      id: explicitId,
      name,
      value = 'on',
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      label,
      hint,
      error,
      className = '',
      'aria-label': ariaLabel,
      'aria-describedby': explicitDescribedBy,
    },
    ref
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleToggle = () => {
      if (disabled) return;
      const nextChecked = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      onChange?.(nextChecked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    const labelId = label ? `${id}-label` : undefined;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      explicitDescribedBy || [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-space-1 ${className}`}>
        <div
          className={[
            'inline-flex items-center gap-space-3 select-none text-small touch-target py-space-1',
            disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={handleToggle}
        >
          {/* Switch track button */}
          <button
            ref={ref}
            type="button"
            role="switch"
            id={id}
            aria-checked={isChecked}
            aria-labelledby={labelId}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={[
              'relative inline-flex items-center shrink-0 w-space-7 h-space-5 rounded-pill transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2',
              isChecked ? 'bg-primary' : 'bg-grey-300',
              error ? 'ring-2 ring-error' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Knob */}
            <span
              className={[
                'inline-block w-space-4 h-space-4 rounded-pill bg-white shadow-sm transition-transform duration-fast ease-standard pointer-events-none',
                isChecked ? 'translate-x-space-3' : 'translate-x-space-1',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </button>

          {/* Optional hidden input for standard form submission */}
          {name && (
            <input
              type="checkbox"
              name={name}
              value={value}
              checked={isChecked}
              onChange={() => {}}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          )}

          {(label || hint) && (
            <div className="flex flex-col">
              {label && (
                <span id={labelId} className="font-medium text-text-primary leading-normal">
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
        </div>

        {error && (
          <p id={errorId} className="text-caption text-error pl-space-7" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

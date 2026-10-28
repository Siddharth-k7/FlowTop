'use client';

import React from 'react';

export interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  isUpdating?: boolean;
  onChange: (newQuantity: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function QuantityStepper({
  quantity,
  min = 1,
  max = 99,
  disabled = false,
  isUpdating = false,
  onChange,
  ariaLabel = 'Item quantity',
  className = '',
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (quantity > min && !disabled && !isUpdating) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max && !disabled && !isUpdating) {
      onChange(quantity + 1);
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-sm border border-border-input bg-surface-solid shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isUpdating || quantity <= min}
        aria-label="Decrease quantity"
        className="min-w-touch min-h-touch px-space-3 py-space-1 flex items-center justify-center text-body text-fg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-l-sm transition-colors select-none"
      >
        <span aria-hidden="true" className="font-semibold text-small">
          −
        </span>
      </button>

      <span
        aria-live="polite"
        className="min-w-[2.25rem] px-space-2 text-center text-small font-medium text-fg select-none"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isUpdating || quantity >= max}
        aria-label="Increase quantity"
        className="min-w-touch min-h-touch px-space-3 py-space-1 flex items-center justify-center text-body text-fg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-r-sm transition-colors select-none"
      >
        <span aria-hidden="true" className="font-semibold text-small">
          +
        </span>
      </button>
    </div>
  );
}

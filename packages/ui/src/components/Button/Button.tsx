'use client';

import React from 'react';
import { Spinner } from '../Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  loading = false,
  disabled = false,
  className = '',
}: ButtonStyleOptions = {}): string {
  const base =
    'relative inline-flex items-center justify-center font-medium rounded-pill focus-ring touch-target transition-colors select-none text-center cursor-pointer';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-dark active:bg-primary-dark shadow-sm border border-transparent',
    secondary:
      'bg-surface-solid text-fg border border-border-input hover:bg-surface active:bg-surface-light shadow-sm',
    ghost:
      'bg-transparent text-fg border border-transparent hover:bg-surface-light active:bg-surface',
    danger:
      'bg-error text-white border border-transparent hover:opacity-90 active:opacity-100 shadow-sm',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: iconOnly
      ? 'min-h-touch min-w-touch p-space-2 text-caption'
      : 'min-h-touch px-space-3 py-space-1 text-caption gap-space-2',
    md: iconOnly
      ? 'min-h-touch min-w-touch p-space-2 text-small'
      : 'min-h-touch px-space-4 py-space-2 text-small gap-space-2',
    lg: iconOnly
      ? 'min-h-touch min-w-touch p-space-3 text-body'
      : 'min-h-touch px-space-6 py-space-3 text-body gap-space-3',
  };

  const stateClasses =
    disabled || loading
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';

  return [base, variants[variant], sizes[size], stateClasses, className]
    .filter(Boolean)
    .join(' ');
}

type BaseButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
};

export type ButtonProps = BaseButtonProps &
  (
    | { iconOnly?: false; 'aria-label'?: string }
    | { iconOnly: true; 'aria-label': string }
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      iconOnly = false,
      loading = false,
      disabled = false,
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    const spinnerSize = size === 'lg' ? 'md' : 'sm';

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        onClick={handleClick}
        className={buttonClasses({
          variant,
          size,
          iconOnly,
          loading,
          disabled: isDisabled,
          className,
        })}
        {...props}
      >
        {/* If loading, content is preserved in layout but hidden, spinner is centered */}
        <span
          className={`inline-flex items-center justify-center gap-space-2 ${
            loading ? 'invisible' : ''
          }`}
        >
          {children}
        </span>
        {loading && (
          <span
            className="absolute inset-0 inline-flex items-center justify-center"
            aria-hidden="true"
          >
            <Spinner size={spinnerSize} />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

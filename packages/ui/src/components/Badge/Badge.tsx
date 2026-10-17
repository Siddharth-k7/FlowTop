import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  /**
   * Badges must always contain descriptive text for accessibility, never colour alone.
   */
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', icon, className = '', children, ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      neutral: 'bg-grey-100 text-text-primary border border-border',
      primary: 'bg-purple-pale text-purple-deep border border-purple-light/30',
      success: 'bg-success-tint text-success border border-success/30',
      warning: 'bg-warning-tint text-warning border border-warning/30',
      error: 'bg-error-tint text-error border border-error/30',
      info: 'bg-info-tint text-info border border-info/30',
    };

    return (
      <span
        ref={ref}
        className={[
          'inline-flex items-center gap-space-1 px-space-2 py-0.5 rounded-pill text-caption font-medium select-none',
          variants[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {icon && (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

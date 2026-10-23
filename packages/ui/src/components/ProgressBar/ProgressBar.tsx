import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current progress value (0 to max). If undefined, displays indeterminate scanning animation.
   */
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      label,
      showValue = false,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const isIndeterminate = value === undefined;
    const clampedValue = isIndeterminate ? 0 : Math.min(max, Math.max(0, value));
    const percentage = isIndeterminate ? 0 : Math.round((clampedValue / max) * 100);

    const heightClass = size === 'sm' ? 'h-space-1' : 'h-space-2';

    return (
      <div ref={ref} className={`w-full flex flex-col gap-space-1 ${className}`} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between text-caption font-medium select-none">
            {label && <span className="text-fg">{label}</span>}
            {showValue && !isIndeterminate && (
              <span className="text-fg-muted ml-auto">{percentage}%</span>
            )}
          </div>
        )}

        <div
          role="progressbar"
          aria-label={label || 'Progress'}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={isIndeterminate ? undefined : clampedValue}
          className={`w-full ${heightClass} bg-grey-200 rounded-pill overflow-hidden relative`}
        >
          {isIndeterminate ? (
            <div className="h-full bg-purple-deep rounded-pill w-1/3 animate-indeterminate motion-reduce:animate-pulse" />
          ) : (
            <div
              className="h-full bg-purple-deep rounded-pill transition-all duration-base ease-standard"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, className = '', style, ...props }, ref) => {
    const variantClasses: Record<SkeletonVariant, string> = {
      text: 'h-space-4 rounded-sm w-full',
      circular: 'rounded-pill shrink-0',
      rectangular: 'rounded-sm',
      card: 'rounded-md h-48 w-full border border-border',
    };

    const inlineStyles: React.CSSProperties = {
      ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
      ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
      ...style,
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={[
          'bg-grey-200 animate-pulse motion-reduce:animate-none select-none',
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

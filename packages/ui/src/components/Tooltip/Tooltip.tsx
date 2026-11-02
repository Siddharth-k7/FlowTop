'use client';

import React, { useState, useId, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Non-essential advisory information. Never put critical actions or content here. */
  content: React.ReactNode;
  position?: TooltipPosition;
  delayMs?: number;
  className?: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delayMs = 200,
  className = '',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  // Position classes
  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-space-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-space-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-space-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-space-2',
  };

  const childProps = children.props as Record<string, unknown>;
  const childDescribedBy = typeof childProps['aria-describedby'] === 'string'
    ? `${childProps['aria-describedby']} ${id}`
    : id;

  const trigger = React.cloneElement(
    children,
    {
      'aria-describedby': isVisible ? childDescribedBy : (childProps['aria-describedby'] as string | undefined),
      onMouseEnter: (e: React.MouseEvent) => {
        if (typeof childProps.onMouseEnter === 'function') {
          (childProps.onMouseEnter as (e: React.MouseEvent) => void)(e);
        }
        showTooltip();
      },
      onMouseLeave: (e: React.MouseEvent) => {
        if (typeof childProps.onMouseLeave === 'function') {
          (childProps.onMouseLeave as (e: React.MouseEvent) => void)(e);
        }
        hideTooltip();
      },
      onFocus: (e: React.FocusEvent) => {
        if (typeof childProps.onFocus === 'function') {
          (childProps.onFocus as (e: React.FocusEvent) => void)(e);
        }
        showTooltip();
      },
      onBlur: (e: React.FocusEvent) => {
        if (typeof childProps.onBlur === 'function') {
          (childProps.onBlur as (e: React.FocusEvent) => void)(e);
        }
        hideTooltip();
      },
    } as React.HTMLAttributes<HTMLElement>
  );

  return (
    <div className={`relative inline-flex ${className}`}>
      {trigger}
      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className={[
            'absolute z-tooltip pointer-events-none px-space-2 py-space-1 text-caption font-regular rounded-sm',
            'bg-surface-inverse text-on-surface-inverse shadow-md whitespace-nowrap transition-opacity duration-fast',
            positionClasses[position],
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {content}
        </div>
      )}
    </div>
  );
};

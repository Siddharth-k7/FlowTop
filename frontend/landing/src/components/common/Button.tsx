import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'circle' | 'outline' | 'text' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
  href?: string;
  withArrow?: boolean;
  arrowDirection?: 'right' | 'up-right';
  inverse?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  asLink = false,
  href,
  withArrow = true,
  arrowDirection = 'right',
  inverse = false,
  ...props
}) => {
  const ArrowIcon = arrowDirection === 'up-right' ? ArrowUpRight : ArrowRight;

  const isCircle = variant === 'circle';
  const isText = variant === 'text';

  // Black-and-white treatment strictly on arrows and their circular background/badge:
  // - Primary (deep purple button): pure white circular surface with near-black arrow glyph
  // - Secondary (white/transparent surface with purple text/border): white circular badge with subtle border + near-black arrow glyph
  // - Inverse on dark banner cards: near-black circular badge with white arrow glyph
  let content: React.ReactNode = children;

  if (!isCircle && !isText && withArrow) {
    content = (
      <>
        <span className="tracking-wide">{children}</span>
        <span
          className={clsx(
            'rounded-full flex items-center justify-center shrink-0 shadow-subtle',
            'transition-all duration-200 group-hover:scale-105 group-hover:translate-x-0.5',
            inverse
              ? 'bg-ink text-white' // High-contrast near-black circle on white CTA button inside dark banner
              : variant === 'primary'
              ? 'bg-white text-ink' // Deep purple button with white circle & near-black arrow
              : 'bg-white text-ink border border-border-subtle', // Secondary/outline white button with white circle & near-black arrow
            {
              'w-6 h-6 ml-2.5': size === 'sm',
              'w-7 h-7 sm:w-8 sm:h-8 ml-3 sm:ml-3.5': size === 'md',
              'w-8 h-8 sm:w-9 sm:h-9 ml-3.5 sm:ml-4': size === 'lg',
            }
          )}
          aria-hidden="true"
        >
          <ArrowIcon
            className={clsx('transition-transform duration-200', inverse ? 'text-white' : 'text-ink', {
              'w-3 h-3': size === 'sm',
              'w-3.5 h-3.5 sm:w-4 sm:h-4': size === 'md',
              'w-4 h-4 sm:w-4.5 sm:h-4.5': size === 'lg',
            })}
          />
        </span>
      </>
    );
  } else if (isText) {
    content = (
      <>
        <span className="relative pb-0.5 tracking-wide text-purple-deep font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-purple-deep group-hover:after:w-full after:transition-all after:duration-300 ease-out">
          {children}
        </span>
        {withArrow && (
          <span
            className="w-6 h-6 rounded-full bg-white text-ink border border-border-subtle flex items-center justify-center shrink-0 shadow-subtle transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <ArrowIcon className="w-3 h-3 text-ink" />
          </span>
        )}
      </>
    );
  }

  const baseClasses = clsx(
    'inline-flex items-center justify-center select-none group font-semibold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep focus-visible:ring-offset-2',
    {
      // --- Primary CTA: Deep Purple with White Text, Architectural Capsule Shape ---
      'btn-tactile rounded-full bg-purple-deep text-white border border-transparent hover:bg-[#4D2373] hover:shadow-floating hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-subtle':
        variant === 'primary',

      // --- Secondary CTA: White Surface with Subtle Purple Border & Purple Text, Architectural Capsule Shape ---
      'btn-tactile rounded-full bg-surface-white text-purple-deep border border-purple-light/40 hover:border-purple-deep/60 hover:bg-purple-pale/50 hover:shadow-subtle hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-subtle':
        variant === 'secondary',

      // --- Outline: Neutral border, ink text, lavender highlight, Architectural Capsule Shape ---
      'btn-tactile rounded-full bg-surface-white text-ink border border-border-subtle hover:border-purple-deep/40 hover:text-purple-deep hover:bg-purple-pale/25 hover:shadow-subtle hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-subtle':
        variant === 'outline',

      // Shared Sizing for Rectangular/Pill Variants
      'h-10 pl-5 pr-1.5 text-xs tracking-wide':
        (variant === 'primary' || variant === 'secondary' || variant === 'outline') && size === 'sm',
      'h-11 sm:h-12 pl-6 sm:pl-7 pr-2 sm:pr-2.5 text-xs sm:text-sm tracking-wide':
        (variant === 'primary' || variant === 'secondary' || variant === 'outline') && size === 'md',
      'h-12 sm:h-14 pl-7 sm:pl-8 pr-2.5 sm:pr-3 text-sm sm:text-base tracking-wide':
        (variant === 'primary' || variant === 'secondary' || variant === 'outline') && size === 'lg',

      // --- Text Action: Inline action with purple text and black-and-white arrow badge ---
      'bg-transparent min-h-[44px] px-2 py-2 gap-2 text-purple-deep active:opacity-75 transition-opacity':
        variant === 'text',
      'text-xs': variant === 'text' && size === 'sm',
      'text-sm': variant === 'text' && size === 'md',
      'text-base': variant === 'text' && size === 'lg',

      // --- Circular Icon Controls: Pure Black-and-White ---
      'btn-tactile rounded-full border border-border-subtle bg-white text-ink hover:bg-ink hover:text-white hover:border-ink hover:shadow-floating hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200':
        variant === 'circle',
      'w-9 h-9 min-w-[36px] min-h-[36px] p-1.5': variant === 'circle' && size === 'sm',
      'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5': variant === 'circle' && size === 'md',
      'w-13 h-13 min-w-[52px] min-h-[52px] p-3': variant === 'circle' && size === 'lg',

      // --- Ghost ---
      'rounded-full bg-transparent text-ink hover:text-purple-deep hover:bg-purple-pale/50 active:scale-[0.98] transition-colors':
        variant === 'ghost',
    },
    className
  );

  const merged = twMerge(baseClasses);

  if (asLink && href) {
    return (
      <a href={href} className={merged} role="button">
        {content}
      </a>
    );
  }

  return (
    <button className={merged} {...props}>
      {content}
    </button>
  );
};

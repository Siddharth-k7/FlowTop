import type { ReactNode } from 'react';
import type { SectionLayout } from './types';
import {
  PRESET_BACKGROUNDS,
  PRESET_SPACINGS_TOP,
  PRESET_SPACINGS_BOTTOM,
  PRESET_WIDTHS,
  PRESET_ALIGNS,
} from './presets';

export interface SectionShellProps {
  layout?: SectionLayout;
  headingId?: string;
  ariaLabel?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}

/**
 * SectionShell
 *
 * Applies the standardized layout block across all six CMS sections:
 * - Background color tokens
 * - Vertical top and bottom spacing
 * - Content width constraint (contained, wide, full)
 * - Alignment grid
 * - Accessible <section> landmark with aria-labelledby or aria-label
 */
export function SectionShell({
  layout,
  headingId,
  ariaLabel,
  className = '',
  innerClassName = '',
  children,
}: SectionShellProps) {
  const backgroundClass = layout ? PRESET_BACKGROUNDS[layout.background] : PRESET_BACKGROUNDS.white;
  const spacingTopClass = layout ? PRESET_SPACINGS_TOP[layout.spacingTop] : PRESET_SPACINGS_TOP.medium;
  const spacingBottomClass = layout ? PRESET_SPACINGS_BOTTOM[layout.spacingBottom] : PRESET_SPACINGS_BOTTOM.medium;
  const widthClass = layout ? PRESET_WIDTHS[layout.width] : PRESET_WIDTHS.contained;
  const alignClass = layout ? PRESET_ALIGNS[layout.align] : PRESET_ALIGNS.left;

  return (
    <section
      aria-labelledby={headingId || undefined}
      aria-label={!headingId && ariaLabel ? ariaLabel : undefined}
      className={`relative w-full ${backgroundClass} ${spacingTopClass} ${spacingBottomClass} ${className}`}
    >
      <div className={`${widthClass} ${alignClass} flex flex-col w-full ${innerClassName}`}>
        {children}
      </div>
    </section>
  );
}

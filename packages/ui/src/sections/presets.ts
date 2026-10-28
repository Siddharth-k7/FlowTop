/**
 * Flowtop Page Sections Layout & Style Presets
 *
 * Maps each contract enum to a fixed, literal Tailwind class string.
 * Full class names appear in the source so Tailwind JIT can detect them.
 * Typed as Record<EnumUnion, string> so adding an enum without a class fails typecheck.
 */

import type {
  SectionBackground,
  SectionSpacing,
  SectionWidth,
  SectionAlign,
  HeroOverlay,
  HeroTextPosition,
  ImageTextRatio,
  ImageSide,
  MobileOrder,
} from './types';

// ─── 1. Backgrounds ──────────────────────────────────────────────────────────

export const PRESET_BACKGROUNDS: Record<SectionBackground, string> = {
  white: 'bg-surface-solid text-fg',
  pale: 'bg-surface-light text-fg',
  deep: 'bg-primary text-white',
  black: 'bg-surface-inverse text-white',
  image: 'bg-surface-inverse text-white',
};

// ─── 2. Vertical Spacings ────────────────────────────────────────────────────

export const PRESET_SPACINGS_TOP: Record<SectionSpacing, string> = {
  none: 'pt-0',
  small: 'pt-space-6 md:pt-space-8',
  medium: 'pt-space-8 md:pt-space-12',
  large: 'pt-space-12 md:pt-space-16',
};

export const PRESET_SPACINGS_BOTTOM: Record<SectionSpacing, string> = {
  none: 'pb-0',
  small: 'pb-space-6 md:pb-space-8',
  medium: 'pb-space-8 md:pb-space-12',
  large: 'pb-space-12 md:pb-space-16',
};

// ─── 3. Content Width Constraints ────────────────────────────────────────────

export const PRESET_WIDTHS: Record<SectionWidth, string> = {
  contained: 'container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8',
  wide: 'max-w-7xl mx-auto px-space-4 md:px-space-6 lg:px-space-8',
  full: 'w-full px-0',
};

// ─── 4. Alignments ───────────────────────────────────────────────────────────

export const PRESET_ALIGNS: Record<SectionAlign, string> = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
};

// ─── 5. Hero Overlays ────────────────────────────────────────────────────────

export const PRESET_OVERLAYS: Record<HeroOverlay, string> = {
  none: 'hidden',
  light: 'bg-ink/30',
  medium: 'bg-ink/55',
  strong: 'bg-ink/75',
};

// ─── 6. Hero 9-Point Text Alignment Grid ─────────────────────────────────────

export const PRESET_TEXT_POSITIONS: Record<HeroTextPosition, string> = {
  'top-left': 'justify-start items-start text-left',
  'top-center': 'justify-center items-start text-center',
  'top-right': 'justify-end items-start text-right',
  'center-left': 'justify-start items-center text-left',
  center: 'justify-center items-center text-center',
  'center-right': 'justify-end items-center text-right',
  'bottom-left': 'justify-start items-end text-left',
  'bottom-center': 'justify-center items-end text-center',
  'bottom-right': 'justify-end items-end text-right',
};

// ─── 7. Image Text Column Ratios ─────────────────────────────────────────────

export const PRESET_COLUMN_RATIOS: Record<ImageTextRatio, string> = {
  '50-50': 'md:w-1/2',
  '60-40': 'md:w-3/5',
  '40-60': 'md:w-2/5',
};

export const PRESET_IMAGE_TEXT_RATIOS = PRESET_COLUMN_RATIOS;

// ─── 8. Image Text Sides (Desktop >= 768px) ──────────────────────────────────

export const PRESET_IMAGE_SIDES: Record<ImageSide, string> = {
  left: 'md:flex-row',
  right: 'md:flex-row-reverse',
};

// ─── 9. Mobile Stacking Orders (< 768px) ─────────────────────────────────────

export const PRESET_MOBILE_ORDERS: Record<MobileOrder, string> = {
  'image-first': 'flex-col',
  'text-first': 'flex-col-reverse',
};

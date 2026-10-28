import { SectionLayout } from '@/types/contract';

/**
 * Format integer paise into Indian Rupee currency
 * e.g., 450000 paise -> ₹4,500
 */
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Resolve SectionLayout properties into responsive Tailwind class names
 */
export function getLayoutClasses(layout?: Partial<SectionLayout>) {
  if (!layout) {
    return {
      section: 'bg-surface-white py-space-12',
      container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    };
  }

  // Background mapping
  let bgClass = 'bg-surface-white text-ink';
  if (layout.background === 'pale') {
    bgClass = 'bg-purple-pale/40 text-ink';
  } else if (layout.background === 'deep') {
    bgClass = 'bg-purple-deep text-white';
  } else if (layout.background === 'black') {
    bgClass = 'bg-ink text-white';
  }

  // Spacing top mapping
  let ptClass = 'pt-space-12';
  if (layout.spacingTop === 'none') ptClass = 'pt-0';
  else if (layout.spacingTop === 'small') ptClass = 'pt-space-6 sm:pt-space-8';
  else if (layout.spacingTop === 'medium') ptClass = 'pt-space-12 sm:pt-space-16';
  else if (layout.spacingTop === 'large') ptClass = 'pt-space-20 sm:pt-space-24';

  // Spacing bottom mapping
  let pbClass = 'pb-space-12';
  if (layout.spacingBottom === 'none') pbClass = 'pb-0';
  else if (layout.spacingBottom === 'small') pbClass = 'pb-space-6 sm:pb-space-8';
  else if (layout.spacingBottom === 'medium') pbClass = 'pb-space-12 sm:pb-space-16';
  else if (layout.spacingBottom === 'large') pbClass = 'pb-space-20 sm:pb-space-24';

  // Width container mapping
  let widthClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
  if (layout.width === 'full') {
    widthClass = 'w-full px-4 sm:px-6';
  } else if (layout.width === 'wide') {
    widthClass = 'max-w-[1440px] mx-auto px-4 sm:px-8';
  }

  return {
    section: `${bgClass} ${ptClass} ${pbClass} transition-colors duration-300`,
    container: widthClass,
  };
}

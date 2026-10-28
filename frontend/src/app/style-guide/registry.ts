/**
 * Flowtop Component Registry
 *
 * Lists every component exported by @flowtop/ui with its documented variants and states.
 * Validated by packages/ui/scripts/check.mjs to ensure all exports, variants and states
 * are documented in COMPONENTS.md and demoed in /style-guide.
 */

export interface ComponentEntry {
  id: string;
  name: string;
  category: 'Actions' | 'Forms' | 'Layout' | 'Feedback' | 'Navigation' | 'Data Display' | 'Sections';
  description: string;
  requiredVariants?: string[];
  requiredStates?: string[];
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Data Display',
    description: 'Image avatar with accessible initials fallback and multiple sizes.',
    requiredVariants: ['sm', 'md', 'lg'],
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Data Display',
    description: 'Status pill requiring text content, never relying on colour alone.',
    requiredVariants: ['neutral', 'success', 'warning', 'error', 'info'],
  },
  {
    id: 'breadcrumbs',
    name: 'Breadcrumbs',
    category: 'Navigation',
    description: 'Hierarchical navigation trail with aria-current on active item.',
  },
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    description: 'Action button with loading, disabled, ghost, and danger variants.',
    requiredVariants: ['primary', 'secondary', 'ghost', 'danger'],
    requiredStates: [
      'primary-loading',
      'primary-disabled',
      'secondary-loading',
      'secondary-disabled',
      'ghost-loading',
      'ghost-disabled',
      'danger-loading',
      'danger-disabled',
    ],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    description: 'Surface container supporting flat, raised, and inset variants.',
    requiredVariants: ['flat', 'raised', 'inset'],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    description: 'Accessible checkbox supporting checked, unchecked, and indeterminate states.',
    requiredStates: ['checked', 'unchecked', 'indeterminate', 'disabled'],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'Layout',
    description: 'Native dialog slide-in sheet from left, right, or bottom.',
    requiredVariants: ['left', 'right', 'bottom'],
    requiredStates: ['open'],
  },
  {
    id: 'empty-state',
    name: 'EmptyState',
    category: 'Feedback',
    description: 'Actionable empty view guiding users on clear next steps.',
  },
  {
    id: 'field',
    name: 'Field',
    category: 'Forms',
    description: 'Accessible form field wrapper with label, hint, and field errors.',
    requiredStates: ['error'],
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Forms',
    description: 'Text, email, password (with show/hide), and search input.',
    requiredVariants: ['text', 'search', 'password'],
    requiredStates: ['error'],
  },
  {
    id: 'menu',
    name: 'Menu',
    category: 'Actions',
    description: 'Action button plus popup dropdown with full keyboard navigation.',
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Layout',
    description: 'Native dialog modal with backdrop, focus lock, and escape handling.',
    requiredStates: ['open', 'busy'],
  },
  {
    id: 'pagination',
    name: 'Pagination',
    category: 'Navigation',
    description: 'Real link pagination working without JS, enhanced with onPageChange.',
  },
  {
    id: 'progress-bar',
    name: 'ProgressBar',
    category: 'Feedback',
    description: 'Determinate and indeterminate progress indicator.',
    requiredStates: ['determinate', 'indeterminate'],
  },
  {
    id: 'radio',
    name: 'Radio',
    category: 'Forms',
    description: 'Accessible radio selection control with custom indicator ring.',
  },
  {
    id: 'radio-group',
    name: 'RadioGroup',
    category: 'Forms',
    description: 'WAI-ARIA radiogroup container coordinating radio selection.',
  },
  {
    id: 'select',
    name: 'Select',
    category: 'Forms',
    description: 'Styled native select dropdown with 44px minimum touch target.',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Feedback',
    description: 'Calm loading placeholder loader matching tokens.',
    requiredVariants: ['text', 'rectangular', 'circular'],
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Feedback',
    description: 'Calm rotating loader with accessible role and reduced-motion fallback.',
    requiredVariants: ['sm', 'md', 'lg'],
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Forms',
    description: 'Accessible toggle switch with 44px touch target.',
    requiredStates: ['checked', 'disabled'],
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Data Display',
    description: 'Tabular data container with header, numeric alignment, and row hover.',
    requiredStates: [
      'sorting-none',
      'sorting-asc',
      'sorting-desc',
      'loading',
      'empty',
    ],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    description: 'WAI-ARIA tabbed navigation with keyboard arrow navigation.',
    requiredStates: ['active', 'inactive', 'disabled'],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    category: 'Forms',
    description: 'Multi-line input with optional live character counter.',
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Feedback',
    description: 'Temporary notification alerts with promise tracking.',
    requiredStates: ['success', 'error', 'info', 'promise'],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Feedback',
    description: 'Advisory popup on hover and focus. Never holds essential info.',
  },
  {
    id: 'lightbox',
    name: 'Lightbox',
    category: 'Layout',
    description: 'Full-screen accessible image viewer built on native HTML5 <dialog> with Escape, swipe, and focus restoration.',
  },
  {
    id: 'product-card',
    name: 'ProductCard',
    category: 'Data Display',
    description: 'Framework-agnostic luxury product card with swatches, direct placement badge, and hover animation.',
  },
  {
    id: 'hero-section',
    name: 'HeroSection',
    category: 'Sections',
    description: 'CMS hero section supporting art-directed picture, video, 9-point grid, and safe CTAs.',
    requiredVariants: ['minimal', 'full', 'withOptionalAbsent', 'withUnknownEnum'],
  },
  {
    id: 'image-text-section',
    name: 'ImageTextSection',
    category: 'Sections',
    description: 'CMS image text section with 12-col asymmetric grid, column ratios, and plain-text paragraphs.',
    requiredVariants: ['minimal', 'full', 'withOptionalAbsent', 'withUnknownEnum'],
  },
  {
    id: 'cta-section',
    name: 'CtaSection',
    category: 'Sections',
    description: 'CMS call-to-action section supporting button, document download, or text-only.',
    requiredVariants: ['minimal', 'full', 'withOptionalAbsent', 'withUnknownEnum'],
  },
  {
    id: 'product-carousel-section',
    name: 'ProductCarouselSection',
    category: 'Sections',
    description: 'CMS product carousel with scroll-snap, 44px touch targets, IntersectionObserver dots, and autoplay controls.',
  },
  {
    id: 'collection-showcase-section',
    name: 'CollectionShowcaseSection',
    category: 'Sections',
    description: 'CMS collection showcase with split, stacked, and overlay variants, video integration, and product rows.',
  },
  {
    id: 'gallery-section',
    name: 'GallerySection',
    category: 'Sections',
    description: 'CMS gallery with grid, CSS column masonry, slider, and integrated native dialog Lightbox.',
  },
];

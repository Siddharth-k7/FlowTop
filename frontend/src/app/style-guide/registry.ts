/**
 * Flowtop Component Registry
 *
 * Lists every component exported by @flowtop/ui.
 * Validated by packages/ui/scripts/check.mjs to ensure all exports are documented and demoed.
 */

export interface ComponentEntry {
  id: string;
  name: string;
  category: 'Actions' | 'Forms' | 'Layout' | 'Feedback' | 'Navigation' | 'Data Display';
  description: string;
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Data Display',
    description: 'Image avatar with accessible initials fallback and multiple sizes.',
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Data Display',
    description: 'Status pill requiring text content, never relying on colour alone.',
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
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    description: 'Surface container supporting flat, raised, and inset variants.',
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    description: 'Accessible checkbox supporting checked, unchecked, and indeterminate states.',
  },
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'Layout',
    description: 'Native dialog slide-in sheet from left, right, or bottom.',
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
  },
  {
    id: 'input',
    name: 'Input',
    category: 'Forms',
    description: 'Text, email, password (with show/hide), and search input.',
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
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Feedback',
    description: 'Calm rotating loader with accessible role and reduced-motion fallback.',
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Forms',
    description: 'Accessible toggle switch with 44px touch target.',
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Data Display',
    description: 'Tabular data container with header, numeric alignment, and row hover.',
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    description: 'WAI-ARIA tabbed navigation with keyboard arrow navigation.',
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
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Feedback',
    description: 'Advisory popup on hover and focus. Never holds essential info.',
  },
];

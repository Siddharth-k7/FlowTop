/**
 * @flowtop/ui
 *
 * Core component and token exports for Flowtop.
 * Owned by Dev C, imported by frontend/ and admin/ (Dev D).
 */

// Design token helpers
export const BREAKPOINTS = {
  xs: 360,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Components and prop types (Phase 1 core + Shell essentials)
export * from './components/Field';
export * from './components/Button';
export * from './components/Input';
export * from './components/Select';
export * from './components/Card';
export * from './components/Modal';
export * from './components/Table';
export * from './components/Toast';
export * from './components/Badge';
export * from './components/Tabs';
export * from './components/Spinner';

// Shell & form additions (Items 1-8)
export * from './components/Drawer';
export * from './components/Breadcrumbs';
export * from './components/Menu';
export * from './components/Textarea';
export * from './components/Checkbox';
export * from './components/EmptyState';
export * from './components/Skeleton';
export * from './components/ProgressBar';

// Additional interactive components (Items 9-13)
export * from './components/Radio';
export * from './components/Switch';
export * from './components/Tooltip';
export * from './components/Pagination';
export * from './components/Avatar';

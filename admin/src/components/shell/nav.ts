import type { Permission } from '@flowtop/types';

/** `permission` is the read permission for the section. Typed as Permission, so a typo does not compile. */
export interface NavItem { href: string; label: string; icon: string; permission?: Permission }

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/products', label: 'Products', icon: '▣', permission: 'product:read' },
  { href: '/categories', label: 'Categories', icon: '☰', permission: 'category:read' },
  { href: '/collections', label: 'Collections', icon: '❖', permission: 'collection:read' },
  { href: '/pages', label: 'Pages', icon: '▤', permission: 'page:read' },
  { href: '/journal', label: 'Journal', icon: '✎', permission: 'journal:read' },
  { href: '/media', label: 'Media', icon: '▨', permission: 'media:read' },
  { href: '/orders', label: 'Orders', icon: '☷', permission: 'order:read' },
  { href: '/submissions', label: 'Submissions', icon: '✉', permission: 'submission:read' },
  { href: '/navigation', label: 'Navigation', icon: '⇄', permission: 'navigation:read' },
  { href: '/settings', label: 'Settings', icon: '⚙', permission: 'settings:read' },
  { href: '/users', label: 'Users', icon: '☺', permission: 'user:read' },
];

/** COSMETIC ONLY: hiding UI is presentation, not security. The server re-checks every call. */
export const canSee = (permissions: readonly Permission[], permission?: Permission) =>
  !permission || permissions.includes(permission);

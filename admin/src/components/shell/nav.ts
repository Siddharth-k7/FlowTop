import { CONTENT_TYPES } from '@/lib/content-types';

export interface NavItem { href: string; label: string; icon: string; permission?: string; group: string }

const base: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂', group: '' },
  { href: '/products', label: 'Products', icon: '▣', permission: 'product:write', group: 'Catalogue' },
  { href: '/categories', label: 'Categories', icon: '☰', permission: 'product:write', group: 'Catalogue' },
  { href: '/pages', label: 'Pages', icon: '▤', permission: 'page:write', group: 'Content' },
  { href: '/media', label: 'Media', icon: '▨', permission: 'media:write', group: 'Content' },
  { href: '/navigation', label: 'Navigation', icon: '⇄', permission: 'navigation:write', group: 'Content' },
  { href: '/orders', label: 'Orders', icon: '☷', permission: 'order:read', group: 'Sales' },
  { href: '/submissions', label: 'Submissions', icon: '✉', permission: 'submission:read', group: 'Sales' },
  { href: '/settings', label: 'Settings', icon: '⚙', permission: 'settings:write', group: 'Admin' },
  { href: '/users', label: 'Users', icon: '☺', permission: 'user:read', group: 'Admin' },
  { href: '/guide', label: 'Admin guide', icon: '?', group: 'Admin' },
];
const GROUP = { catalogue: 'Catalogue', content: 'Content', discovery: 'Discovery' };
const fromContent: NavItem[] = CONTENT_TYPES.map((c) => ({ href: `/${c.section}`, label: c.title, icon: '◇', permission: c.permission, group: GROUP[c.group] }));

const ORDER = ['', 'Catalogue', 'Content', 'Discovery', 'Sales', 'Admin'];
export const NAV: NavItem[] = [...base, ...fromContent].sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));

export interface NavItem { href: string; label: string; icon: string; permission?: string }

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/products', label: 'Products', icon: '▣', permission: 'product:write' },
  { href: '/categories', label: 'Categories', icon: '☰', permission: 'product:write' },
  { href: '/collections', label: 'Collections', icon: '❖', permission: 'product:write' },
  { href: '/pages', label: 'Pages', icon: '▤', permission: 'page:write' },
  { href: '/journal', label: 'Journal', icon: '✎', permission: 'journal:write' },
  { href: '/media', label: 'Media', icon: '▨', permission: 'media:write' },
  { href: '/orders', label: 'Orders', icon: '☷', permission: 'order:read' },
  { href: '/submissions', label: 'Submissions', icon: '✉', permission: 'submission:read' },
  { href: '/navigation', label: 'Navigation', icon: '⇄', permission: 'navigation:write' },
  { href: '/settings', label: 'Settings', icon: '⚙', permission: 'settings:write' },
  { href: '/users', label: 'Users', icon: '☺', permission: 'user:read' },
];

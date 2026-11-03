import type { Permission } from '@flowtop/types';
import { canSee } from '@/components/shell/nav';

export interface Tile { href: string; label: string; icon: string; permission: Permission }

export const TILES: Tile[] = [
  { href: '/products/new', label: 'Add Product', icon: '▣', permission: 'product:create' },
  { href: '/pages/new', label: 'Create Page', icon: '▤', permission: 'page:write' },
  { href: '/collections/new', label: 'Add Collection', icon: '❖', permission: 'collection:write' },
  { href: '/journal/new', label: 'Write Journal', icon: '✎', permission: 'journal:write' },
  { href: '/media', label: 'Upload Media', icon: '▨', permission: 'media:write' },
  { href: '/orders', label: 'View Orders', icon: '☷', permission: 'order:read' },
  { href: '/submissions', label: 'View Submissions', icon: '✉', permission: 'submission:read' },
  { href: '/navigation', label: 'Navigation', icon: '⇄', permission: 'navigation:read' },
];

/** COSMETIC ONLY, same as the nav: hides tiles a role cannot use. The server still checks every call. */
export const visibleTiles = (permissions: readonly Permission[]) => TILES.filter((t) => canSee(permissions, t.permission));

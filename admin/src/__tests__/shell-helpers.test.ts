import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Permission } from '@flowtop/types';
import { crumbs } from '@/lib/breadcrumbs';
import { createDismissTimer } from '@/lib/dismiss-timer';
import { nextMenuIndex } from '@/lib/menu-keys';
import { safeNext } from '@/lib/safe-next';
import { visibleTiles } from '@/components/dashboard/tiles';
import { canSee, NAV } from '@/components/shell/nav';
import { permissionsFor } from '@/lib/mocks/roles';

describe('crumbs (Topbar)', () => {
  it('shows only Home on /dashboard, no duplicate Dashboard crumb', () =>
    expect(crumbs('/dashboard')).toEqual([{ href: '/dashboard', label: 'Home' }]));
  it('gives every crumb a unique href (the React key), even with a repeated segment', () => {
    const c = crumbs('/pages/pages/new-page');
    expect(c.map((x) => x.href)).toEqual(['/dashboard', '/pages', '/pages/pages', '/pages/pages/new-page']);
    expect(new Set(c.map((x) => x.href)).size).toBe(c.length);
    expect(c[3]?.label).toBe('new page');
  });
});

describe('nextMenuIndex (Topbar user menu)', () => {
  it('wraps with arrows and jumps with Home/End', () => {
    expect(nextMenuIndex(0, 'ArrowDown', 3)).toBe(1);
    expect(nextMenuIndex(2, 'ArrowDown', 3)).toBe(0);
    expect(nextMenuIndex(0, 'ArrowUp', 3)).toBe(2);
    expect(nextMenuIndex(-1, 'ArrowDown', 1)).toBe(0);
    expect(nextMenuIndex(1, 'Home', 3)).toBe(0);
    expect(nextMenuIndex(0, 'End', 3)).toBe(2);
  });
  it('ignores other keys and empty menus', () => {
    expect(nextMenuIndex(0, 'a', 3)).toBeNull();
    expect(nextMenuIndex(0, 'ArrowDown', 0)).toBeNull();
  });
});

describe('createDismissTimer (Shell toast)', () => {
  afterEach(() => vi.useRealTimers());
  it('a second show restarts the timer instead of the first one hiding it early', () => {
    vi.useFakeTimers();
    const seen: boolean[] = [];
    const t = createDismissTimer((v) => seen.push(v), 6000);
    t.show(); vi.advanceTimersByTime(5000);
    t.show(); vi.advanceTimersByTime(5000);
    expect(seen).toEqual([true, true]);
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([true, true, false]);
  });
  it('dispose cancels the pending timer (unmount)', () => {
    vi.useFakeTimers();
    const on = vi.fn();
    const t = createDismissTimer(on, 6000);
    t.show(); t.dispose(); vi.advanceTimersByTime(10_000);
    expect(on).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('safeNext (LoginFlow redirect)', () => {
  const o = 'http://localhost:3001';
  it('keeps same-origin paths with query and hash', () => expect(safeNext('/media?x=1#a', o)).toBe('/media?x=1#a'));
  it('rejects other origins, protocol-relative and backslash tricks', () => {
    expect(safeNext('https://evil.example/x', o)).toBe('/dashboard');
    expect(safeNext('//evil.example', o)).toBe('/dashboard');
    expect(safeNext('/\\evil.example', o)).toBe('/dashboard');
    expect(safeNext('javascript:alert(1)', o)).toBe('/dashboard');
  });
  it('defaults when missing', () => expect(safeNext(null, o)).toBe('/dashboard'));
});

describe('cosmetic permission filters', () => {
  const pm = permissionsFor('product_manager');
  it('product_manager menu matches its read perms (no journal, orders, submissions, navigation, settings, users) (plus always-on Dashboard)', () => {
    expect(NAV.filter((n) => canSee(pm, n.permission)).map((n) => n.label)).toEqual(
      ['Dashboard', 'Products', 'Categories', 'Collections', 'Pages', 'Media']);
  });
  it('product_manager tiles hide pages, journal, orders, submissions, navigation', () => {
    expect(visibleTiles(pm).map((t) => t.label)).toEqual(['Add Product', 'Add Collection', 'Upload Media']);
  });
  it('super_admin sees every tile and nav item', () => {
    const sa = permissionsFor('super_admin');
    expect(visibleTiles(sa)).toHaveLength(8);
    expect(NAV.every((n) => canSee(sa, n.permission))).toBe(true);
  });
  it('media:delete only for super_admin and marketing_admin (MediaDetail hides Delete otherwise)', () => {
    const has = (p: readonly Permission[]) => canSee(p, 'media:delete');
    expect([has(permissionsFor('super_admin')), has(permissionsFor('marketing_admin')), has(pm)]).toEqual([true, true, false]);
  });
});

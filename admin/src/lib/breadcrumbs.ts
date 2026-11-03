export interface Crumb { href: string; label: string }

/**
 * Home first, then one crumb per path segment. Home is /dashboard, so a leading "dashboard"
 * segment is dropped instead of showing "Home / Dashboard". `href` is unique per crumb, so it
 * is the React key (a repeated segment such as /pages/pages no longer duplicates keys).
 */
export function crumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const out: Crumb[] = [{ href: '/dashboard', label: 'Home' }];
  parts.forEach((p, i) => {
    if (i === 0 && p === 'dashboard') return;
    out.push({ href: `/${parts.slice(0, i + 1).join('/')}`, label: decodeURIComponent(p).replace(/-/g, ' ') });
  });
  return out;
}

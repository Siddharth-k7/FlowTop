/**
 * Reserved Page Slugs
 *
 * Slugs that correspond to static routes, API endpoints, or system assets.
 * A CMS page must never be created with any of these slugs, as Next.js
 * static routes win over dynamic [slug] routes.
 *
 * NOTE FOR DEV D & DEV B:
 * The Admin CMS (Dev D) and Backend Validation (Dev B) must validate and block
 * page creation or slug updates using this reserved list.
 */

export const RESERVED_PAGE_SLUGS = [
  '',
  'products',
  'category',
  'collections',
  'cart',
  'checkout',
  'api',
  'style-guide',
  'journal',
  'about',
  'contact',
  'dealers',
  'dealer',
  'locations',
  'specs',
  'engineering',
  'warranty',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
] as const;

const RESERVED_SET = new Set<string>(RESERVED_PAGE_SLUGS);

/**
 * Checks whether a given slug conflicts with a reserved route.
 */
export function isReservedSlug(slug: string): boolean {
  if (!slug) return true;
  return RESERVED_SET.has(slug.toLowerCase().trim());
}

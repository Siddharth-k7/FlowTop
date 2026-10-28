/**
 * Flowtop Safe URL Validator
 *
 * Enforces strict protocol security for CMS links and CTAs.
 * Allowed:
 * - Paths starting with a single leading "/" (e.g. "/products", "/collections/aura")
 * - "https:" URLs
 * - "mailto:" links
 * - "tel:" links
 *
 * Blocked (returns null and logs warning):
 * - "javascript:", "data:", "vbscript:", etc.
 * - Protocol-relative URLs starting with "//"
 * - Insecure "http:" URLs
 * - Malformed, mixed-case, or whitespace-padded injection payloads
 */

export function safeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;

  const trimmed = href.trim();
  if (trimmed.length === 0) return null;

  // Block protocol-relative URLs starting with "//"
  if (trimmed.startsWith('//')) {
    console.warn(`[safeHref] Blocked protocol-relative URL: "${href}"`);
    return null;
  }

  // Allow relative paths starting with single "/" (e.g. "/products")
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Strip ASCII whitespace and control characters that web browsers ignore during scheme parsing
  // e.g. "java\tscript:", "  https :", etc.
  // eslint-disable-next-line no-control-regex
  const cleaned = trimmed.replace(/[\x00-\x20\s]+/g, '');
  const lower = cleaned.toLowerCase();

  // Explicitly block dangerous schemes
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    console.warn(`[safeHref] Blocked dangerous scheme URL: "${href}"`);
    return null;
  }

  // Allowed absolute protocols
  if (
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed;
  }

  console.warn(`[safeHref] Blocked unapproved scheme or malformed URL: "${href}"`);
  return null;
}

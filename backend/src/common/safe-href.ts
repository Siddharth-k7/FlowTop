/**
 * Links stored for the public site.
 *
 * `http:` is rejected on purpose. An absolute link may only be `https:`, `mailto:`, or `tel:`.
 * The old `https?` pattern allowed `http:` by accident. A stored `http` URL is a downgrade the
 * visitor's browser would follow, so it is not one of the three absolute schemes.
 *
 * A relative value is parsed with the WHATWG URL parser against a fixed base. It must stay on
 * that origin. A backslash, a control character, or whitespace is rejected before parsing,
 * because a browser treats `\` as `/` and would turn `/\evil.com` into `https://evil.com/`.
 */
const BASE = 'https://flowtop.invalid/';
const BASE_ORIGIN = new URL(BASE).origin;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function forbidden(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f || code === 0x2028 || code === 0x2029) return true;
    if (char === '\\' || /\s/.test(char)) return true;
  }
  return false;
}

function decoded(value: string): string | null {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    if (!/%[0-9a-fA-F]{2}/.test(current)) return current;
    try {
      const next = decodeURIComponent(current);
      if (next === current) return current;
      current = next;
    } catch {
      return null;
    }
  }
  return current;
}

/** `allowRelative` is for section buttons (`/products`). Navigation external links pass false. */
export function isSafeLink(value: unknown, allowRelative = true): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (forbidden(value)) return false;
  const plain = decoded(value);
  if (plain === null || forbidden(plain)) return false;
  let url: URL;
  try {
    url = new URL(plain, BASE);
  } catch {
    return false;
  }
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') return SCHEME.test(plain);
  if (url.protocol === 'https:' && plain.toLowerCase().startsWith('https:')) return true;
  return allowRelative && !SCHEME.test(plain) && url.origin === BASE_ORIGIN;
}

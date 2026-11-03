/**
 * The post-login redirect target, limited to this origin. `next.startsWith('/')` also accepted
 * `//evil.example` (protocol-relative) and `/\evil.example`; parsing against the current origin
 * and comparing origins rejects both.
 */
export function safeNext(next: string | null, origin: string, fallback = '/dashboard'): string {
  if (!next) return fallback;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

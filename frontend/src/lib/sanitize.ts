/**
 * Flowtop Article HTML Sanitiser
 *
 * TODO(sanitiser): No sanitiser dependency currently exists in the monorepo, and
 * Dev C must not add one unilaterally without Dev A (platform owner) approval.
 * Until Dev A approves and merges `sanitize-html`, this function must NOT pass
 * arbitrary HTML through. Instead, it extracts and escapes plain text, splitting
 * content into safe <p> paragraphs.
 *
 * Hand-rolled regex HTML sanitising is strictly prohibited due to bypass vulnerabilities
 * (mismatched tags, nested vectors, encoding tricks, mutation XSS).
 *
 * Final Allowlist Specification (to be enforced by sanitize-html once approved by Dev A):
 * - Allowed Tags:
 *     'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em',
 *     'br', 'hr', 'figure', 'figcaption', 'a', 'img'
 * - Tag Transformations:
 *     Demote any 'h1' to 'h2' (only the article title may be the page h1).
 * - Allowed Attributes:
 *     'a': ['href', 'target', 'rel']
 *          - href must pass safeHref (single '/', https:, mailto:, tel:)
 *          - target="_blank" must always enforce rel="noopener noreferrer"
 *     'img': ['src', 'alt', 'width', 'height']
 *          - src must be https: or root-relative path ('/')
 *          - alt attribute is strictly required
 *          - No srcset tricks or inline data: URLs allowed
 * - Stripped / Blocked:
 *     'script', 'style', 'iframe', 'svg', 'form', 'input', 'button',
 *     all inline 'style' attributes, all 'on*' event handlers,
 *     and data: / javascript: / vbscript: URI schemes.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitises article HTML content.
 *
 * Until Dev A approves sanitize-html, this returns escaped text split into <p> paragraphs.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Safe fallback until Dev A adds sanitize-html:
  // Convert breaks to newlines, remove scripts and styles, strip tags, and escape text into <p> paragraphs.
  const plainText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  if (!plainText) {
    return '';
  }

  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}

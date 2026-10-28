# Dependency Request for Dev A: HTML Sanitiser (`sanitize-html`)

**To:** Dev A (Platform & Monorepo Infrastructure Owner)  
**From:** Dev C (Public Website Owner)  
**Date:** 27 October 2026  
**Status:** Pending Approval  

---

## 1. Problem & Requirement

Rich editorial text entered by Flowtop staff in the Admin CMS (or sourced from the database) contains HTML formatting across three critical areas:
1. **Journal Articles (Phase 3.C9 / Task 3.B8)**: Long-form architectural articles and interviews (`contentHtml`).
2. **Product Descriptions (Phase 2.C2 / Task 2.2)**: Rich product specifications and technical breakdowns (`fullDescriptionHtml`).
3. **Collection Stories (Phase 2.C8 / Task 2.4)**: Editorial stories and design philosophy (`story`).

Hand-rolled regex sanitisation is strictly forbidden by project security standards because it cannot reliably defend against mutation XSS, malformed nesting, entity encoding tricks (`&#106;avascript:`), or attribute injection.

Until you approve and install a dedicated library, `frontend/src/lib/sanitize.ts` is running in **Safe Fallback Mode**: it extracts plain text, escapes all characters, and outputs `<p>` tags without passing any raw HTML through.

---

## 2. Proposed Dependency: `sanitize-html`

We request adding `sanitize-html` (pinned, e.g. `sanitize-html@2.14.0`) to `frontend/package.json` and updating the monorepo lockfile (`package-lock.json`).

### Why `sanitize-html`?
- **Pure JavaScript & Zero DOM Dependency**: Works natively in Node.js server environments and Next.js React Server Components (RSC) with zero reliance on heavy native C++ binaries or `jsdom` emulation.
- **Battle-Tested Security**: Handles case-insensitive URI bypasses, entity decoding, protocol schemes, attribute whitelisting, and tag demotion out of the box.
- **Single Reusable Utility**: Installing it once in `frontend` allows [`frontend/src/lib/sanitize.ts`](file:///Users/atharva/Documents/FlowTop/frontend/src/lib/sanitize.ts) to serve as the unified, hardened sanitisation boundary across:
  - Journal articles (`app/journal/[slug]`)
  - Product descriptions (`app/products/[slug]`)
  - Collection stories (`app/collections/[slug]`)

---

## 3. Approved Allowlist Configuration

Once approved, `frontend/src/lib/sanitize.ts` will configure `sanitize-html` with this exact allowlist:

```ts
import sanitizeHtml from 'sanitize-html';
import { safeHref } from '@flowtop/ui';

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
      'strong', 'em', 'br', 'hr', 'figure', 'figcaption', 'a', 'img'
    ],
    transformTags: {
      // Demote any h1 to h2 so the page title remains the solitary h1
      h1: 'h2',
      a: (tagName, attribs) => {
        const href = attribs.href ? safeHref(attribs.href) : null;
        if (!href) return { tagName: 'span', attribs: {} };
        const isBlank = attribs.target === '_blank';
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            href,
            ...(isBlank ? { rel: 'noopener noreferrer', target: '_blank' } : {}),
          },
        };
      },
    },
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['https'],
    allowedSchemesByTag: {
      a: ['https', 'mailto', 'tel'],
      img: ['https'],
    },
    allowProtocolRelative: false,
  });
}
```

---

## 4. Verification Suite Ready

The complete test suite covering XSS vectors (`<script>`, `<img onerror>`, `JaVaScRiPt:`, entity encoding, `<iframe>`, `<style>`, `<svg onload>`, unclosed tags, `data:` URLs, and `<h1>` demotion) has already been authored in [`frontend/test/sanitize.test.mjs`](file:///Users/atharva/Documents/FlowTop/frontend/test/sanitize.test.mjs) and is currently marked as `{ skip: "Pending Dev A's approval of sanitize-html library" }`.

Running `node --test frontend/test/sanitize.test.mjs` will immediately verify the real implementation once the package is merged.

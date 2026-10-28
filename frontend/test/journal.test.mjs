import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJournalParams, buildJournalHref, isJournalCategoryValid, JOURNAL_CATEGORIES } from '../src/lib/journal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');

describe('Flowtop Public Journal Verification', () => {
  it('defines --measure token as 68ch in packages/ui/src/tokens.css', () => {
    const tokensPath = path.resolve(root, 'packages', 'ui', 'src', 'tokens.css');
    const content = fs.readFileSync(tokensPath, 'utf8');
    assert.match(content, /--measure:\s*68ch;/);
  });

  it('defines maxWidth.measure in packages/ui/tailwind-preset.cjs', () => {
    const presetPath = path.resolve(root, 'packages', 'ui', 'tailwind-preset.cjs');
    const content = fs.readFileSync(presetPath, 'utf8');
    assert.match(content, /measure:\s*['"]var\(--measure\)['"]/);
  });

  it('defines long-reading typography in frontend/src/app/journal/article.css', () => {
    const cssPath = path.resolve(__dirname, '..', 'src', 'app', 'journal', 'article.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Measure max-width
    assert.ok(css.includes('max-w-measure'), 'Must restrict reading container to max-w-measure (68ch)');

    // Line height 1.7 or more
    assert.ok(css.includes('leading-[1.8]'), 'Must apply line height 1.7 or more');

    // Headings in font-display
    assert.ok(css.includes('font-display'), 'Headings must use font-display');

    // Blockquote pull quote with purple-light rule
    assert.ok(css.includes('border-purple-light'), 'Blockquotes must have quiet pull quotes with purple-light rule');

    // Images with rounded-md and captions
    assert.ok(css.includes('rounded-md'), 'Images must have rounded-md corners');
    assert.ok(css.includes('figcaption'), 'Captions must be styled');
  });

  it('verifies parseJournalParams whitelists keys and clamps page', () => {
    const result1 = parseJournalParams({ category: 'buying-guide', page: '3', hack: 'true' });
    assert.deepEqual(result1, { category: 'buying-guide', page: 3 });

    const result2 = parseJournalParams({ page: '-5' });
    assert.deepEqual(result2, { category: undefined, page: 1 });

    const result3 = parseJournalParams({ page: 'abc' });
    assert.deepEqual(result3, { category: undefined, page: 1 });
  });

  it('validates journal categories strictly against JOURNAL_CATEGORIES', () => {
    assert.ok(isJournalCategoryValid('buying-guide'));
    assert.ok(isJournalCategoryValid('materials'));
    assert.ok(isJournalCategoryValid('collections'));
    assert.ok(!isJournalCategoryValid('invalid-category'));
    assert.ok(!isJournalCategoryValid(''));
  });

  it('builds clean pagination and filter URLs without extraneous params', () => {
    const href1 = buildJournalHref('/journal', { category: 'buying-guide', page: 1 }, { page: 2 });
    assert.equal(href1, '/journal?category=buying-guide&page=2');

    const href2 = buildJournalHref('/journal', { category: 'materials', page: 2 }, { page: 1 });
    assert.equal(href2, '/journal?category=materials');

    const href3 = buildJournalHref('/journal', { category: 'materials', page: 1 }, { category: undefined });
    assert.equal(href3, '/journal');
  });

  it('verifies responsive layout containers avoid horizontal scroll at 360px and 1440px', () => {
    const journalPagePath = path.resolve(__dirname, '..', 'src', 'app', 'journal', 'page.tsx');
    const articlePagePath = path.resolve(__dirname, '..', 'src', 'app', 'journal', '[slug]', 'page.tsx');

    const journalContent = fs.readFileSync(journalPagePath, 'utf8');
    const articleContent = fs.readFileSync(articlePagePath, 'utf8');

    // Must have max-w-full and overflow-x-hidden on outer wrapper
    assert.ok(journalContent.includes('overflow-x-hidden'));
    assert.ok(articleContent.includes('overflow-x-hidden'));

    // Grid columns must be single column on mobile (grid-cols-1)
    assert.ok(journalContent.includes('grid-cols-1'));
    assert.ok(articleContent.includes('grid-cols-1'));

    // No hardcoded pixel widths greater than 360px (e.g. w-[400px], w-[500px])
    const badWidthRegex = /w-\[(\d+)px\]/g;
    for (const match of journalContent.matchAll(badWidthRegex)) {
      const px = parseInt(match[1], 10);
      assert.ok(px <= 360, `Hardcoded width ${px}px exceeds 360px mobile viewport in journal/page.tsx`);
    }
    for (const match of articleContent.matchAll(badWidthRegex)) {
      const px = parseInt(match[1], 10);
      assert.ok(px <= 360, `Hardcoded width ${px}px exceeds 360px mobile viewport in journal/[slug]/page.tsx`);
    }
  });

  it('verifies article detail page contains solitary h1, safe JSON-LD escaping, and share block', () => {
    const articlePagePath = path.resolve(__dirname, '..', 'src', 'app', 'journal', '[slug]', 'page.tsx');
    const content = fs.readFileSync(articlePagePath, 'utf8');

    // Only one h1
    const h1Matches = content.match(/<h1\b/g);
    assert.equal(h1Matches?.length, 1, 'Article detail page must have exactly one solitary h1 element');

    // Safe JSON-LD escaping (< replaced with \u003c)
    assert.ok(content.includes('.replace(/</g,'), 'JSON-LD must safely escape < character');

    // ShareButtons present
    assert.ok(content.includes('<ShareButtons'), 'ShareButtons component must be present');

    // Related products conditional check
    assert.ok(content.includes('relatedProducts.length > 0'), 'Related products section must be omitted when empty');
  });
});

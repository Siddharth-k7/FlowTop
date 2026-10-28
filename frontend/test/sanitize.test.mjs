import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeArticleHtml } from '../src/lib/sanitize.ts';

const PENDING_REASON = "Pending Dev A's approval of sanitize-html library";

describe('Article HTML Sanitiser', () => {
  describe('Fallback Safe Mode (Active until Dev A approves sanitize-html)', () => {
    it('escapes text and renders into safe paragraphs without executing raw tags', () => {
      const input = '<p>First paragraph with <script>alert(1)</script> dangerous code.</p><p>Second paragraph with <img src=x onerror=alert(2) /> image.</p>';
      const result = sanitizeArticleHtml(input);

      assert.ok(!result.includes('<script>'), 'must not contain script tag');
      assert.ok(!result.includes('onerror='), 'must not contain onerror attribute');
      assert.ok(!result.includes('alert('), 'must not execute alert code');
      assert.ok(result.includes('<p>'), 'wraps in safe <p>');
      assert.ok(result.includes('First paragraph with'), 'preserves safe text');
    });

    it('escapes HTML special characters properly', () => {
      const input = '<p>Text with & and quotes " \'</p>';
      const result = sanitizeArticleHtml(input);
      assert.ok(result.includes('&amp;'));
      assert.ok(result.includes('&quot;'));
      assert.ok(result.includes('&#39;'));
    });
  });

  describe('Allowlist & Attack Vector Tests (Pending Dev A library)', () => {
    it('strips <script> tags completely', { skip: PENDING_REASON }, () => {
      const input = '<p>Normal text</p><script>alert("XSS")</script>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('<script>'), false);
      assert.equal(output.includes('alert("XSS")'), false);
    });

    it('disarms <img src=x onerror=...> event handlers', { skip: PENDING_REASON }, () => {
      const input = '<img src="https://flowtop.in/img.jpg" alt="Valid" onerror="alert(1)" />';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('onerror'), false);
    });

    it('blocks JaVaScRiPt: hrefs (case-insensitive bypass)', { skip: PENDING_REASON }, () => {
      const input = '<a href="JaVaScRiPt:alert(1)">Click Me</a>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('href="JaVaScRiPt:'), false);
      assert.equal(output.includes('javascript:'), false);
    });

    it('blocks decimal entity-encoded javascript: hrefs', { skip: PENDING_REASON }, () => {
      const entityPrefix = '&#1' + '06;';
      const input = `<a href="${entityPrefix}avascript:alert(1)">Click Me</a>`;
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes(`href="${entityPrefix}`), false);
    });

    it('strips <iframe> elements', { skip: PENDING_REASON }, () => {
      const input = '<iframe src="https://malicious.com"></iframe>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('<iframe'), false);
    });

    it('strips <style> blocks and inline style attributes', { skip: PENDING_REASON }, () => {
      const input = '<style>body { display: none; }</style><p style="color: red;">Text</p>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('<style'), false);
      assert.equal(output.includes('style='), false);
    });

    it('strips nested <svg onload=...>', { skip: PENDING_REASON }, () => {
      const input = '<div><svg><g onload="alert(1)"></g></svg></div>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('<svg'), false);
      assert.equal(output.includes('onload'), false);
    });

    it('safely handles unclosed tags without breaking DOM', { skip: PENDING_REASON }, () => {
      const input = '<p>Unclosed paragraph<strong>bold without close';
      const output = sanitizeArticleHtml(input);
      assert.ok(output.length > 0);
    });

    it('blocks data: URLs on links and images', { skip: PENDING_REASON }, () => {
      const input = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Link</a><img src="data:image/svg+xml;utf8,<svg onload=alert(1)>" alt="test" />';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('data:'), false);
    });

    it('demotes h1 tags to h2', { skip: PENDING_REASON }, () => {
      const input = '<h1>Main Editorial Subheading</h1>';
      const output = sanitizeArticleHtml(input);
      assert.equal(output.includes('<h1'), false);
      assert.ok(output.includes('<h2') && output.includes('</h2>'));
    });

    it('enforces rel="noopener noreferrer" on target="_blank" links', { skip: PENDING_REASON }, () => {
      const input = '<a href="https://example.com" target="_blank">External</a>';
      const output = sanitizeArticleHtml(input);
      assert.ok(output.includes('rel="noopener noreferrer"'));
    });

    it('preserves approved allowlist tags: p, h2, h3, h4, ul, ol, li, blockquote, strong, em, br, hr, figure, figcaption', { skip: PENDING_REASON }, () => {
      const input = '<h2>Heading</h2><p>Paragraph with <strong>strong</strong>, <em>em</em>, and <br><hr></p><blockquote>Quote</blockquote><ul><li>Item 1</li></ul><figure><figcaption>Caption</figcaption></figure>';
      const output = sanitizeArticleHtml(input);
      assert.ok(output.includes('<h2>'));
      assert.ok(output.includes('<p>'));
      assert.ok(output.includes('<strong>'));
      assert.ok(output.includes('<em>'));
      assert.ok(output.includes('<blockquote>'));
      assert.ok(output.includes('<ul>'));
      assert.ok(output.includes('<li>'));
      assert.ok(output.includes('<figure>'));
      assert.ok(output.includes('<figcaption>'));
    });
  });
});

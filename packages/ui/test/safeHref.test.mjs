import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, '..');

const jiti = require('jiti')(path.join(uiRoot, 'index.js'));
const { safeHref } = jiti(path.join(uiRoot, 'src/sections/safeHref.ts'));

describe('safeHref URL Security Validator', () => {
  it('allows valid relative paths starting with single "/"', () => {
    assert.equal(safeHref('/'), '/');
    assert.equal(safeHref('/products'), '/products');
    assert.equal(safeHref('/products/aura?finish=chrome'), '/products/aura?finish=chrome');
    assert.equal(safeHref('/collections/cascade#specs'), '/collections/cascade#specs');
  });

  it('allows valid https: URLs', () => {
    assert.equal(safeHref('https://flowtop.in'), 'https://flowtop.in');
    assert.equal(safeHref('https://flowtop.in/specs.pdf'), 'https://flowtop.in/specs.pdf');
    assert.equal(safeHref('HTTPS://FLOWTOP.IN/CATALOGUE'), 'HTTPS://FLOWTOP.IN/CATALOGUE');
  });

  it('allows valid mailto: links', () => {
    assert.equal(safeHref('mailto:concierge@flowtop.in'), 'mailto:concierge@flowtop.in');
    assert.equal(safeHref('MAILTO:architects@flowtop.in?subject=Bespoke'), 'MAILTO:architects@flowtop.in?subject=Bespoke');
  });

  it('allows valid tel: links', () => {
    assert.equal(safeHref('tel:+918049102000'), 'tel:+918049102000');
    assert.equal(safeHref('TEL:+918049102000'), 'TEL:+918049102000');
  });

  it('blocks protocol-relative URLs starting with "//"', () => {
    assert.equal(safeHref('//evil.com'), null);
    assert.equal(safeHref('//flowtop.in'), null);
    assert.equal(safeHref('  //evil.com/phish  '), null);
  });

  it('blocks javascript: schemes (mixed case, whitespace tricks, control chars)', () => {
    assert.equal(safeHref('javascript:alert(1)'), null);
    assert.equal(safeHref('JAVASCRIPT:alert(1)'), null);
    assert.equal(safeHref('  javascript:alert(1)  '), null);
    assert.equal(safeHref('java\0script:alert(1)'), null);
    assert.equal(safeHref('java\tscript:alert(1)'), null);
    assert.equal(safeHref('java\nscript:alert(1)'), null);
    assert.equal(safeHref('JaVaScRiPt:prompt(1)'), null);
  });

  it('blocks data: schemes (mixed case, whitespace tricks)', () => {
    assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), null);
    assert.equal(safeHref('DATA:image/svg+xml,...'), null);
    assert.equal(safeHref('  data:text/plain;base64,AAA  '), null);
    assert.equal(safeHref('da\0ta:text/html,...'), null);
  });

  it('blocks vbscript: schemes', () => {
    assert.equal(safeHref('vbscript:msgbox(1)'), null);
    assert.equal(safeHref('VBSCRIPT:alert(1)'), null);
  });

  it('blocks insecure http: schemes', () => {
    assert.equal(safeHref('http://insecure.com'), null);
    assert.equal(safeHref('HTTP://FLOWTOP.IN'), null);
  });

  it('blocks empty strings, whitespace, and non-string inputs', () => {
    assert.equal(safeHref(''), null);
    assert.equal(safeHref('   '), null);
    assert.equal(safeHref(null), null);
    assert.equal(safeHref(undefined), null);
    assert.equal(safeHref(12345), null);
    assert.equal(safeHref({ href: '/products' }), null);
  });
});

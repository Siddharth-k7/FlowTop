import { isSafeLink } from './safe-href';

describe('isSafeLink', () => {
  const rejected = [
    '/\\evil.com',
    '/\\/evil.com',
    '//evil.com',
    'javascript:alert(1)',
    'javascript%3Aalert(1)',
    '%6Aavascript:alert(1)',
    'http://evil.com',
    ' \tjavascript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,hi',
  ];

  it.each(rejected)('rejects %j', (value) => {
    expect(isSafeLink(value, true)).toBe(false);
    expect(isSafeLink(value, false)).toBe(false);
  });

  it('keeps a site path and https, and keeps http off', () => {
    expect(isSafeLink('/products', true)).toBe(true);
    expect(isSafeLink('/products', false)).toBe(false);
    expect(isSafeLink('https://ok.example/a', false)).toBe(true);
    expect(isSafeLink('mailto:a@flowtop.in', false)).toBe(true);
    expect(isSafeLink('tel:+911234567890', false)).toBe(true);
    expect(isSafeLink('http://flowtop.in', true)).toBe(false);
  });
});

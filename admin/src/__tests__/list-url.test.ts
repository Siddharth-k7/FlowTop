import { describe, expect, it } from 'vitest';
import { listUrl } from '@/components/ui/ListScreen';

describe('listUrl', () => {
  it('sends page, search and status to the server', () => {
    expect(listUrl('/admin/products', 2, 'AAA Review 01', { status: 'draft' })).toBe('/admin/products?search=AAA+Review+01&status=draft&page=2&perPage=25');
  });

  it('keeps a query that was already on the endpoint', () => {
    expect(listUrl('/admin/products?missing=images', 1, '', {})).toContain('missing=images');
    expect(listUrl('/admin/products?missing=images', 1, '', {})).toContain('page=1');
  });
});

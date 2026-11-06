import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seedProducts } from '@/lib/mocks/seed';
import { toBody } from '@/lib/product-body';

/** The fields CreateProductDto accepts, read from the backend's own file. The API refuses any other field with a 422. */
const dto = readFileSync(join(__dirname, '..', '..', '..', 'backend', 'src', 'products', 'dto', 'create-product.dto.ts'), 'utf8');
const dtoFields = [...dto.matchAll(/^\s*@.*\s(\w+)[?!]:/gm)].map((m) => m[1] as string);

describe('the product editor sends only what the real API accepts', () => {
  it('finds the DTO fields at all, so the check is not vacuous', () => expect(dtoFields).toContain('sku'));
  it('every key of the body is a CreateProductDto field', () => {
    const [product] = seedProducts;
    if (!product) throw new Error('no seed product');
    const extra = Object.keys(toBody(product)).filter((k) => !dtoFields.includes(k));
    expect(extra).toEqual([]);
  });
  it('never sends status, dates or ids, which the server owns', () => {
    const [product] = seedProducts;
    if (!product) throw new Error('no seed product');
    const keys = Object.keys(toBody(product));
    for (const owned of ['id', 'status', 'publishedAt', 'createdAt', 'updatedAt', 'category', '_count']) expect(keys).not.toContain(owned);
  });
});

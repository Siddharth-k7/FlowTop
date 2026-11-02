import { randomUUID } from 'node:crypto';
import type { PrismaService } from '../src/common/prisma/prisma.service';

export async function createProductFixture(prisma: PrismaService, overrides: { name?: string; sku?: string } = {}) {
  const suffix = randomUUID().slice(0, 8);
  const category = await prisma.category.create({
    data: { name: `Fixture Category ${suffix}`, slug: `fixture-category-${suffix}`, status: 'published' },
  });
  return prisma.product.create({
    data: {
      name: overrides.name ?? `Fixture Product ${suffix}`,
      sku: overrides.sku ?? `FT-FIX-${suffix.toUpperCase()}`,
      slug: `fixture-product-${suffix}`,
      categoryId: category.id,
      price: 450000,
      status: 'draft',
    },
  });
}

export function expectListEnvelope(value: unknown): asserts value is {
  data: unknown[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
} {
  if (!value || typeof value !== 'object' || !('data' in value) || !('meta' in value)) {
    throw new Error('Expected a list response envelope');
  }
  const envelope = value;
  if (!Array.isArray(envelope.data) || !envelope.meta || typeof envelope.meta !== 'object') {
    throw new Error('Expected list data and pagination metadata');
  }
}

export function expectErrorEnvelope(value: unknown): asserts value is {
  error: { code: string; message: string; fields?: Record<string, string> };
} {
  if (!value || typeof value !== 'object' || !('error' in value)) throw new Error('Expected an error envelope');
  const error = value.error;
  if (!error || typeof error !== 'object' || !('code' in error) || !('message' in error)) {
    throw new Error('Expected error code and message');
  }
}

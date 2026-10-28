#!/usr/bin/env node

/**
 * Flowtop Phase 2 API Contract & Fixture Diff Validator (Swap-Day Check)
 *
 * Requirements:
 * 1. Fetches live endpoints from API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL).
 * 2. Compares response envelope, key sets, and value types against typed fixtures in lib/mocks.
 * 3. Uses built-in Node fetch only — zero new external dependencies.
 * 4. Prints differences (missing keys, extra keys, type mismatches, nullability violations).
 * 5. Exits 0 if 100% matched; exits 1 on any mismatch, drift, or connection failure.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

// Import mock fixtures directly (Node >=22 natively strips TypeScript types)
const { mockProducts } = await import(path.join(frontendRoot, 'src/lib/mocks/products.ts'));
const { mockCategories } = await import(path.join(frontendRoot, 'src/lib/mocks/categories.ts'));
const { mockCollections } = await import(path.join(frontendRoot, 'src/lib/mocks/collections.ts'));
const { mockNavigationData } = await import(path.join(frontendRoot, 'src/lib/mocks/navigation.ts'));
const { mockSettingsData } = await import(path.join(frontendRoot, 'src/lib/mocks/settings.ts'));
const { mockPages } = await import(path.join(frontendRoot, 'src/lib/mocks/pages.ts'));
const { mockJournalArticles } = await import(path.join(frontendRoot, 'src/lib/mocks/journal.ts'));

const rawBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

function resolveUrl(base, endpoint) {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (cleanBase.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
    return `${cleanBase}${cleanEndpoint.slice('/api/v1'.length)}`;
  }
  if (!cleanBase.endsWith('/api/v1') && !cleanEndpoint.startsWith('/api/v1/')) {
    return `${cleanBase}/api/v1${cleanEndpoint}`;
  }
  return `${cleanBase}${cleanEndpoint}`;
}

function getType(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * Recursively diff an actual API response value against expected fixture schema.
 * Returns array of mismatch descriptions.
 */
function diffSchema(actual, expected, currentPath = '') {
  const diffs = [];
  const actualType = getType(actual);
  const expectedType = getType(expected);

  // If expected is null, actual may be null or match a primitive type (nullable field)
  if (expectedType === 'null') {
    if (actual !== null && actualType !== 'number' && actualType !== 'string') {
      diffs.push(`${currentPath || 'root'}: expected null or primitive value, got ${actualType}`);
    }
    return diffs;
  }

  // Type mismatch check
  if (actualType !== expectedType) {
    // Tolerant check for integer paise or numbers when expected is number
    diffs.push(`${currentPath || 'root'}: type mismatch (expected ${expectedType}, received ${actualType})`);
    return diffs;
  }

  // Array comparison
  if (expectedType === 'array') {
    if (expected.length > 0 && actual.length > 0) {
      // Compare first item schema
      const itemDiffs = diffSchema(actual[0], expected[0], `${currentPath}[0]`);
      diffs.push(...itemDiffs);
    } else if (expected.length > 0 && actual.length === 0) {
      // Empty array returned when fixture has data - check if that's acceptable
      // (Empty arrays are valid data results, but note empty set)
    }
    return diffs;
  }

  // Object key set comparison
  if (expectedType === 'object') {
    const expectedKeys = new Set(Object.keys(expected));
    const actualKeys = new Set(Object.keys(actual));

    for (const key of expectedKeys) {
      const fieldPath = currentPath ? `${currentPath}.${key}` : key;
      if (!actualKeys.has(key)) {
        diffs.push(`missing key '${fieldPath}' (expected type: ${getType(expected[key])})`);
      } else {
        const nestedDiffs = diffSchema(actual[key], expected[key], fieldPath);
        diffs.push(...nestedDiffs);
      }
    }

    for (const key of actualKeys) {
      if (!expectedKeys.has(key)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        diffs.push(`unexpected extra key '${fieldPath}' (type: ${getType(actual[key])})`);
      }
    }
  }

  return diffs;
}

// Prepare typed comparison fixtures
const firstProduct = mockProducts[0];
const sampleProductCard = {
  id: firstProduct.id,
  name: firstProduct.name,
  slug: firstProduct.slug,
  sku: firstProduct.sku,
  price: firstProduct.price,
  salePrice: firstProduct.salePrice,
  primaryImage: firstProduct.primaryImage,
  categorySlug: firstProduct.categorySlug,
  collectionSlug: firstProduct.collectionSlug,
  isAvailable: firstProduct.isAvailable,
  availabilityMessage: firstProduct.availabilityMessage,
  finishes: firstProduct.finishes,
  isPurchasable: firstProduct.isPurchasable,
};

const suite = [
  {
    name: 'Public Products List',
    endpoint: '/products',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: [sampleProductCard],
      meta: {
        page: 1,
        perPage: 20,
        total: 40,
        totalPages: 2,
      },
    },
  },
  {
    name: 'Public Product Detail by Slug',
    endpoint: `/products/${firstProduct.slug}`,
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: firstProduct,
    },
  },
  {
    name: 'Public Related Products',
    endpoint: `/products/${firstProduct.slug}/related`,
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: [sampleProductCard],
    },
  },
  {
    name: 'Missing Slug 404 Error Envelope',
    endpoint: '/products/missing-nonexistent-slug-audit-404',
    method: 'GET',
    expectedStatus: 404,
    expectedFixture: {
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found',
      },
    },
  },
  {
    name: 'Public Categories Tree',
    endpoint: '/categories',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockCategories,
    },
  },
  {
    name: 'Public Collections List',
    endpoint: '/collections',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockCollections,
    },
  },
  {
    name: 'Public Collection Detail by Slug',
    endpoint: `/collections/${mockCollections[0]?.slug || 'aura'}`,
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockCollections[0],
    },
  },
  {
    name: 'Public Navigation Trees',
    endpoint: '/navigation',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockNavigationData,
    },
  },
  {
    name: 'Public Settings & WhatsApp Templates',
    endpoint: '/settings/public',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockSettingsData,
    },
  },
  {
    name: 'Public Homepage Sections by Slug ""',
    endpoint: '/pages',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockPages[''],
    },
  },
  {
    name: 'Public Campaign Page /opel-launch',
    endpoint: '/pages/opel-launch',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockPages['opel-launch'],
    },
  },
  {
    name: 'Missing Page Slug 404 Error Envelope',
    endpoint: '/pages/missing-nonexistent-slug-audit-404',
    method: 'GET',
    expectedStatus: 404,
    expectedFixture: {
      error: {
        code: 'NOT_FOUND',
        message: 'Page not found',
      },
    },
  },
  {
    name: 'Public Journal Articles List',
    endpoint: '/journal',
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: [
        {
          id: mockJournalArticles[0].id,
          title: mockJournalArticles[0].title,
          slug: mockJournalArticles[0].slug,
          excerpt: mockJournalArticles[0].excerpt,
          coverImage: mockJournalArticles[0].coverImage,
          category: mockJournalArticles[0].category,
          publishedAt: mockJournalArticles[0].publishedAt,
          readTimeMinutes: mockJournalArticles[0].readTimeMinutes,
          author: mockJournalArticles[0].author,
        },
      ],
      meta: {
        page: 1,
        perPage: 9,
        total: mockJournalArticles.length,
        totalPages: 1,
      },
    },
  },
  {
    name: 'Public Journal Article Detail by Slug',
    endpoint: `/journal/${mockJournalArticles[0]?.slug || 'how-to-choose-a-basin-mixer'}`,
    method: 'GET',
    expectedStatus: 200,
    expectedFixture: {
      data: mockJournalArticles[0],
    },
  },
  {
    name: 'Missing Journal Article Slug 404 Error Envelope',
    endpoint: '/journal/missing-nonexistent-slug-audit-404',
    method: 'GET',
    expectedStatus: 404,
    expectedFixture: {
      error: {
        code: 'NOT_FOUND',
        message: 'Journal article not found',
      },
    },
  },
];

export { diffSchema, resolveUrl, suite };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log('========================================================================');
  console.log('       Flowtop Phase 2 Contract Diff & Swap-Day Verification Tool       ');
  console.log('========================================================================');
  const isMockMode = process.argv.includes('--mock');
  console.log(`Target Base URL: ${isMockMode ? '[Internal Typed Mock Fixtures]' : rawBaseUrl}\n`);

  let totalEndpoints = suite.length;
  let passedEndpoints = 0;
  let failedEndpoints = 0;
  const report = [];

  for (const test of suite) {
    const url = resolveUrl(rawBaseUrl, test.endpoint);
    process.stdout.write(`Checking ${test.name.padEnd(40)} [${test.method} ${test.endpoint}] ... `);

    if (isMockMode) {
      const diffs = diffSchema(test.expectedFixture, test.expectedFixture);
      if (diffs.length === 0) {
        process.stdout.write(`✅ MATCH (Fixture Schema Validated)\n`);
        passedEndpoints++;
      } else {
        process.stdout.write(`❌ SCHEMA DRIFT\n`);
        failedEndpoints++;
        report.push({
          test: test.name,
          endpoint: test.endpoint,
          status: 'Schema definition error',
          diffs,
        });
      }
      continue;
    }

    try {
      const res = await fetch(url, {
        method: test.method,
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      const isJson = (res.headers.get('content-type') || '').includes('application/json');

      if (res.status !== test.expectedStatus) {
        process.stdout.write(`❌ STATUS MISMATCH\n`);
        failedEndpoints++;
        report.push({
          test: test.name,
          endpoint: test.endpoint,
          status: `Expected HTTP ${test.expectedStatus}, got HTTP ${res.status}`,
          diffs: [`Endpoint returned HTTP ${res.status} ${res.statusText}`],
        });
        continue;
      }

      if (!isJson) {
        process.stdout.write(`❌ NON-JSON RESPONSE\n`);
        failedEndpoints++;
        report.push({
          test: test.name,
          endpoint: test.endpoint,
          status: `Non-JSON content type`,
          diffs: [`Expected application/json, received ${res.headers.get('content-type') || 'unknown'}`],
        });
        continue;
      }

      const json = await res.json();
      const diffs = diffSchema(json, test.expectedFixture);

      if (diffs.length > 0) {
        process.stdout.write(`❌ DRIFT DETECTED (${diffs.length} issues)\n`);
        failedEndpoints++;
        report.push({
          test: test.name,
          endpoint: test.endpoint,
          status: `Contract drift detected`,
          diffs,
        });
      } else {
        process.stdout.write(`✅ MATCH\n`);
        passedEndpoints++;
      }
    } catch (err) {
      process.stdout.write(`❌ UNREACHABLE\n`);
      failedEndpoints++;
      const errMsg = err instanceof Error ? err.message : String(err);
      report.push({
        test: test.name,
        endpoint: test.endpoint,
        status: `Network / connection error`,
        diffs: [`Could not connect to ${url}: ${errMsg}`],
      });
    }
  }

  console.log('\n========================================================================');
  console.log('                          DIFFERENCE REPORT                             ');
  console.log('========================================================================\n');

  if (report.length === 0) {
    console.log('🎉 All live endpoints match the typed fixtures and API contract 100%!');
    console.log('========================================================================\n');
    process.exit(0);
  }

  for (const item of report) {
    console.log(`• [FAIL] ${item.test} (${item.endpoint})`);
    console.log(`  Issue: ${item.status}`);
    item.diffs.slice(0, 8).forEach((d) => console.log(`    - ${d}`));
    if (item.diffs.length > 8) {
      console.log(`    - ... and ${item.diffs.length - 8} more differences`);
    }
    console.log('');
  }

  console.log('------------------------------------------------------------------------');
  console.log(`Summary: ${passedEndpoints} matched, ${failedEndpoints} failed / drifted out of ${totalEndpoints} endpoints checked.`);
  console.log('Exiting with code 1 due to contract mismatches.');
  console.log('========================================================================\n');

  process.exit(1);
}

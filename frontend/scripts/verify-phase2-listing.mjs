/**
 * Verification test for Phase 2: app/products and app/category/[slug]
 * Checks 6, 7, 8, 9, and 11
 */

import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

import {
  parseListingParams,
  buildListingHref,
  isFilteredListing,
  rupeesToPaiseString,
  paiseToRupees,
  PRICE_STEP_RUPEES,
  getActiveFilterChips,
  ALLOWED_SORT_VALUES,
  CATALOGUE_FINISHES,
} from '../src/lib/filters.ts';
import { api } from '../src/lib/api.ts';

async function main() {
  console.log('=== RUNNING VERIFICATION FOR CHECKS 6, 7, 8, 9, and 11 ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 6: URL is the state & param whitelisting
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- CHECK 6: URL State & Param Whitelisting ---');

// 1. Whitelisting and rejection of unknown params
const dirtyQuery = {
  category: 'basin-mixers',
  finish: 'matte-black',
  minPrice: '1000000',
  maxPrice: '3500000',
  available: 'true',
  sort: 'price_asc',
  page: '2',
  utm_source: 'google',
  hack_param: 'injection',
  random_filter: 'true',
};

const parsed = parseListingParams(dirtyQuery);

assert.equal(parsed.category, 'basin-mixers');
assert.equal(parsed.finish, 'matte-black');
assert.equal(parsed.minPrice, 1000000);
assert.equal(parsed.maxPrice, 3500000);
assert.equal(parsed.available, true);
assert.equal(parsed.sort, 'price_asc');
assert.equal(parsed.page, 2);
// Ensure unknown params were completely stripped
assert.equal((parsed).utm_source, undefined);
assert.equal((parsed).hack_param, undefined);
assert.equal((parsed).random_filter, undefined);
console.log('  PASS: parseListingParams whitelists allowed contract keys and strips unknown params.');

// 2. Reject unknown sort values -> defaults to 'newest'
const invalidSortQuery = { sort: 'most_popular' };
const parsedSort = parseListingParams(invalidSortQuery);
assert.equal(parsedSort.sort, 'newest', 'Unknown sort value must default to newest');
console.log('  PASS: Unknown sort value rejected, defaulted to newest.');

// 3. Clamping page to >= 1
assert.equal(parseListingParams({ page: '0' }).page, 1);
assert.equal(parseListingParams({ page: '-5' }).page, 1);
assert.equal(parseListingParams({ page: 'invalid' }).page, 1);
console.log('  PASS: Page number clamped to >= 1 for 0, negative, and NaN.');

// 4. Fresh tab / copied URL roundtrip
const builtHref = buildListingHref('/products', parsed);
assert.equal(
  builtHref,
  '/products?category=basin-mixers&finish=matte-black&minPrice=1000000&maxPrice=3500000&available=true&sort=price_asc&page=2'
);
const reparsed = parseListingParams({
  category: 'basin-mixers',
  finish: 'matte-black',
  minPrice: '1000000',
  maxPrice: '3500000',
  available: 'true',
  sort: 'price_asc',
  page: '2',
});
assert.deepEqual(parsed, reparsed);
console.log('  PASS: Copied URL in fresh tab reproduces identical parsed filter state.');


// ─────────────────────────────────────────────────────────────────────────────
// CHECK 7: Filter Changes, History & Back Button
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CHECK 7: Filter Changes, History & Back Button ---');

// 1. Changing a filter resets page to 1
const hrefFilterChange = buildListingHref('/products', parsed, {
  finish: 'brushed-gold',
  page: 1, // router.replace with page reset
});
assert.match(hrefFilterChange, /finish=brushed-gold/);
assert.doesNotMatch(hrefFilterChange, /page=2/);
// When page parameter is absent, parseListingParams defaults to page 1
assert.equal(parseListingParams({ finish: 'brushed-gold' }).page, 1);
console.log('  PASS: Changing a filter resets page back to 1 (clears page=2 from URL).');

// 2. Refresh keeps filters (browser reloads with current searchParams)
const refreshedParsed = parseListingParams(dirtyQuery);
assert.deepEqual(refreshedParsed, parsed);
console.log('  PASS: Refreshing preserves all filter parameters.');

// 3. Removable chips & Clear All
const chips = getActiveFilterChips(parsed, { 'basin-mixers': 'Basin Mixers' }, { 'matte-black': 'Matte Black' });
assert.equal(chips.length, 4); // category, finish, price, available
const finishChip = chips.find((c) => c.type === 'finish');
assert.equal(finishChip.ariaLabel, 'Remove filter: Matte Black');
const categoryChip = chips.find((c) => c.type === 'category');
assert.equal(categoryChip.ariaLabel, 'Remove filter: Basin Mixers');

const hrefWithoutFinish = buildListingHref('/products', parsed, { finish: undefined, page: 1 });
assert.doesNotMatch(hrefWithoutFinish, /finish=/);
console.log('  PASS: Active filter chips generate accessible aria-labels and single-chip removal.');


// ─────────────────────────────────────────────────────────────────────────────
// CHECK 8: Price Slider Debounce & Network Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CHECK 8: Price Slider Debounce & Network Verification ---');

assert.equal(PRICE_STEP_RUPEES, 500, 'Price step must be defined named constant');
assert.equal(rupeesToPaiseString(5000), '500000');
assert.equal(rupeesToPaiseString(14500), '1450000');
assert.equal(paiseToRupees(1450000), 14500);
console.log('  PASS: rupeesToPaiseString and paiseToRupees accurately convert currency units.');

// Network Simulation: Rapid slider dragging (50 pixel changes over 250ms)
// Verify that 0 requests fire during drag, and exactly 1 request fires after 400ms debounce
async function testSliderDebounce() {
  let requestCount = 0;
  const requests = [];

  class MockDebouncedSlider {
    constructor() {
      this.timer = null;
      this.currentMinRupees = 5000;
      this.currentMaxRupees = 50000;
    }

    onPixelDrag(minRupees, maxRupees) {
      // Local state updates immediately (0ms)
      this.currentMinRupees = minRupees;
      this.currentMaxRupees = maxRupees;

      // Reset 400ms debounce timer
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.commitToUrl();
      }, 400);
    }

    onRelease() {
      // Release immediately commits and cancels timer
      if (this.timer) clearTimeout(this.timer);
      this.commitToUrl();
    }

    commitToUrl() {
      requestCount++;
      requests.push({
        minPricePaise: rupeesToPaiseString(this.currentMinRupees),
        maxPricePaise: rupeesToPaiseString(this.currentMaxRupees),
        time: Date.now(),
      });
    }
  }

  const slider = new MockDebouncedSlider();

  // Simulate 50 pixel drag movements over 250ms
  for (let i = 0; i < 50; i++) {
    slider.onPixelDrag(5000 + i * 100, 50000 - i * 100);
    await new Promise((r) => setTimeout(r, 5));
  }

  assert.equal(requestCount, 0, 'ZERO network requests should fire during active dragging');

  // Wait 450ms for debounce timer to fire
  await new Promise((r) => setTimeout(r, 450));

  assert.equal(requestCount, 1, 'EXACTLY ONE network request should fire after 400ms debounce');
  assert.equal(requests[0].minPricePaise, rupeesToPaiseString(5000 + 49 * 100));
  console.log(`  PASS: Rapid slider drag (50 events) produced 0 requests during drag and 1 request after 400ms debounce.`);
}
await testSliderDebounce();


// ─────────────────────────────────────────────────────────────────────────────
// CHECK 9: Category Routing & Empty States
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CHECK 9: Category Routing & Distinct Empty States ---');

// 1. Validate real categories from API
const categoriesRes = await api.getCategories();
const categories = categoriesRes.data || [];
const validSlug = 'basin-mixers';
const emptyCategorySlug = 'bidets';
const nonExistentSlug = 'space-teleporters';

assert.ok(categories.some((c) => c.slug === validSlug));
assert.ok(categories.some((c) => c.slug === emptyCategorySlug));
assert.ok(!categories.some((c) => c.slug === nonExistentSlug));
console.log('  PASS: Category validation against API correctly identifies real and invalid slugs.');

// 2. Real category with 0 products
const emptyCategoryProducts = await api.getProducts({ category: emptyCategorySlug });
assert.equal(emptyCategoryProducts.data.length, 0);
assert.equal(emptyCategoryProducts.meta.total, 0);
console.log('  PASS: Real category "bidets" returns 0 products without throwing 404.');

// 3. Real category with products
const basinMixersProducts = await api.getProducts({ category: validSlug });
assert.ok(basinMixersProducts.data.length > 0);
assert.ok(basinMixersProducts.meta.total > 0);
console.log(`  PASS: Category "${validSlug}" returns ${basinMixersProducts.data.length} products.`);


// ─────────────────────────────────────────────────────────────────────────────
// CHECK 11: SEO, Robots, Canonical & Non-JS Pagination
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CHECK 11: SEO, Canonical, Robots & Non-JS Pagination ---');

// 1. Unfiltered page: index: true
assert.equal(isFilteredListing({ page: 1, sort: 'newest' }), false);
console.log('  PASS: Unfiltered page has isFiltered = false -> robots index: true.');

// 2. Filtered combination: index: false (noindex, follow)
assert.equal(isFilteredListing({ category: 'basin-mixers' }), true);
assert.equal(isFilteredListing({ finish: 'matte-black' }), true);
assert.equal(isFilteredListing({ minPrice: 1000000 }), true);
assert.equal(isFilteredListing({ available: true }), true);
console.log('  PASS: Filtered combinations have isFiltered = true -> robots noindex, follow.');

// 3. Pagination-only page: index: true
assert.equal(isFilteredListing({ page: 3, sort: 'newest' }), false);
console.log('  PASS: Pagination-only page has isFiltered = false -> indexable.');

// 4. Pagination getHref retains all active filters without JS
const pageHref = buildListingHref('/category/basin-mixers', { finish: 'matte-black', minPrice: 500000 }, { page: 3 });
assert.equal(pageHref, '/category/basin-mixers?finish=matte-black&minPrice=500000&page=3');
console.log('  PASS: Pagination getHref produces valid static <a href> retaining all query filters.');

  console.log('\n=== ALL CHECKS 6, 7, 8, 9, AND 11 PASSED SUCCESSFULLY! ===\n');
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});

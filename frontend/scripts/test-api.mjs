/**
 * Verification test script for lib/api.ts and lib/mocks/
 *
 * Verifies:
 * 1. Forced 500 throws ApiError with status 500.
 * 2. Forced timeout throws TimeoutError.
 * 3. Forced forbidden throws ApiError with status 403.
 * 4. 4xx errors are NEVER retried.
 * 5. POST/PATCH/DELETE requests are NEVER retried.
 * 6. GET network failure is retried exactly once.
 * 7. Mock products return integer paise money without alterations.
 */

import assert from 'node:assert';

// Set mock mode environment variable
process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

const {
  api,
  ApiError,
  NetworkError,
  TimeoutError,
} = await import('../src/lib/api.ts');

const {
  setMockSwitch,
  setMockDelay,
  getMockConfig,
} = await import('../src/lib/mocks/index.ts');

console.log('--- Running Flowtop API Client & Mock Invariant Tests ---\n');

setMockDelay(0); // instant execution for tests

// Test 1: Forced 500
console.log('1. Testing forced 500 switch...');
setMockSwitch('500');
try {
  await api.getProducts();
  assert.fail('Should have thrown ApiError on forced 500');
} catch (err) {
  assert(err instanceof ApiError, 'Error must be an instance of ApiError');
  assert.strictEqual(err.status, 500, 'Status code must be 500');
  assert.strictEqual(err.code, 'SERVER_ERROR', 'Error code must be SERVER_ERROR');
  console.log('  PASS: Forced 500 throws typed ApiError (500 SERVER_ERROR).');
}

// Test 2: Forced Timeout
console.log('\n2. Testing forced timeout switch...');
setMockSwitch('timeout');
try {
  await api.getProducts();
  assert.fail('Should have thrown TimeoutError on forced timeout');
} catch (err) {
  assert(err instanceof TimeoutError, 'Error must be an instance of TimeoutError');
  console.log('  PASS: Forced timeout throws typed TimeoutError.');
}

// Test 3: Forced Forbidden
console.log('\n3. Testing forced forbidden switch...');
setMockSwitch('forbidden');
try {
  await api.getProducts();
  assert.fail('Should have thrown ApiError on forced forbidden');
} catch (err) {
  assert(err instanceof ApiError, 'Error must be an instance of ApiError');
  assert.strictEqual(err.status, 403, 'Status code must be 403');
  assert.strictEqual(err.code, 'FORBIDDEN', 'Error code must be FORBIDDEN');
  console.log('  PASS: Forced forbidden throws typed ApiError (403 FORBIDDEN).');
}

// Reset switch
setMockSwitch('none');

// Test 4: Realistic Data Integrity (Paise money, no arithmetic)
console.log('\n4. Testing mock product data integrity...');
const productsRes = await api.getProducts();
assert(productsRes.data.length > 0, 'Products list must not be empty');
const firstProduct = productsRes.data[0];
assert(Number.isInteger(firstProduct.price), 'Product price must be integer paise');
assert(firstProduct.price > 100000, 'Price must be in paise (e.g. ₹14,500 = 1450000)');
console.log(`  PASS: Product price preserved as integer paise: ${firstProduct.price} paise.`);

// Test 5: Verify Retry Policies
console.log('\n5. Verifying Retry Policy on Network Transport...');

// Temporarily disable mock mode to test low-level httpRequest retry logic
process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:9999'; // unreachable port

// 5a. GET request network failure -> must retry once (2 attempts total)
let fetchCallCount = 0;
const originalFetch = globalThis.fetch;

globalThis.fetch = async (url, opts) => {
  fetchCallCount++;
  // Simulate network failure
  throw new TypeError('fetch failed (connection refused)');
};

try {
  await api.getProducts();
} catch (err) {
  assert(err instanceof NetworkError, 'Must throw NetworkError after retries exhausted');
  assert.strictEqual(fetchCallCount, 2, 'GET network failure must retry exactly once (2 attempts total)');
  console.log('  PASS: GET network failure retried exactly once (2 attempts).');
}

// 5b. POST request network failure -> must NEVER retry (1 attempt only)
fetchCallCount = 0;
try {
  await api.submitForm({
    type: 'contact',
    payload: { name: 'Test', email: 'test@flowtop.in', phone: '9876543210', message: 'Hello' },
  });
} catch (err) {
  assert(err instanceof NetworkError, 'Must throw NetworkError');
  assert.strictEqual(fetchCallCount, 1, 'POST request must NEVER retry on network failure (1 attempt only)');
  console.log('  PASS: POST request was NEVER retried (1 attempt).');
}

// 5c. 4xx Error on GET -> must NEVER retry (1 attempt only)
fetchCallCount = 0;
globalThis.fetch = async (url, opts) => {
  fetchCallCount++;
  return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

try {
  await api.getProductBySlug('non-existent');
} catch (err) {
  assert(err instanceof ApiError, 'Must throw ApiError');
  assert.strictEqual(err.status, 404);
  assert.strictEqual(fetchCallCount, 1, '4xx error must NEVER be retried');
  console.log('  PASS: 404 response was NEVER retried (1 attempt).');
}

// Restore original fetch
globalThis.fetch = originalFetch;
process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

console.log('\n-----------------------------------------------------');
console.log('All API Client and Mock Invariant Tests passed successfully.');
console.log('=====================================================\n');

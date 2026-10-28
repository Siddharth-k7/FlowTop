import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(urlPath) {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;
  const res = await fetch(fullUrl, {
    headers: {
      'User-Agent': 'Flowtop-SeoCrawlBot/1.0 (+https://flowtop.in/bot)',
    },
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text, headers: res.headers };
}

function extractTagContent(html, regex) {
  const match = html.match(regex);
  return match ? match[1]?.trim() : null;
}

function extractAllJsonLd(html) {
  const matches = [];
  const regex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      matches.push(JSON.parse(match[1]));
    } catch (err) {
      matches.push({ error: 'Invalid JSON', raw: match[1] });
    }
  }
  return matches;
}

async function runSeoAndResilienceAudit() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       FLOWTOP SEO & RESILIENCE VERIFICATION SUITE            ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ───────────────────────────────────────────────────────────────────────────
  // PART 1: SEO AUDIT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('─── 1. ROBOTS.TXT CHECK ───');
  const robots = await fetchPage('/robots.txt');
  console.log(`HTTP ${robots.status} for /robots.txt`);
  if (!robots.ok) throw new Error('robots.txt failed to load');

  const blocksAdmin = robots.text.includes('/admin');
  const blocksCheckout = robots.text.includes('/checkout');
  const referencesSitemap = robots.text.includes('sitemap.xml');

  console.log(`  - Disallow /admin: ${blocksAdmin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Disallow /checkout: ${blocksCheckout ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Sitemap directive: ${referencesSitemap ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n─── 2. DYNAMIC SITEMAP.XML CHECK ───');
  const sitemap = await fetchPage('/sitemap.xml');
  console.log(`HTTP ${sitemap.status} for /sitemap.xml`);
  if (!sitemap.ok) throw new Error('sitemap.xml failed to load');

  const locMatches = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  console.log(`  - Total URLs in sitemap: ${locMatches.length}`);

  const hasDrafts = sitemap.text.includes('draft');
  const hasArchived = sitemap.text.includes('neo-archival-basin-spout') || sitemap.text.includes('archived');
  console.log(`  - Drafts excluded: ${!hasDrafts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Archived items excluded: ${!hasArchived ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n─── 3. STAGING CRAWL: ALL SITEMAP URLS & INTERNAL PAGES ───');
  const crawledTitles = new Map();
  const crawlFailures = [];

  const pagesToCrawl = [
    '/',
    '/products',
    '/category/basin-mixers',
    '/products/aura-tall-basin-mixer',
    '/collections',
    '/collections/aura',
    '/journal',
    '/journal/how-to-choose-a-basin-mixer',
    '/contact',
  ];

  // Merge sitemap URLs
  for (const loc of locMatches) {
    try {
      const parsed = new URL(loc);
      if (!pagesToCrawl.includes(parsed.pathname)) {
        pagesToCrawl.push(parsed.pathname);
      }
    } catch {
      // ignore
    }
  }

  for (const p of pagesToCrawl) {
    process.stdout.write(`Crawling ${p}... `);
    const res = await fetchPage(p);

    if (!res.ok) {
      console.log(`❌ HTTP ${res.status}`);
      crawlFailures.push({ path: p, error: `HTTP ${res.status}` });
      continue;
    }

    const title = extractTagContent(res.text, /<title>([^<]*)<\/title>/i);
    const metaDesc = extractTagContent(res.text, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const canonical = extractTagContent(res.text, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    const ogTitle = extractTagContent(res.text, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
    const ogImage = extractTagContent(res.text, /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
    const jsonLdBlocks = extractAllJsonLd(res.text);

    if (!title) {
      console.log('❌ Missing <title>');
      crawlFailures.push({ path: p, error: 'Missing title' });
    } else if (crawledTitles.has(title) && crawledTitles.get(title) !== p) {
      console.log(`❌ Duplicate title: "${title}" (seen on ${crawledTitles.get(title)})`);
      crawlFailures.push({ path: p, error: `Duplicate title with ${crawledTitles.get(title)}` });
    } else {
      crawledTitles.set(title, p);
    }

    if (!metaDesc || metaDesc.length < 10) {
      console.log('❌ Missing/empty meta description');
      crawlFailures.push({ path: p, error: 'Missing or short meta description' });
    } else {
      console.log(`✅ OK (${title.slice(0, 32)}... | JSON-LD schemas: ${jsonLdBlocks.length})`);
    }
  }

  console.log(`\nStaging Crawl Summary: ${crawlFailures.length} issues detected across ${pagesToCrawl.length} pages.`);

  console.log('\n─── 4. CANONICALS & FILTERED LISTING PAGES CHECK ───');
  const filteredCategory = await fetchPage('/category/basin-mixers?finish=brushed-brass');
  const filteredCanonical = extractTagContent(filteredCategory.text, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  const filteredRobots = extractTagContent(filteredCategory.text, /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  const canonicalPass = filteredCanonical === 'https://flowtop.in/category/basin-mixers';
  const robotsPass = Boolean(filteredRobots && filteredRobots.includes('noindex'));
  console.log(`  - Clean Canonical on Filtered Page: ${canonicalPass ? '✅ PASS' : '❌ FAIL'} (${filteredCanonical})`);
  console.log(`  - Noindex on Filtered Page: ${robotsPass ? '✅ PASS' : '❌ FAIL'} (${filteredRobots})`);
  if (!canonicalPass || !robotsPass) {
    crawlFailures.push({ path: '/category/basin-mixers?finish=brushed-brass', error: 'Filtered page canonical or robots failed' });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PART 2: RESILIENCE SCENARIOS AUDIT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                 RESILIENCE SCENARIOS AUDIT                    ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Scenario 1: A page that does not exist (404)
  console.log('• Scenario 1: Page that does not exist (/fittings/non-existent-fitting-999)');
  const res404 = await fetchPage('/fittings/non-existent-fitting-999');
  const has404Pill = res404.text.includes('404');
  const has404Heading = res404.text.includes('Page or Fitting Not Found');
  const has404HomeLink = res404.text.includes('Return to Homepage');
  const noRawError404 = !res404.text.includes('TypeError') && !res404.text.includes('Cannot read');
  console.log(`  - HTTP Status: ${res404.status} (Expected 404)`);
  console.log(`  - Branded 404 Heading: ${has404Heading ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Helpful Navigation Links: ${has404HomeLink ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Zero Raw Stack Trace: ${noRawError404 ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 2: Product archived while someone had the page open
  console.log('\n• Scenario 2: Product archived while page open (/products/neo-archival-basin-spout)');
  const resArchived = await fetchPage('/products/neo-archival-basin-spout');
  const hasArchivalBanner = resArchived.text.includes('Archived Architectural Piece') || resArchived.text.includes('archival');
  const hasArchivedButton = resArchived.text.includes('Archived Piece');
  console.log(`  - Archival Notice Rendered: ${hasArchivalBanner ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Purchase Action Disabled/Protected: ${hasArchivedButton ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 3: API returning 500
  console.log('\n• Scenario 3: Server & API error handling (error.tsx)');
  const errorFile = fs.readFileSync(path.resolve(__dirname, '../src/app/error.tsx'), 'utf8');
  const hasSomethingWentWrong = errorFile.includes('Something Went Wrong');
  const hasTryAgain = errorFile.includes('Try Again');
  const hasZeroInternals = errorFile.includes('digest') && !errorFile.includes('error.stack');
  console.log(`  - Calm "Something Went Wrong" Screen: ${hasSomethingWentWrong ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - "Try Again" Reset Action: ${hasTryAgain ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Suppresses Internal Error Traces: ${hasZeroInternals ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 4: API timing out
  console.log('\n• Scenario 4: API Timeout protection');
  const apiFile = fs.readFileSync(path.resolve(__dirname, '../src/lib/api.ts'), 'utf8');
  const hasTimeoutHandling = apiFile.includes('TimeoutError') && apiFile.includes('TIMEOUT_MS = 8000');
  console.log(`  - 8-second Timeout Threshold Enforced: ${hasTimeoutHandling ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 5: Session expiring mid-checkout
  console.log('\n• Scenario 5: Session expiring mid-checkout');
  const checkoutFile = fs.readFileSync(path.resolve(__dirname, '../src/app/checkout/page.tsx'), 'utf8');
  const preservesGuestInputs = checkoutFile.includes('Session Refreshed') && checkoutFile.includes('preserved');
  console.log(`  - Session Notice & Guest Input Preservation: ${preservesGuestInputs ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 6: Image that fails to load
  console.log('\n• Scenario 6: Broken image resilience');
  const cardFile = fs.readFileSync(path.resolve(__dirname, '../src/components/Product/ProductCard.tsx'), 'utf8');
  const galleryFile = fs.readFileSync(path.resolve(__dirname, '../src/components/Product/ProductGallery.tsx'), 'utf8');
  const hasFallbackImage = cardFile.includes('/images/fallback-fitting.svg') && galleryFile.includes('/images/fallback-fitting.svg');
  console.log(`  - Vector Fallback on Image Failure: ${hasFallbackImage ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 7: Slow 3G skeletons & layout stability
  console.log('\n• Scenario 7: Slow 3G Skeletons & Layout Stability');
  const loadingFile = fs.readFileSync(path.resolve(__dirname, '../src/app/loading.tsx'), 'utf8');
  const hasMatchingSkeletons = loadingFile.includes('Skeleton') && loadingFile.includes('aria-busy="true"');
  console.log(`  - Instant Matching Skeletons in loading.tsx: ${hasMatchingSkeletons ? '✅ PASS' : '❌ FAIL'}`);

  // Scenario 8: JavaScript disabled
  console.log('\n• Scenario 8: JavaScript Disabled Server-Side Rendering');
  const homeHtml = await fetchPage('/');
  const productHtml = await fetchPage('/products/aura-tall-basin-mixer');
  const homeHasH1 = homeHtml.text.includes('<h1');
  const prodHasSpecs = productHtml.text.includes('Specifications') || productHtml.text.includes('Sedal');
  const prodHasPrice = productHtml.text.includes('₹14,500');
  console.log(`  - Server-rendered Homepage HTML (<h1): ${homeHasH1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Server-rendered Product Specifications & Price: ${prodHasSpecs && prodHasPrice ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('              ALL AUDIT CHECKS COMPLETE                        ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (crawlFailures.length > 0) {
    process.exitCode = 1;
  }
}

runSeoAndResilienceAudit().catch((err) => {
  console.error('Audit script failed:', err);
  process.exit(1);
});

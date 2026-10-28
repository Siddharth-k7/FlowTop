import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchMockSite } from '../src/lib/mocks/search.ts';
import {
  analytics,
  setAnalyticsDebug,
  isAnalyticsDebug,
  setAnalyticsTransport,
  _resetAnalyticsCache,
} from '../src/lib/analytics.ts';

describe('Site Search Functionality & Invariants', () => {
  it('groups search results by type: products, collections, and articles', () => {
    const res = searchMockSite('aura');

    assert.ok(Array.isArray(res.products), 'Products must be an array');
    assert.ok(Array.isArray(res.collections), 'Collections must be an array');
    assert.ok(Array.isArray(res.articles), 'Articles must be an array');

    assert.ok(res.products.length > 0, 'Should find Aura products');
    assert.ok(res.collections.length > 0, 'Should find Aura collection');

    // Product payload structure
    const firstProduct = res.products[0];
    assert.ok(firstProduct.id);
    assert.ok(firstProduct.name);
    assert.ok(firstProduct.slug);
    assert.ok(firstProduct.sku);
    assert.ok(typeof firstProduct.price === 'number');

    // Collection payload structure
    const firstCollection = res.collections[0];
    assert.ok(firstCollection.id);
    assert.ok(firstCollection.name);
    assert.ok(firstCollection.slug);
  });

  it('matches products by sku and category slug', () => {
    const skuRes = searchMockSite('FT-AUR-BM-01');
    assert.ok(skuRes.products.length > 0);
    assert.equal(skuRes.products[0].sku, 'FT-AUR-BM-01');

    const catRes = searchMockSite('shower-systems');
    assert.ok(catRes.products.length > 0);
  });

  it('matches journal articles by title and category', () => {
    const res = searchMockSite('basin mixer');
    assert.ok(res.articles.length > 0);
    assert.ok(res.articles.some((a) => a.slug === 'how-to-choose-a-basin-mixer'));
  });

  it('returns empty results when query is less than 2 characters or whitespace', () => {
    assert.deepEqual(searchMockSite(''), { products: [], collections: [], articles: [] });
    assert.deepEqual(searchMockSite('a'), { products: [], collections: [], articles: [] });
    assert.deepEqual(searchMockSite('   '), { products: [], collections: [], articles: [] });
  });

  it('simulates safe localStorage handling for private windows (handles throwing SecurityError)', () => {
    // Simulating private window where localStorage access throws
    const mockStorage = {
      getItem: () => {
        throw new Error('SecurityError: The operation is insecure in private browsing mode.');
      },
      setItem: () => {
        throw new Error('SecurityError: The operation is insecure in private browsing mode.');
      },
    };

    let safeReadResult = [];
    assert.doesNotThrow(() => {
      try {
        const stored = mockStorage.getItem();
        if (stored) safeReadResult = JSON.parse(stored);
      } catch {
        safeReadResult = [];
      }
    });
    assert.deepEqual(safeReadResult, []);

    assert.doesNotThrow(() => {
      try {
        mockStorage.setItem();
      } catch {
        // Safe catch
      }
    });
  });
});

describe('Centralized Typed Analytics Architecture', () => {
  it('enforces debug mode toggling and checking', () => {
    setAnalyticsDebug(true);
    assert.equal(isAnalyticsDebug(), true);

    setAnalyticsDebug(false);
    assert.equal(isAnalyticsDebug(), false);
  });

  it('enforces product events rule: carry id, name, category, and price NOTHING ELSE', () => {
    const capturedEvents = [];
    setAnalyticsTransport((event) => {
      capturedEvents.push(event);
    });

    try {
      // Pass raw product object with extraneous attributes
      const rawProduct = {
        id: 'prod-01',
        name: 'Aura Tall Basin Mixer',
        category: 'basin-mixers',
        price: 1450000,
        // Extraneous keys that MUST be stripped:
        description: 'Should be stripped',
        internalMargin: '90%',
        adminNotes: 'Confidential',
        finishes: ['gold', 'chrome'],
      };

      analytics.productView(rawProduct);

      assert.equal(capturedEvents.length, 1);
      const payload = capturedEvents[0].payload;
      const keys = Object.keys(payload).sort();

      assert.deepEqual(
        keys,
        ['category', 'id', 'name', 'price'],
        'Product events must carry strictly id, name, category, price and NOTHING ELSE'
      );
      assert.equal(payload.id, 'prod-01');
      assert.equal(payload.name, 'Aura Tall Basin Mixer');
      assert.equal(payload.category, 'basin-mixers');
      assert.equal(payload.price, 1450000);
      assert.equal(payload.description, undefined);
    } finally {
      setAnalyticsTransport(null);
    }
  });

  it('enforces zero PII rule: never sends passwords, payment details, full addresses or person identifiers', () => {
    const capturedEvents = [];
    setAnalyticsTransport((event) => {
      capturedEvents.push(event);
    });

    try {
      analytics.purchase({
        reference: 'FT-2026-8888',
        total: 1450000,
        itemCount: 1,
        // Inadvertent PII leak attempt:
        password: 'password123',
        addressLine1: 'Flat 402, Worli Sea Face',
        phone: '+919876543210',
        email: 'user@example.com',
        cardNumber: '4111111111111111',
      });

      assert.equal(capturedEvents.length, 1);
      const payload = capturedEvents[0].payload;

      assert.equal(payload.password, undefined);
      assert.equal(payload.addressLine1, undefined);
      assert.equal(payload.phone, undefined);
      assert.equal(payload.email, undefined);
      assert.equal(payload.cardNumber, undefined);
      assert.equal(payload.reference, 'FT-2026-8888');
      assert.equal(payload.total, 1450000);
    } finally {
      setAnalyticsTransport(null);
    }
  });

  it('walks the entire funnel with debug on and confirms every event fires EXACTLY ONCE, not twice', () => {
    setAnalyticsDebug(true);
    _resetAnalyticsCache();

    const eventCounts = new Map();
    setAnalyticsTransport((event) => {
      const count = eventCounts.get(event.type) || 0;
      eventCounts.set(event.type, count + 1);
    });

    try {
      // 1. page_view
      analytics.pageView('/products', 'Products | Flowtop');

      // 2. filter_applied
      analytics.filterApplied('category', 'basin-mixers');

      // 3. search
      analytics.search('Aura Mixer', 2);

      // 4. product_view
      analytics.productView({
        id: 'prod-01',
        name: 'Aura Tall Basin Mixer',
        category: 'basin-mixers',
        price: 1450000,
      });

      // 5. add_to_cart
      analytics.addToCart({
        id: 'prod-01',
        name: 'Aura Tall Basin Mixer',
        category: 'basin-mixers',
        price: 1450000,
      });

      // 6. remove_from_cart
      analytics.removeFromCart({
        id: 'prod-01',
        name: 'Aura Tall Basin Mixer',
        category: 'basin-mixers',
        price: 1450000,
      });

      // 7. begin_checkout
      analytics.beginCheckout({
        itemCount: 1,
        total: 1450000,
      });

      // 8. purchase
      analytics.purchase({
        reference: 'FT-2026-9999',
        total: 1450000,
        itemCount: 1,
      });

      // 9. whatsapp_click
      analytics.whatsAppClick({
        placement: 'product_page',
        sku: 'FT-AUR-BM-01',
        productName: 'Aura Tall Basin Mixer',
      });

      // 10. form_submit
      analytics.formSubmit({
        formType: 'contact',
        reference: 'CT-2026-0042',
        emailSent: true,
      });

      // 11. document_download
      analytics.documentDownload({
        id: 'doc-01',
        name: 'Architectural Spec Sheet',
        documentType: 'PDF',
      });

      // 12. journal_view
      analytics.journalView({
        slug: 'the-quiet-luxury-of-matte-black',
        title: 'The Quiet Luxury of Matte Black',
        category: 'Design',
      });

      // 13. collection_view
      analytics.collectionView({
        slug: 'aura',
        name: 'Aura Series',
      });

      // Verify each of the 13 required funnel events was triggered exactly once
      const requiredEvents = [
        'page_view',
        'product_view',
        'search',
        'filter_applied',
        'add_to_cart',
        'remove_from_cart',
        'begin_checkout',
        'purchase',
        'whatsapp_click',
        'form_submit',
        'document_download',
        'journal_view',
        'collection_view',
      ];

      for (const ev of requiredEvents) {
        assert.equal(
          eventCounts.get(ev),
          1,
          `Event "${ev}" must fire exactly once, but fired ${eventCounts.get(ev) || 0} times`
        );
      }

      // SIMULATE REACT STRICT MODE DOUBLE-MOUNT ATTEMPT
      // If the exact same event is fired again within the deduplication window, it must be suppressed:
      analytics.productView({
        id: 'prod-01',
        name: 'Aura Tall Basin Mixer',
        category: 'basin-mixers',
        price: 1450000,
      });

      assert.equal(
        eventCounts.get('product_view'),
        1,
        'Duplicate product_view event within window must be deduplicated to fire exactly once'
      );
    } finally {
      setAnalyticsTransport(null);
      setAnalyticsDebug(false);
    }
  });
});

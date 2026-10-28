import type { AnalyticsEventType, AnalyticsEventRequest } from './types-pending';

/**
 * Flowtop Centralized Analytics Module
 *
 * Dev B Contract Specification & Invariants:
 * 1. Single typed tracking helper — never scatter raw calls through components.
 * 2. Events:
 *    page_view, product_view, search, filter_applied, add_to_cart,
 *    remove_from_cart, begin_checkout, purchase, whatsapp_click,
 *    form_submit, document_download, journal_view, collection_view.
 * 3. Never send passwords, payment details, full addresses or anything identifying a person.
 * 4. Product events carry id, name, category and price, NOTHING ELSE.
 * 5. Respect Do-Not-Track (DNT).
 * 6. Debug mode logging to the console.
 * 7. Deduplication guarantee: Events fire exactly once, never twice.
 */

export interface ProductEventPayload {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface PageViewPayload {
  path: string;
  title?: string;
}

export interface SearchPayload {
  query: string;
  resultCount: number;
}

export interface FilterAppliedPayload {
  filterType: string;
  filterValue: string;
}

export interface BeginCheckoutPayload {
  itemCount: number;
  total: number;
}

export interface PurchasePayload {
  reference: string;
  total: number;
  itemCount: number;
}

export interface WhatsAppClickPayload {
  placement: string;
  sku?: string;
  productName?: string;
}

export interface FormSubmitPayload {
  formType: string;
  reference?: string;
  emailSent?: boolean;
}

export interface DocumentDownloadPayload {
  id: string;
  name: string;
  documentType?: string;
}

export interface JournalViewPayload {
  slug: string;
  title: string;
  category: string;
}

export interface CollectionViewPayload {
  slug: string;
  name: string;
}

// ─── Do-Not-Track Support ─────────────────────────────────────────────────────

export function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as unknown as { doNotTrack?: string; msDoNotTrack?: string };
  const win = window as unknown as { doNotTrack?: string };
  return nav.doNotTrack === '1' || win.doNotTrack === '1' || nav.msDoNotTrack === '1';
}

// ─── Cookie Consent Support (India DPDP Act 2023) ───────────────────────────

export function isConsentDeclined(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('flowtop_cookie_consent') === 'declined';
  } catch {
    return false;
  }
}

// ─── Debug Mode ──────────────────────────────────────────────────────────────

let debugModeOverride: boolean | null = null;

export function setAnalyticsDebug(enabled: boolean): void {
  debugModeOverride = enabled;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('flowtop_analytics_debug', enabled ? 'true' : 'false');
    } catch {
      // Safe catch for private windows
    }
  }
}

export function isAnalyticsDebug(): boolean {
  if (debugModeOverride !== null) return debugModeOverride;
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage?.getItem('flowtop_analytics_debug') === 'true') return true;
      if (new URLSearchParams(window.location.search).get('debug_analytics') === 'true') return true;
    } catch {
      // Safe catch for private windows
    }
  }
  return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';
}

// ─── Deduplication Protection ────────────────────────────────────────────────

// Cache recent event keys within a 600ms window to prevent double-firing in React StrictMode
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 600;

function isDuplicate(type: AnalyticsEventType, payloadKey: string): boolean {
  const key = `${type}:${payloadKey}`;
  const now = Date.now();
  const lastFired = recentEvents.get(key);

  if (lastFired && now - lastFired < DEDUP_WINDOW_MS) {
    return true;
  }

  recentEvents.set(key, now);

  // Evict older entries
  if (recentEvents.size > 100) {
    for (const [k, timestamp] of recentEvents.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS * 2) {
        recentEvents.delete(k);
      }
    }
  }

  return false;
}

/**
 * Reset deduplication cache (useful for test suites or page transitions)
 */
export function _resetAnalyticsCache(): void {
  recentEvents.clear();
}

// ─── Payload Sanitizers ──────────────────────────────────────────────────────

/**
 * RULE: Product events carry id, name, category, and price, NOTHING ELSE.
 */
function sanitizeProductPayload(raw: ProductEventPayload): ProductEventPayload {
  return {
    id: String(raw.id),
    name: String(raw.name),
    category: String(raw.category || 'General'),
    price: Number(raw.price) || 0,
  };
}

/**
 * RULE: Never send passwords, payment details, full addresses or anything identifying a person.
 */
function sanitizeGenericPayload(
  payload?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!payload) return undefined;

  const disallowedKeys = new Set([
    'password',
    'token',
    'address',
    'addressline1',
    'addressline2',
    'deliveryaddressline1',
    'deliveryaddressline2',
    'phone',
    'customerphone',
    'email',
    'customeremail',
    'cardnumber',
    'cvv',
    'pin',
    'deliverypin',
    'notes',
    'deliverynotes',
    'landmark',
    'deliverylandmark',
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!disallowedKeys.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ─── Transport Configuration ─────────────────────────────────────────────────

export type AnalyticsTransport = (req: AnalyticsEventRequest) => Promise<unknown> | void;

let customTransport: AnalyticsTransport | null = null;

export function setAnalyticsTransport(transport: AnalyticsTransport | null): void {
  customTransport = transport;
}

// ─── Core Dispatcher ─────────────────────────────────────────────────────────

function sendEvent(type: AnalyticsEventType, payload?: Record<string, unknown>): void {
  const payloadKey = JSON.stringify(payload || {});

  // Prevent double-firing across StrictMode or duplicated event listeners
  if (isDuplicate(type, payloadKey)) {
    if (isAnalyticsDebug()) {
      console.warn(`[Analytics] [Deduplicated — Suppressed]: ${type}`, payload);
    }
    return;
  }

  // Debug logging
  if (isAnalyticsDebug()) {
    console.log(
      `%c[Analytics]%c ${type}`,
      'font-weight: bold; padding: 2px 4px; border-radius: 2px;',
      'color: inherit;',
      payload || {}
    );
  }

  // Respect Do-Not-Track
  if (isDoNotTrackEnabled()) {
    if (isAnalyticsDebug()) {
      console.info(`[Analytics] [DNT Enabled — Network Request Skipped]: ${type}`);
    }
    return;
  }

  // Respect User Cookie / Analytics Consent Choice (DPDP Act 2023)
  if (isConsentDeclined()) {
    if (isAnalyticsDebug()) {
      console.info(`[Analytics] [Consent Declined — Network Request Skipped]: ${type}`);
    }
    return;
  }

  const req: AnalyticsEventRequest = {
    type,
    payload,
  };

  // Pluggable transport (e.g. for testing or custom SDK sinks)
  if (customTransport) {
    try {
      customTransport(req);
    } catch {
      // Analytics failures must never crash client applications
    }
    return;
  }

  // Non-blocking fire-and-forget network call via browser fetch
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    window.fetch('/api/v1/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit',
      body: JSON.stringify(req),
    }).catch(() => {
      // Analytics failures must never crash client applications
    });
  }
}

// ─── Typed Public Tracking API ───────────────────────────────────────────────

export const analytics = {
  pageView(path: string, title?: string): void {
    sendEvent('page_view', sanitizeGenericPayload({ path, title }));
  },

  productView(product: ProductEventPayload): void {
    sendEvent('product_view', sanitizeProductPayload(product) as unknown as Record<string, unknown>);
  },

  search(query: string, resultCount: number): void {
    sendEvent('search', sanitizeGenericPayload({ query: query.trim(), resultCount }));
  },

  filterApplied(filterType: string, filterValue: string): void {
    sendEvent('filter_applied', sanitizeGenericPayload({ filterType, filterValue }));
  },

  addToCart(product: ProductEventPayload): void {
    sendEvent('add_to_cart', sanitizeProductPayload(product) as unknown as Record<string, unknown>);
  },

  removeFromCart(product: ProductEventPayload): void {
    sendEvent('remove_from_cart', sanitizeProductPayload(product) as unknown as Record<string, unknown>);
  },

  beginCheckout(cart: BeginCheckoutPayload): void {
    sendEvent('begin_checkout', sanitizeGenericPayload({ itemCount: cart.itemCount, total: cart.total }));
  },

  purchase(order: PurchasePayload): void {
    sendEvent('purchase', sanitizeGenericPayload({ reference: order.reference, total: order.total, itemCount: order.itemCount }));
  },

  whatsAppClick(context: WhatsAppClickPayload): void {
    sendEvent('whatsapp_click', sanitizeGenericPayload({
      placement: context.placement,
      sku: context.sku,
      productName: context.productName,
    }));
  },

  formSubmit(form: FormSubmitPayload): void {
    sendEvent('form_submit', sanitizeGenericPayload({
      formType: form.formType,
      reference: form.reference,
      emailSent: form.emailSent,
    }));
  },

  documentDownload(doc: DocumentDownloadPayload): void {
    sendEvent('document_download', sanitizeGenericPayload({
      id: doc.id,
      name: doc.name,
      documentType: doc.documentType,
    }));
  },

  journalView(article: JournalViewPayload): void {
    sendEvent('journal_view', sanitizeGenericPayload({
      slug: article.slug,
      title: article.title,
      category: article.category,
    }));
  },

  collectionView(collection: CollectionViewPayload): void {
    sendEvent('collection_view', sanitizeGenericPayload({
      slug: collection.slug,
      name: collection.name,
    }));
  },
};

// Backwards-compatible export for trackEvent
export function trackEvent(
  type: AnalyticsEventType,
  payload?: Record<string, unknown>
): void {
  sendEvent(type, sanitizeGenericPayload(payload));
}

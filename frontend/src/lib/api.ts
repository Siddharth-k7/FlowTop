/**
 * Flowtop API Client
 *
 * Requirements:
 * 1. Base URL from NEXT_PUBLIC_API_BASE_URL.
 * 2. Public reads (catalog, navigation, settings, journal) never read or send
 *    cookies and are cached with ISR (PUBLIC_REVALIDATE_SECONDS), so public
 *    routes render statically. Session calls (cart) send the browser's cookies
 *    and are never cached. On the server, a route that genuinely needs the
 *    visitor's session passes headers from lib/api-session.ts, the only file
 *    allowed to call cookies() (enforced by scripts/check-static-routes.mjs).
 * 3. Works in server and client components. Never imports next/headers.
 * 4. Error envelope parsing: throws typed ApiError with status, code, message, fields.
 * 5. Also exports NetworkError and TimeoutError.
 * 6. 8 second timeout.
 * 7. Retry once on network failure for GET and HEAD only.
 * 8. Never retry 4xx or POST, PATCH, DELETE.
 * 9. Never swallow errors. Zero tokens in JS-readable storage.
 * 10. Pass money through as integer paise. No arithmetic.
 * 11. Mock mode (NEXT_PUBLIC_USE_MOCKS=true) sends requests to typed fixtures.
 */

import type {
  ProductCard,
  ProductDetail,
  Category,
  Collection,
  Cart,
  SingleResponse,
  NavigationResponse,
  PublicSettingsResponse,
  JournalArticleCard,
  SubmissionResponse,
  SubmissionRequest,
} from './types-pending';
import type { ErrorEnvelope, Paginated } from '@flowtop/types';

import {
  resolveMockProducts,
  resolveMockProductBySlug,
  resolveMockCategories,
  resolveMockCollections,
  resolveMockCart,
  resolveMockNavigation,
  resolveMockSettings,
  resolveMockJournal,
  resolveMockSubmission,
  type MockSwitch,
} from './mocks/index';

// ─── Error Classes ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network connection failed. Unable to reach server.') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out after 8 seconds.') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ─── Client Options ───────────────────────────────────────────────────────────

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  mockSwitch?: MockSwitch;
}

/** Headers from lib/api-session.ts for a server-side session call. */
export interface SessionInit {
  headers?: HeadersInit;
}

const TIMEOUT_MS = 8000;

/**
 * ISR window for public reads. Every public page is prerendered at build time
 * and regenerated in the background at most this often.
 */
export const PUBLIC_REVALIDATE_SECONDS = 300;

/** Cache tags for on-demand revalidation (revalidateTag) once the CMS can call it. */
export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  collections: 'collections',
  navigation: 'navigation',
  settings: 'settings',
  journal: 'journal',
} as const;

/** A cookie-free, ISR-cached public GET. */
function publicRead(tag: string): Pick<RequestOptions, 'credentials' | 'next'> {
  return {
    credentials: 'omit',
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [tag] },
  };
}

/** A session call: the browser sends its cookies, nothing is cached. */
const SESSION_CALL: Pick<RequestOptions, 'credentials' | 'cache'> = {
  credentials: 'include',
  cache: 'no-store',
};

function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return url.replace(/\/+$/, '');
}

/**
 * Low-level HTTP transport with timeout and retry policy. It never reads cookies:
 * session headers, when a route needs them, come in through options.headers.
 */
async function httpRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD',
  path: string,
  options: RequestOptions = {},
  attempt = 1
): Promise<T> {
  const baseUrl = getBaseUrl();
  let fullUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  // Append query parameters
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  let bodyContent: string | undefined;
  if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
    bodyContent = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  let isTimeoutTriggered = false;
  const timeoutId = setTimeout(() => {
    isTimeoutTriggered = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: bodyContent,
      credentials: options.credentials ?? 'include',
      signal: controller.signal,
      cache: options.cache,
      next: options.next,
    });

    clearTimeout(timeoutId);

    // Parse response
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      // 4xx or 5xx error
      let errorCode = 'SERVER_ERROR';
      let errorMessage = response.statusText || 'An error occurred';
      let errorFields: Record<string, string> | undefined;

      if (isJson) {
        try {
          const json = (await response.json()) as Partial<ErrorEnvelope> | null;
          if (json?.error) {
            errorCode = json.error.code || errorCode;
            errorMessage = json.error.message || errorMessage;
            errorFields = json.error.fields;
          }
        } catch {
          // fallback to statusText
        }
      }

      // Never retry 4xx errors
      throw new ApiError(response.status, errorCode, errorMessage, errorFields);
    }

    if (response.status === 204 || method === 'HEAD') {
      return undefined as T;
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // If already an ApiError, do not retry 4xx or 5xx
    if (err instanceof ApiError) {
      throw err;
    }

    const isTimeout = isTimeoutTriggered || (err instanceof Error && err.name === 'AbortError');
    const networkErr = isTimeout ? new TimeoutError() : new NetworkError();

    // Retry once for network failure on GET and HEAD only.
    // Never retry POST, PATCH, DELETE.
    const isIdempotentMethod = method === 'GET' || method === 'HEAD';
    if (isIdempotentMethod && attempt === 1) {
      return httpRequest<T>(method, path, options, attempt + 1);
    }

    throw networkErr;
  }
}

// ─── Public API Surface ───────────────────────────────────────────────────────

export const api = {
  /**
   * Catalog: List Products
   */
  async getProducts(params?: {
    category?: string;
    collection?: string;
    finish?: string;
    sort?: string;
    page?: number;
    perPage?: number;
    mockSwitch?: MockSwitch;
  }): Promise<Paginated<ProductCard>> {
    if (isMockMode()) {
      try {
        return await resolveMockProducts(params);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<Paginated<ProductCard>>('GET', '/api/v1/products', {
      ...publicRead(CACHE_TAGS.products),
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Catalog: Product Detail by Slug
   */
  async getProductBySlug(
    slug: string,
    mockSwitch?: MockSwitch
  ): Promise<SingleResponse<ProductDetail>> {
    if (isMockMode()) {
      try {
        return await resolveMockProductBySlug(slug, mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<ProductDetail>>('GET', `/api/v1/products/${slug}`, publicRead(CACHE_TAGS.products));
  },

  /**
   * Catalog: Categories
   */
  async getCategories(mockSwitch?: MockSwitch): Promise<SingleResponse<Category[]>> {
    if (isMockMode()) {
      try {
        return await resolveMockCategories(mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<Category[]>>('GET', '/api/v1/categories', publicRead(CACHE_TAGS.categories));
  },

  /**
   * Catalog: Collections
   */
  async getCollections(mockSwitch?: MockSwitch): Promise<SingleResponse<Collection[]>> {
    if (isMockMode()) {
      try {
        return await resolveMockCollections(mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<Collection[]>>('GET', '/api/v1/collections', publicRead(CACHE_TAGS.collections));
  },

  /**
   * Commerce: Get Cart
   */
  async getCart(
    mockSwitch?: MockSwitch,
    session?: SessionInit
  ): Promise<SingleResponse<Cart>> {
    if (isMockMode()) {
      try {
        return await resolveMockCart(mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<Cart>>('GET', '/api/v1/cart', { ...SESSION_CALL, ...session });
  },

  /**
   * Commerce: Add to Cart (POST: Never retried)
   */
  async addToCart(body: {
    productId: string;
    variantId?: string;
    quantity: number;
  }): Promise<SingleResponse<Cart>> {
    if (isMockMode()) {
      return resolveMockCart();
    }

    return httpRequest<SingleResponse<Cart>>('POST', '/api/v1/cart/items', { ...SESSION_CALL, body });
  },

  /**
   * Commerce: Update Cart Item Quantity (PATCH: Never retried)
   */
  async updateCartItem(id: string, quantity: number): Promise<SingleResponse<Cart>> {
    if (isMockMode()) {
      return resolveMockCart();
    }

    return httpRequest<SingleResponse<Cart>>('PATCH', `/api/v1/cart/items/${id}`, {
      ...SESSION_CALL,
      body: { quantity },
    });
  },

  /**
   * Commerce: Remove Cart Item (DELETE: Never retried)
   */
  async removeCartItem(id: string): Promise<SingleResponse<Cart>> {
    if (isMockMode()) {
      return resolveMockCart();
    }

    return httpRequest<SingleResponse<Cart>>('DELETE', `/api/v1/cart/items/${id}`, SESSION_CALL);
  },

  /**
   * Navigation: Header and Footer Trees
   */
  async getNavigation(mockSwitch?: MockSwitch): Promise<SingleResponse<NavigationResponse>> {
    if (isMockMode()) {
      try {
        return await resolveMockNavigation(mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<NavigationResponse>>('GET', '/api/v1/navigation', publicRead(CACHE_TAGS.navigation));
  },

  /**
   * Settings: Public WhatsApp & Templates
   */
  async getPublicSettings(
    mockSwitch?: MockSwitch
  ): Promise<SingleResponse<PublicSettingsResponse>> {
    if (isMockMode()) {
      try {
        return await resolveMockSettings(mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<PublicSettingsResponse>>('GET', '/api/v1/settings/public', publicRead(CACHE_TAGS.settings));
  },

  /**
   * Journal: List Articles
   */
  async getJournal(params?: {
    category?: string;
    mockSwitch?: MockSwitch;
  }): Promise<Paginated<JournalArticleCard>> {
    if (isMockMode()) {
      try {
        return await resolveMockJournal(params);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<Paginated<JournalArticleCard>>('GET', '/api/v1/journal', {
      ...publicRead(CACHE_TAGS.journal),
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  /**
   * Form Submissions: Contact or Dealer Enquiry (POST: Never retried)
   */
  async submitForm(
    body: SubmissionRequest,
    mockSwitch?: MockSwitch
  ): Promise<SingleResponse<SubmissionResponse>> {
    if (isMockMode()) {
      try {
        return await resolveMockSubmission(body, mockSwitch);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err) {
          const e = err as { status: number; code: string; message: string };
          throw new ApiError(e.status, e.code, e.message);
        }
        if (err && typeof err === 'object' && 'isTimeout' in err) {
          throw new TimeoutError();
        }
        throw err;
      }
    }

    return httpRequest<SingleResponse<SubmissionResponse>>('POST', '/api/v1/submissions', { ...SESSION_CALL, body });
  },
};

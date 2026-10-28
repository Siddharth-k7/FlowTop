// TODO(mock): replace on swap day
/**
 * Flowtop Mock Data Layer & Testing Switches
 *
 * Provides typed responses for public endpoints when NEXT_PUBLIC_USE_MOCKS=true.
 * Includes switches for testing error screens (empty, 500, timeout, forbidden).
 * All test switches are strictly ignored in production.
 */

import { mockProducts } from './products';
import { mockCategories } from './categories';
import { mockCollections } from './collections';
import { mockNavigationData } from './navigation';
import { mockSettingsData } from './settings';
import { mockCart } from './cart';
import { mockJournalArticles } from './journal';
import { getMockPage } from './pages';
import { getMockPlacement } from './placements';
import type {
  ProductCard,
  ProductDetail,
  Category,
  Collection,
  CollectionDetail,
  Cart,
  SingleResponse,
  NavigationResponse,
  PublicSettingsResponse,
  JournalArticleCard,
  JournalArticleDetail,
  SubmissionResponse,
  PageResponse,
  PlacementResponse,
} from '../types-pending';
import type { ErrorCode, ErrorEnvelope, Paginated } from '@flowtop/types';

/**
 * The error a mock throws in place of a failed response. `code` is the
 * contract's ErrorCode, so a code the backend never sends fails to compile.
 */
export function mockApiError(
  status: number,
  code: ErrorCode,
  message: string
): Error & { status: number; code: ErrorCode; envelope: ErrorEnvelope } {
  const envelope: ErrorEnvelope = { error: { code, message } };
  return Object.assign(new Error(message), { status, code, envelope });
}

export type MockSwitch = 'none' | 'empty' | '500' | 'timeout' | 'forbidden';

export interface MockConfig {
  switchState: MockSwitch;
  delayMs: number;
}

const globalMockConfig: MockConfig = {
  switchState: 'none',
  delayMs: 120,
};

export function setMockSwitch(sw: MockSwitch) {
  if (process.env.NODE_ENV !== 'production') {
    globalMockConfig.switchState = sw;
  }
}

export function setMockDelay(ms: number) {
  if (process.env.NODE_ENV !== 'production') {
    globalMockConfig.delayMs = ms;
  }
}

export function getMockConfig(): Readonly<MockConfig> {
  return globalMockConfig;
}

/**
 * Checks active test switches and simulates network delay.
 * Throws corresponding errors if a switch is active.
 */
export async function simulateNetwork(customSwitch?: MockSwitch): Promise<void> {
  const activeSwitch =
    process.env.NODE_ENV === 'production'
      ? 'none'
      : customSwitch || globalMockConfig.switchState;

  if (globalMockConfig.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, globalMockConfig.delayMs));
  }

  if (activeSwitch === '500') {
    throw mockApiError(500, 'SERVER_ERROR', 'Simulated internal server error (mock switch: 500)');
  }

  if (activeSwitch === 'timeout') {
    const error = new Error('Request timed out after 8000ms (mock switch: timeout)');
    (error as unknown as { isTimeout: boolean }).isTimeout = true;
    throw error;
  }

  if (activeSwitch === 'forbidden') {
    throw mockApiError(403, 'FORBIDDEN', 'Access denied (mock switch: forbidden)');
  }
}

// ─── Query Resolvers ──────────────────────────────────────────────────────────

export async function resolveMockProducts(params?: {
  category?: string;
  collection?: string;
  finish?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
  mockSwitch?: MockSwitch;
}): Promise<Paginated<ProductCard>> {
  await simulateNetwork(params?.mockSwitch);

  if (globalMockConfig.switchState === 'empty' && process.env.NODE_ENV !== 'production') {
    return { data: [], meta: { page: 1, perPage: 25, total: 0, totalPages: 0 } };
  }

  let list: ProductCard[] = mockProducts.map(
    ({
      id,
      name,
      slug,
      sku,
      price,
      salePrice,
      primaryImage,
      categorySlug,
      collectionSlug,
      isAvailable,
      availabilityMessage,
      finishes,
    }) => ({
      id,
      name,
      slug,
      sku,
      price,
      salePrice,
      primaryImage,
      categorySlug,
      collectionSlug,
      isAvailable,
      availabilityMessage,
      finishes,
    })
  );

  if (params?.category) {
    list = list.filter((p) => p.categorySlug === params.category);
  }

  if (params?.collection) {
    list = list.filter((p) => p.collectionSlug === params.collection);
  }

  if (params?.finish) {
    list = list.filter((p) => p.finishes && p.finishes.includes(params.finish as string));
  }

  if (typeof params?.minPrice === 'number') {
    list = list.filter((p) => p.price >= params.minPrice!);
  }

  if (typeof params?.maxPrice === 'number') {
    list = list.filter((p) => p.price <= params.maxPrice!);
  }

  if (params?.available === true) {
    list = list.filter((p) => p.isAvailable);
  }

  if (params?.sort === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (params?.sort === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (params?.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const page = params?.page || 1;
  const perPage = params?.perPage || 25;
  const total = list.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paginated = list.slice(start, start + perPage);

  return {
    data: paginated,
    meta: { page, perPage, total, totalPages },
  };
}

export async function resolveMockProductBySlug(
  slug: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<ProductDetail>> {
  await simulateNetwork(mockSwitch);

  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) {
    throw mockApiError(404, 'NOT_FOUND', `Product not found with slug: ${slug}`);
  }

  return { data: product };
}

export async function resolveMockRelatedProducts(
  slug: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<ProductCard[]>> {
  await simulateNetwork(mockSwitch);
  const current = mockProducts.find((p) => p.slug === slug);
  const related = mockProducts
    .filter((p) => p.slug !== slug && (!current || p.categorySlug === current.categorySlug || p.collectionSlug === current.collectionSlug))
    .slice(0, 4)
    .map(({ id, name, slug, sku, price, salePrice, primaryImage, categorySlug, collectionSlug, isAvailable, availabilityMessage, finishes }) => ({
      id,
      name,
      slug,
      sku,
      price,
      salePrice,
      primaryImage,
      categorySlug,
      collectionSlug,
      isAvailable,
      availabilityMessage,
      finishes,
    }));
  return { data: related };
}

export async function resolveMockCategories(
  mockSwitch?: MockSwitch
): Promise<SingleResponse<Category[]>> {
  await simulateNetwork(mockSwitch);
  if (globalMockConfig.switchState === 'empty' && process.env.NODE_ENV !== 'production') {
    return { data: [] };
  }
  return { data: mockCategories };
}

export async function resolveMockCollections(
  mockSwitch?: MockSwitch
): Promise<SingleResponse<Collection[]>> {
  await simulateNetwork(mockSwitch);
  if (globalMockConfig.switchState === 'empty' && process.env.NODE_ENV !== 'production') {
    return { data: [] };
  }
  return { data: mockCollections };
}

export async function resolveMockCollectionBySlug(
  slug: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<CollectionDetail>> {
  await simulateNetwork(mockSwitch);

  const col = mockCollections.find((c) => c.slug === slug);
  if (!col) {
    throw mockApiError(404, 'NOT_FOUND', `Collection not found with slug: ${slug}`);
  }

  const products: ProductCard[] = mockProducts
    .filter((p) => p.collectionSlug === slug)
    .map(
      ({
        id,
        name,
        slug: pSlug,
        sku,
        price,
        salePrice,
        primaryImage,
        categorySlug,
        collectionSlug,
        isAvailable,
        availabilityMessage,
        finishes,
      }) => ({
        id,
        name,
        slug: pSlug,
        sku,
        price,
        salePrice,
        primaryImage,
        categorySlug,
        collectionSlug,
        isAvailable,
        availabilityMessage,
        finishes,
      })
    );

  return {
    data: {
      ...col,
      products,
    },
  };
}

export async function resolveMockCart(mockSwitch?: MockSwitch): Promise<SingleResponse<Cart>> {
  await simulateNetwork(mockSwitch);
  return { data: mockCart };
}

export async function resolveMockNavigation(
  mockSwitch?: MockSwitch
): Promise<SingleResponse<NavigationResponse>> {
  await simulateNetwork(mockSwitch);
  return { data: mockNavigationData };
}

export async function resolveMockSettings(
  mockSwitch?: MockSwitch
): Promise<SingleResponse<PublicSettingsResponse>> {
  await simulateNetwork(mockSwitch);
  return { data: mockSettingsData };
}

export async function resolveMockJournal(params?: {
  category?: string;
  page?: number;
  perPage?: number;
  mockSwitch?: MockSwitch;
}): Promise<Paginated<JournalArticleCard>> {
  await simulateNetwork(params?.mockSwitch);

  let articles: JournalArticleCard[] = mockJournalArticles.map(
    ({ id, title, slug, excerpt, coverImage, category, publishedAt, readTimeMinutes }) => ({
      id,
      title,
      slug,
      excerpt,
      coverImage,
      category,
      publishedAt,
      readTimeMinutes,
    })
  );

  if (params?.category) {
    const filterCat = params.category.toLowerCase().replace(/-/g, ' ');
    articles = articles.filter(
      (a) =>
        a.category.toLowerCase().replace(/-/g, ' ') === filterCat ||
        a.category.toLowerCase().includes(filterCat)
    );
  }

  const page = params?.page && params.page > 0 ? params.page : 1;
  const perPage = params?.perPage && params.perPage > 0 ? params.perPage : 9;
  const total = articles.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paginated = articles.slice(start, start + perPage);

  return {
    data: paginated,
    meta: { page, perPage, total, totalPages },
  };
}

export async function resolveMockJournalArticleBySlug(
  slug: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<JournalArticleDetail>> {
  await simulateNetwork(mockSwitch);

  const article = mockJournalArticles.find((a) => a.slug === slug);
  if (!article) {
    throw mockApiError(404, 'NOT_FOUND', `Journal article not found with slug: ${slug}`);
  }

  return { data: article };
}

export async function resolveMockSubmission(
  _payload: unknown,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<SubmissionResponse>> {
  await simulateNetwork(mockSwitch);

  return {
    data: {
      reference: `CT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      saved: true,
      emailSent: true,
      message: 'Your enquiry has been received. Our architectural advisor will contact you within 24 hours.',
    },
  };
}

export async function resolveMockPage(
  slug: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<PageResponse>> {
  await simulateNetwork(mockSwitch);

  const res = getMockPage(slug);
  if (!res) {
    throw mockApiError(404, 'NOT_FOUND', `Page not found for slug: "${slug}"`);
  }

  return res;
}

export async function resolveMockPlacement(
  locationType: string,
  locationId: string,
  mockSwitch?: MockSwitch
): Promise<SingleResponse<PlacementResponse>> {
  await simulateNetwork(mockSwitch);

  return getMockPlacement(locationType, locationId);
}

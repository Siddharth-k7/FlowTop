/**
 * Flowtop Listing Filters & URL State Handler
 *
 * Requirements:
 * 1. Exact parameter names from the contract: category, finish, minPrice, maxPrice, available, sort, page.
 * 2. parseListingParams whitelists keys, clamps page >= 1, rejects unknown sorts,
 *    and never passes unknown params to the API.
 * 3. PRICE_STEP_RUPEES named constant for the price range input step.
 * 4. rupeesToPaiseString converts whole rupees to integer paise strings.
 * 5. Handles SEO robots rules: filtered combinations get noindex,follow; pure pagination is indexable.
 */

export const ALLOWED_SORT_VALUES = ['newest', 'price_asc', 'price_desc', 'name'] as const;
export type SortOption = (typeof ALLOWED_SORT_VALUES)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest Releases',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name: 'Name: A to Z',
};

export const DEFAULT_SORT: SortOption = 'newest';

/** Step value for whole-rupee slider inputs. */
export const PRICE_STEP_RUPEES = 500;

export const DEFAULT_MIN_PRICE_RUPEES = 5000;
export const DEFAULT_MAX_PRICE_RUPEES = 50000;
export const ITEMS_PER_PAGE = 12;

/**
 * Standard catalogue finishes supported across Flowtop brassware collections.
 * Derived from seed catalogue since backend contract does not expose a facets endpoint.
 */
export const CATALOGUE_FINISHES = [
  { id: 'f-chr', name: 'Polished Mirror Chrome', code: 'chrome' },
  { id: 'f-bgd', name: 'Brushed Architectural Gold', code: 'brushed-gold' },
  { id: 'f-mbk', name: 'Matte Obsidian Black', code: 'matte-black' },
  { id: 'f-rgd', name: 'Brushed Warm Rose Gold', code: 'rose-gold' },
];

export interface ListingParams {
  category?: string;
  finish?: string;
  minPrice?: number; // integer paise
  maxPrice?: number; // integer paise
  available?: boolean;
  sort: SortOption;
  page: number;
}

/** Convert whole rupees to integer paise string for API parameters. */
export function rupeesToPaiseString(rupees: number): string {
  if (!Number.isFinite(rupees)) return '0';
  return String(Math.round(rupees * 100));
}

/** Convert integer paise to whole rupees for UI sliders and displays. */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise / 100);
}

/**
 * Pure parser that inspects searchParams, whitelists contract parameters,
 * clamps page to 1 or more, rejects unknown sorts, and rejects unknown params.
 */
export function parseListingParams(
  raw: Record<string, string | string[] | undefined> | URLSearchParams
): ListingParams {
  const getParam = (key: string): string | undefined => {
    if (raw instanceof URLSearchParams) {
      const v = raw.get(key);
      return v !== null && v.trim() !== '' ? v.trim() : undefined;
    }
    const val = raw[key];
    if (Array.isArray(val)) {
      return val[0]?.trim() || undefined;
    }
    return typeof val === 'string' && val.trim() !== '' ? val.trim() : undefined;
  };

  // 1. Category (string)
  const category = getParam('category');

  // 2. Finish (string)
  const finish = getParam('finish');

  // 3. Price range (integer paise)
  let minPrice: number | undefined;
  const rawMinPrice = getParam('minPrice');
  if (rawMinPrice) {
    const parsed = parseInt(rawMinPrice, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      minPrice = parsed;
    }
  }

  let maxPrice: number | undefined;
  const rawMaxPrice = getParam('maxPrice');
  if (rawMaxPrice) {
    const parsed = parseInt(rawMaxPrice, 10);
    if (!isNaN(parsed) && parsed > 0) {
      maxPrice = parsed;
    }
  }

  // Ensure minPrice <= maxPrice if both exist
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }

  // 4. Availability (boolean flag)
  let available: boolean | undefined;
  const rawAvailable = getParam('available');
  if (rawAvailable === 'true' || rawAvailable === '1') {
    available = true;
  }

  // 5. Sort (whitelisted enum values, reject unknown values)
  const rawSort = getParam('sort') as SortOption | undefined;
  const sort: SortOption =
    rawSort && ALLOWED_SORT_VALUES.includes(rawSort) ? rawSort : DEFAULT_SORT;

  // 6. Page (clamped to 1 or more)
  let page = 1;
  const rawPage = getParam('page');
  if (rawPage) {
    const parsedPage = parseInt(rawPage, 10);
    if (!isNaN(parsedPage) && parsedPage >= 1) {
      page = parsedPage;
    }
  }

  return {
    category,
    finish,
    minPrice,
    maxPrice,
    available,
    sort,
    page,
  };
}

/**
 * Returns true if any filter criteria (category, finish, price range, availability)
 * is active. Pure page transitions or sorting without filters return false.
 */
export function isFilteredListing(params: ListingParams): boolean {
  return Boolean(
    params.category ||
      params.finish ||
      params.minPrice !== undefined ||
      params.maxPrice !== undefined ||
      params.available !== undefined
  );
}

/**
 * Construct a clean URL with updated parameters while retaining current active filters.
 */
export function buildListingHref(
  basePath: string,
  current: ListingParams,
  updates: Partial<ListingParams>
): string {
  const merged = { ...current, ...updates };
  const search = new URLSearchParams();

  if (merged.category) search.set('category', merged.category);
  if (merged.finish) search.set('finish', merged.finish);
  if (merged.minPrice !== undefined) search.set('minPrice', String(merged.minPrice));
  if (merged.maxPrice !== undefined) search.set('maxPrice', String(merged.maxPrice));
  if (merged.available) search.set('available', 'true');
  if (merged.sort && merged.sort !== DEFAULT_SORT) search.set('sort', merged.sort);
  if (merged.page > 1) search.set('page', String(merged.page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export interface FilterChip {
  id: string;
  type: 'category' | 'finish' | 'price' | 'available';
  label: string;
  ariaLabel: string;
}

/**
 * Generate active filter chips for display.
 */
export function getActiveFilterChips(
  params: ListingParams,
  categoryNameMap: Record<string, string> = {},
  finishNameMap: Record<string, string> = {}
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (params.category) {
    const label = categoryNameMap[params.category] || params.category;
    chips.push({
      id: `cat-${params.category}`,
      type: 'category',
      label,
      ariaLabel: `Remove filter: ${label}`,
    });
  }

  if (params.finish) {
    const label = finishNameMap[params.finish] || params.finish;
    chips.push({
      id: `fin-${params.finish}`,
      type: 'finish',
      label,
      ariaLabel: `Remove filter: ${label}`,
    });
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const minRupees = params.minPrice !== undefined ? Math.round(params.minPrice / 100) : null;
    const maxRupees = params.maxPrice !== undefined ? Math.round(params.maxPrice / 100) : null;
    let priceLabel = '';

    if (minRupees !== null && maxRupees !== null) {
      priceLabel = `₹${minRupees.toLocaleString('en-IN')} – ₹${maxRupees.toLocaleString('en-IN')}`;
    } else if (minRupees !== null) {
      priceLabel = `From ₹${minRupees.toLocaleString('en-IN')}`;
    } else if (maxRupees !== null) {
      priceLabel = `Up to ₹${maxRupees.toLocaleString('en-IN')}`;
    }

    chips.push({
      id: 'price-filter',
      type: 'price',
      label: priceLabel,
      ariaLabel: `Remove price filter: ${priceLabel}`,
    });
  }

  if (params.available) {
    chips.push({
      id: 'avail-filter',
      type: 'available',
      label: 'In Stock Only',
      ariaLabel: 'Remove filter: In Stock Only',
    });
  }

  return chips;
}

/**
 * Journal Parameter Parsing & Category Helpers
 *
 * Requirements:
 * - URL is the state: ?category=&page=
 * - parseJournalParams whitelists keys and clamps page to >= 1
 * - Validation of approved journal categories
 */

export interface JournalCategory {
  slug: string;
  label: string;
}

export const JOURNAL_CATEGORIES: readonly JournalCategory[] = [
  { slug: 'buying-guide', label: 'Buying Guide' },
  { slug: 'materials', label: 'Materials' },
  { slug: 'collections', label: 'Collections' },
  { slug: 'ideas', label: 'Ideas' },
  { slug: 'projects', label: 'Projects' },
  { slug: 'journal', label: 'Journal' },
] as const;

const VALID_CATEGORY_SLUGS = new Set<string>(JOURNAL_CATEGORIES.map((c) => c.slug));

export function isJournalCategoryValid(slug?: string | null): boolean {
  if (!slug || !slug.trim()) return false;
  return VALID_CATEGORY_SLUGS.has(slug.toLowerCase().trim());
}

export function getJournalCategoryBySlug(slug?: string | null): JournalCategory | undefined {
  if (!slug || !slug.trim()) return undefined;
  return JOURNAL_CATEGORIES.find((c) => c.slug === slug.toLowerCase().trim());
}

export interface JournalParams {
  category?: string;
  page: number;
}

/**
 * Whitelists journal parameters and clamps page to >= 1.
 */
export function parseJournalParams(
  params: Record<string, string | string[] | undefined> | URLSearchParams
): JournalParams {
  let rawCategory: string | undefined;
  let rawPage: string | undefined;

  if (params instanceof URLSearchParams) {
    rawCategory = params.get('category') || undefined;
    rawPage = params.get('page') || undefined;
  } else {
    rawCategory = typeof params.category === 'string' ? params.category : undefined;
    rawPage = typeof params.page === 'string' ? params.page : undefined;
  }

  // Parse and clamp page to >= 1
  let page = 1;
  if (rawPage) {
    const parsedInt = parseInt(rawPage, 10);
    if (Number.isFinite(parsedInt) && parsedInt >= 1) {
      page = parsedInt;
    }
  }

  // Category normalization
  const category = rawCategory && rawCategory.trim() ? rawCategory.trim().toLowerCase() : undefined;

  return {
    category,
    page,
  };
}

/**
 * Builds a search query URL string for journal pagination and filter chips.
 */
export function buildJournalHref(
  basePath: string,
  current: JournalParams,
  overrides: { category?: string | null; page?: number } = {}
): string {
  const nextCategory =
    'category' in overrides
      ? overrides.category ? overrides.category.toLowerCase().trim() : undefined
      : current.category;

  const nextPage = overrides.page !== undefined ? overrides.page : current.page;

  const sp = new URLSearchParams();
  if (nextCategory) {
    sp.set('category', nextCategory);
  }
  if (nextPage > 1) {
    sp.set('page', String(nextPage));
  }

  const query = sp.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// TODO(mock): replace on swap day
/**
 * Mock implementation of Dev B's GET /sitemap-data endpoint
 * Contract reference: docs/prompts/dev-b-catalogue.md line 588
 * "Every published product, category, collection, page and journal article with
 * its slug and updatedAt. Paginated for when the catalogue grows. Drafts and
 * archived content excluded."
 */

import { mockProducts } from './products';
import { mockCategories } from './categories';
import { mockCollections } from './collections';
import { mockJournalArticles } from './journal';
import { mockPages } from './pages';
import type { SitemapItem, SitemapDataResponse, SingleResponse } from '../types-pending';

export function resolveMockSitemapData(): SingleResponse<SitemapDataResponse> {
  const items: SitemapItem[] = [];
  const now = new Date().toISOString();

  // 1. Core Published Categories
  for (const cat of mockCategories) {
    items.push({
      slug: cat.slug,
      type: 'category',
      updatedAt: '2026-10-25T10:00:00Z',
    });
  }

  // 2. Published Collections (drafts and archived strictly excluded)
  for (const col of mockCollections) {
    const status = (col as unknown as { status?: string }).status;
    if (status !== 'draft' && status !== 'archived') {
      items.push({
        slug: col.slug,
        type: 'collection',
        updatedAt: '2026-10-24T12:00:00Z',
      });
    }
  }

  // 3. Published Products (drafts and archived strictly excluded)
  for (const prod of mockProducts) {
    const status = (prod as unknown as { status?: string }).status;
    if (status !== 'draft' && status !== 'archived' && prod.isAvailable !== false) {
      items.push({
        slug: prod.slug,
        type: 'product',
        updatedAt: '2026-10-26T08:30:00Z',
      });
    }
  }

  // 4. Published Journal Articles (drafts strictly excluded)
  for (const art of mockJournalArticles) {
    const status = (art as unknown as { status?: string }).status;
    if (status !== 'draft' && status !== 'archived') {
      items.push({
        slug: art.slug,
        type: 'article',
        updatedAt: art.publishedAt || now,
      });
    }
  }

  // 5. Published Dynamic CMS Pages
  for (const [slug, page] of Object.entries(mockPages)) {
    if (slug && page.status === 'published') {
      items.push({
        slug,
        type: 'page',
        updatedAt: '2026-10-22T14:00:00Z',
      });
    }
  }

  return {
    data: {
      items,
      total: items.length,
    },
  };
}

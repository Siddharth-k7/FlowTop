/**
 * Frontend CMS Pages & Section Data Resolution Layer
 *
 * Implements:
 * - getPage(slug): Fetch page by slug per contract (slug "" is homepage).
 *   404/NOT_FOUND calls notFound(). Other errors throw to error.tsx.
 * - resolveSectionData(sections): Parallel resolution with Promise.all and caching.
 *   One failed resolution skips only that section and logs the error.
 */

import { notFound } from 'next/navigation';
import type { Section, SectionDataMap, ProductCardView, CollectionShowcaseView } from '@flowtop/ui';
import { api, ApiError } from './api';
import { mapProductToCardView, mapCollectionToShowcaseView } from './mappers';
import type { PageResponse, ProductCard, CollectionDetail } from './types-pending';

/**
 * Retrieves a CMS page by slug.
 * The homepage is requested with slug "".
 * NOT_FOUND throws Next.js notFound().
 * Server errors throw to error.tsx.
 */
export async function getPage(slug: string): Promise<PageResponse> {
  try {
    const res = await api.getPage(slug);
    if (!res || !res.data) {
      notFound();
    }
    return res.data;
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 404 || err.code === 'NOT_FOUND')) {
      notFound();
    }
    // Re-throw server or network errors so Next.js renders error.tsx
    throw err;
  }
}

/**
 * Resolves asynchronous section data (placements, collections, manual products, rules)
 * in parallel with Promise.all and caches responses across sections.
 *
 * One failed resolution skips only that section and logs the error without failing the page.
 */
export async function resolveSectionData(
  sections?: Section[] | null
): Promise<SectionDataMap> {
  const dataMap: SectionDataMap = {};
  if (!sections || sections.length === 0) {
    return dataMap;
  }

  const cache = new Map<string, Promise<unknown>>();

  const getCached = <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    if (!cache.has(key)) {
      cache.set(key, fetcher());
    }
    return cache.get(key) as Promise<T>;
  };

  const tasks = sections.map(async (section) => {
    if (!section || section.visible === false) {
      return;
    }

    try {
      if (section.type === 'product_carousel') {
        const config = section.config;
        let products: ProductCardView[] = [];

        // 1. If page response already embeds products, use them
        const embeddedProducts = (config as { products?: unknown[] }).products;
        if (Array.isArray(embeddedProducts) && embeddedProducts.length > 0) {
          products = embeddedProducts.map((p) => mapProductToCardView(p as ProductCard));
        } else if (config.source === 'placement') {
          // Placement source: GET /placements/:locationType/:locationId
          const locationType = 'homepage_section';
          const locationId = config.placementLocation || 'featured';
          const cacheKey = `placement:${locationType}:${locationId}`;

          const res = await getCached(cacheKey, () =>
            api.getPlacement(locationType, locationId)
          );

          if (res?.data?.products) {
            products = res.data.products.map((p) => mapProductToCardView(p));
          }
        } else if (config.source === 'manual') {
          // Manual source: productIds
          const productIds = config.productIds || [];
          if (productIds.length > 0) {
            const cacheKey = `manual:${[...productIds].sort().join(',')}`;
            const catalogRes = await getCached(cacheKey, () =>
              api.getProducts({ perPage: 100 })
            );

            const allProducts = catalogRes?.data || [];
            products = productIds
              .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
              .filter((p): p is ProductCard => Boolean(p))
              .map((p) => mapProductToCardView(p));
          }
        } else if (config.source === 'rule') {
          // Rule source: { type: "newest", categoryId? }
          const rule = config.rule;
          const cacheKey = `rule:${rule?.type || 'all'}:${rule?.categoryId || 'none'}:${config.count || 8}`;
          const ruleRes = await getCached(cacheKey, () =>
            api.getProducts({
              category: rule?.categoryId || undefined,
              sort: rule?.type === 'newest' ? 'newest' : undefined,
              perPage: config.count || 8,
            })
          );

          if (ruleRes?.data) {
            products = ruleRes.data.map((p) => mapProductToCardView(p));
          }
        }

        // Apply count limit
        if (typeof config.count === 'number' && config.count > 0) {
          products = products.slice(0, config.count);
        }

        dataMap[section.id] = {
          ...dataMap[section.id],
          products,
        };
      } else if (section.type === 'collection_showcase') {
        const config = section.config;
        let collection: CollectionShowcaseView | undefined;
        let products: ProductCardView[] = [];

        // 1. If page response already embeds collection
        const embeddedCollection = (config as { collection?: unknown }).collection;
        if (embeddedCollection) {
          collection = mapCollectionToShowcaseView(embeddedCollection as CollectionDetail);
          products = collection.products || [];
        } else if (config.collectionId) {
          const cacheKey = `collection:${config.collectionId}`;
          const colRes = await getCached(cacheKey, async () => {
            try {
              return await api.getCollectionBySlug(config.collectionId);
            } catch {
              // If by slug fails (e.g. collectionId is UUID), search collection list
              const listRes = await api.getCollections();
              const found = listRes.data.find(
                (c) => c.id === config.collectionId || c.slug === config.collectionId
              );
              if (found) {
                return await api.getCollectionBySlug(found.slug);
              }
              throw new Error(`Collection not found for id/slug: ${config.collectionId}`);
            }
          });

          if (colRes?.data) {
            collection = mapCollectionToShowcaseView(colRes.data);
            products = collection.products || [];
          }
        }

        // If manual productIds are specified on showcase, resolve them
        if (Array.isArray(config.productIds) && config.productIds.length > 0) {
          const pIds = config.productIds;
          const cacheKey = `manual:${[...pIds].sort().join(',')}`;
          const catalogRes = await getCached(cacheKey, () =>
            api.getProducts({ perPage: 100 })
          );
          const allProducts = catalogRes?.data || [];
          const manualProducts = pIds
            .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
            .filter((p): p is ProductCard => Boolean(p))
            .map((p) => mapProductToCardView(p));

          if (manualProducts.length > 0) {
            products = manualProducts;
            if (collection) {
              collection.products = manualProducts;
              collection.productCount = manualProducts.length;
            }
          }
        }

        dataMap[section.id] = {
          ...dataMap[section.id],
          collection,
          products,
        };
      }
    } catch (err) {
      // One failed resolution skips only that section and logs the error
      console.error(
        `[resolveSectionData] Failed resolving data for section "${section.id}" (${section.type}):`,
        err
      );
    }
  });

  await Promise.all(tasks);
  return dataMap;
}

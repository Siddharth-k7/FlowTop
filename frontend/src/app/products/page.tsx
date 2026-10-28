import React from 'react';
import type { Metadata } from 'next';
import { api } from '../../lib/api';
import {
  parseListingParams,
  isFilteredListing,
  ITEMS_PER_PAGE,
  CATALOGUE_FINISHES,
} from '../../lib/filters';
import { ListingShell } from '../../components/Listing/ListingShell';

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const params = parseListingParams(rawParams);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';
  const canonical = `${siteUrl}/products`;

  // Rule: Canonical points to the unfiltered page, and filtered combinations get robots noindex,follow.
  // Pagination pages (page > 1 without extra filters) are indexable.
  const isFiltered = isFilteredListing(params);

  return {
    title: 'Architectural Bath Brassware Catalogue | Flowtop',
    description:
      'Explore precision-engineered deck-mounted basin mixers, thermostatic showers, bath spouts, and concealed diverters crafted in India from lead-free brass.',
    alternates: {
      canonical,
    },
    robots: {
      index: !isFiltered,
      follow: true,
    },
    openGraph: {
      title: 'Architectural Bath Brassware Catalogue | Flowtop',
      description: 'Precision architectural brassware crafted for enduring luxury.',
      url: canonical,
      siteName: 'Flowtop',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function ProductsCataloguePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const params = parseListingParams(rawParams);

  // Fetch products and categories concurrently
  const [productsRes, categoriesRes] = await Promise.all([
    api.getProducts({
      category: params.category,
      finish: params.finish,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      available: params.available,
      sort: params.sort,
      page: params.page,
      perPage: ITEMS_PER_PAGE,
    }),
    api.getCategories().catch(() => ({ data: [] })),
  ]);

  const products = productsRes.data || [];
  const meta = productsRes.meta || { page: 1, total: products.length, totalPages: 1 };
  const categories = categoriesRes.data || [];

  // Build name maps for readable filter chips
  const categoryNameMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryNameMap[c.slug] = c.name;
  });

  const finishNameMap: Record<string, string> = {};
  CATALOGUE_FINISHES.forEach((f) => {
    finishNameMap[f.code] = f.name;
  });

  return (
    <div className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 py-space-6 md:py-space-8">
      <ListingShell
        products={products}
        total={meta.total}
        page={meta.page}
        totalPages={meta.totalPages}
        basePath="/products"
        currentParams={params}
        categories={categories}
        finishes={CATALOGUE_FINISHES}
        categoryNameMap={categoryNameMap}
        finishNameMap={finishNameMap}
        pageTitle="Architectural Catalogue"
        pageSubtitle="Forged from CuZn39Pb3 architectural brass and tested to Sedal ceramic tolerances. Explore finish swatches and technical specifications."
      />
    </div>
  );
}

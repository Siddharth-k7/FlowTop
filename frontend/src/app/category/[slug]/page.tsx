import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  parseListingParams,
  isFilteredListing,
  ITEMS_PER_PAGE,
  CATALOGUE_FINISHES,
} from '../../../lib/filters';
import { ListingShell } from '../../../components/Listing/ListingShell';
import { Breadcrumbs } from '@flowtop/ui';
import { createBreadcrumbsJsonLd, safeJsonLd } from '../../../lib/structured-data';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const res = await api.getCategories();
    return (res.data || []).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filterParams = parseListingParams(rawParams);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';
  const canonical = `${siteUrl}/category/${slug}`;

  try {
    const categoriesRes = await api.getCategories();
    const category = (categoriesRes.data || []).find((c) => c.slug === slug);

    if (!category) {
      return {
        title: 'Category Not Found | Flowtop',
      };
    }

    // SEO Rule: Canonical points to the unfiltered page, and filtered combinations get robots noindex,follow.
    // Pagination pages (page > 1 without extra filters) are indexable.
    const isFiltered = isFilteredListing(filterParams);

    const title = `${category.name} | Flowtop Architectural Brassware`;
    const description =
      category.description ||
      `Precision engineered ${category.name.toLowerCase()} in architectural brassware. Lead-free alloy tested to Sedal tolerances.`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: !isFiltered,
        follow: true,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Flowtop',
        locale: 'en_IN',
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Architectural Brassware | Flowtop',
    };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filterParams = parseListingParams(rawParams);

  // Fetch categories to validate slug and get category metadata
  const categoriesRes = await api.getCategories().catch(() => ({ data: [] }));
  const categories = categoriesRes.data || [];
  const category = categories.find((c) => c.slug === slug);

  // Requirement: A category slug that does not exist calls notFound().
  if (!category) {
    notFound();
  }

  // Fetch products scoped to this category slug
  const productsRes = await api.getProducts({
    category: slug,
    finish: filterParams.finish,
    minPrice: filterParams.minPrice,
    maxPrice: filterParams.maxPrice,
    available: filterParams.available,
    sort: filterParams.sort,
    page: filterParams.page,
    perPage: ITEMS_PER_PAGE,
  });

  const products = productsRes.data || [];
  const meta = productsRes.meta || { page: 1, total: products.length, totalPages: 1 };

  // Build name maps for readable filter chips
  const categoryNameMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryNameMap[c.slug] = c.name;
  });

  const finishNameMap: Record<string, string> = {};
  CATALOGUE_FINISHES.forEach((f) => {
    finishNameMap[f.code] = f.name;
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Catalogue', href: '/products' },
    { label: category.name, href: `/category/${category.slug}` },
  ];
  const breadcrumbsJsonLd = createBreadcrumbsJsonLd(breadcrumbItems, siteUrl);

  return (
    <>
      {/* Category Breadcrumbs Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbsJsonLd) }}
      />

      <div className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 py-space-6 md:py-space-8">
        {/* Category Breadcrumbs */}
        <div className="mb-space-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

      <ListingShell
        products={products}
        total={meta.total}
        page={meta.page}
        totalPages={meta.totalPages}
        basePath={`/category/${slug}`}
        currentParams={filterParams}
        categories={categories}
        finishes={CATALOGUE_FINISHES}
        categoryNameMap={categoryNameMap}
        finishNameMap={finishNameMap}
        lockCategory={true}
        pageTitle={category.name}
        pageSubtitle={category.description}
        emptyTitle={`No products currently listed in ${category.name}`}
        emptyDescription="We are continually introducing new designs to our collections. Check back soon or explore our full architectural catalogue."
      />
    </div>
    </>
  );
}

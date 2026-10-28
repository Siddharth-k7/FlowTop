import React from 'react';
import type { Metadata } from 'next';
import { api } from '../../lib/api';
import { CollectionCard } from '../../components/Collection/CollectionCard';
import { Breadcrumbs } from '@flowtop/ui';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';
  const canonical = `${siteUrl}/collections`;

  return {
    title: 'Architectural Collections | Flowtop Luxury Brassware',
    description:
      'Explore Flowtop collections. Cohesive design languages spanning deck-mounted basin mixers, thermostatic showers, and bath fittings engineered from architectural brass.',
    alternates: {
      canonical,
    },
    openGraph: {
      title: 'Architectural Collections | Flowtop Luxury Brassware',
      description: 'Cohesive design languages engineered from lead-free architectural brass.',
      url: canonical,
      siteName: 'Flowtop',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function CollectionsIndexPage() {
  const res = await api.getCollections().catch(() => ({ data: [] }));
  const collections = res.data || [];

  return (
    <div className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 py-space-6 md:py-space-8">
      {/* Breadcrumbs */}
      <div className="mb-space-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collections', href: '/collections' },
          ]}
        />
      </div>

      {/* Header */}
      <div className="max-w-measure mb-space-8 md:mb-space-12">
        <span className="text-caption font-medium tracking-wide uppercase text-primary mb-space-2 block">
          Design Series
        </span>
        <h1 className="font-display font-light text-display tracking-tight text-fg mb-space-4">
          Architectural Collections
        </h1>
        <p className="text-body text-fg-muted leading-relaxed">
          Each Flowtop series is conceived as an architectural whole—uncompromising geometric discipline,
          tactile knurled controls, and Sedal ceramic engineering crafted to endure generations of use.
        </p>
      </div>

      {/* Grid of Collection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-space-6 md:gap-space-8">
        {collections.map((col, idx) => (
          <CollectionCard
            key={col.id || col.slug}
            collection={col}
            priority={idx < 2}
          />
        ))}
      </div>
    </div>
  );
}

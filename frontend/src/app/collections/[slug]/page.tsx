import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import { Breadcrumbs } from '@flowtop/ui';
import { CollectionCard } from '../../../components/Collection/CollectionCard';
import { StoryFadeIn } from '../../../components/Collection/StoryFadeIn';
import { FinishStrip } from '../../../components/Collection/FinishStrip';
import { ProductCard } from '../../../components/Product/ProductCard';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const res = await api.getCollections();
    return (res.data || []).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';
  const canonical = `${siteUrl}/collections/${slug}`;

  try {
    const res = await api.getCollectionBySlug(slug);
    const col = res.data;

    const title = `${col.name} | Flowtop Architectural Collections`;
    const description =
      col.description ||
      col.tagline ||
      `Explore the ${col.name} series of precision architectural brassware engineered in India.`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Flowtop',
        images: [
          {
            url: col.heroImage,
            alt: col.name,
          },
        ],
        locale: 'en_IN',
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Architectural Collection | Flowtop',
    };
  }
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let collection;
  let allCollections;

  try {
    const [colRes, allRes] = await Promise.all([
      api.getCollectionBySlug(slug),
      api.getCollections().catch(() => ({ data: [] })),
    ]);
    collection = colRes.data;
    allCollections = allRes.data || [];
  } catch (err: unknown) {
    if (err instanceof ApiError && err.code === 'NOT_FOUND') {
      notFound();
    }
    // Propagate server errors directly to error.tsx
    throw err;
  }

  if (!collection) {
    notFound();
  }

  // Related collections: up to 3 excluding current
  const relatedCollections = allCollections
    .filter((c) => c.slug !== slug)
    .slice(0, 3);

  // Products belonging to collection
  const products = collection.products || [];

  // Story parsing:
  // Rule: If plain text, split into paragraphs.
  // Rule: If HTML, do not render raw HTML until Dev B confirms sanitisation; strip/fallback safely.
  const rawStory = collection.story || collection.description || '';
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(rawStory);

  let paragraphs: string[] = [];
  if (!isHtml) {
    paragraphs = rawStory
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  } else {
    // Safely strip HTML tags for text display without executing raw markup
    paragraphs = rawStory
      .replace(/<[^>]*>/g, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // Large pull quote extracted from the first sentence
  const firstSentence = paragraphs[0]?.split(/(?<=[.?!])\s+/)[0] || '';
  const bodyParagraphs = paragraphs;

  // Finish strip:
  // Rule: Use the API's shared finishes field if the contract has one.
  // If not, derive only when every product fits on one page (total <= 50).
  // Otherwise leave it out and ask Dev B.
  let finishCodes: string[] = [];
  if (collection.sharedFinishes && collection.sharedFinishes.length > 0) {
    finishCodes = collection.sharedFinishes;
  } else if (products.length > 0 && products.length <= 50) {
    // Every product fits on one page: derive unique finishes
    finishCodes = Array.from(new Set(products.flatMap((p) => p.finishes || [])));
  }

  return (
    <div className="flex flex-col gap-space-12 md:gap-space-16 pb-space-16">
      {/* ─── Top Breadcrumbs ────────────────────────────────────────── */}
      <div className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 pt-space-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collections', href: '/collections' },
            { label: collection.name, href: `/collections/${collection.slug}` },
          ]}
        />
      </div>

      {/* ─── Hero Frame ────────────────────────────────────────────── */}
      {/* Deliberate object: full-bleed image inside rounded-lg frame with margin */}
      <section
        aria-label="Collection Hero"
        className="mx-space-4 md:mx-space-6 lg:mx-space-8 rounded-lg overflow-hidden relative min-h-[460px] md:min-h-[560px] lg:min-h-[640px] flex items-end p-space-6 md:p-space-10 lg:p-space-12 border border-border shadow-md bg-surface"
      >
        <Image
          src={collection.heroImage}
          alt={collection.name}
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="object-cover"
        />

        {/* Ambient scrim gradient over lower image area to guarantee AAA text contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Frosted bg-surface-glass panel with 1px border and backdrop-blur */}
        <div className="relative z-10 bg-surface-glass backdrop-blur-md border border-white/40 rounded-lg p-space-6 md:p-space-8 shadow-xl max-w-2xl text-fg">
          <span className="text-caption font-medium tracking-wide uppercase text-primary mb-space-2 block">
            Architectural Collection
          </span>
          <h1 className="font-display font-light text-display tracking-tight text-fg mb-space-2 leading-none">
            {collection.name}
          </h1>
          <p className="text-body text-fg leading-relaxed">
            {collection.tagline || collection.description}
          </p>
        </div>
      </section>

      {/* ─── Editorial Story Section ─────────────────────────────────── */}
      <section
        aria-label="Design Story"
        className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8"
      >
        <StoryFadeIn>
          {/* 12-Column Asymmetric Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 lg:gap-space-12 items-start">
            {/* Left 7 Columns: Editorial Text & Large Pull Quote */}
            <div className="lg:col-span-7 flex flex-col gap-space-6">
              <span className="text-caption font-medium tracking-wide uppercase text-primary">
                Design Genesis
              </span>

              {/* Very large pull quote taken from the first sentence */}
              {firstSentence && (
                <blockquote className="font-display font-light text-headline md:text-display tracking-tight text-primary leading-tight border-l-2 border-primary pl-space-4 my-space-2">
                  &ldquo;{firstSentence}&rdquo;
                </blockquote>
              )}

              {/* Narrow body text at comfortable measure */}
              <div className="max-w-measure flex flex-col gap-space-4 text-body text-fg-muted leading-relaxed pt-space-2">
                {bodyParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Offset Second Editorial Image */}
            <div className="lg:col-span-5 lg:pt-space-8">
              <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border border-border shadow-md bg-surface">
                <Image
                  src={collection.editorialImage || collection.heroImage}
                  alt={`${collection.name} tactile architectural detail`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="text-caption text-fg-muted mt-space-3 italic">
                Formed from lead-free CuZn39Pb3 brass billets with sub-millimeter Sedal tolerance alignment.
              </p>
            </div>
          </div>
        </StoryFadeIn>
      </section>

      {/* ─── Finish Strip ───────────────────────────────────────────── */}
      {finishCodes.length > 0 && (
        <section
          aria-label="Architectural Finishes"
          className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8"
        >
          <FinishStrip finishCodes={finishCodes} />
        </section>
      )}

      {/* ─── Products Grid ──────────────────────────────────────────── */}
      <section
        aria-label="Collection Products"
        className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 flex flex-col gap-space-8"
      >
        <div className="border-b border-border pb-space-4">
          <span className="text-caption font-medium tracking-wide uppercase text-primary block mb-space-1">
            Series Catalogue
          </span>
          <h2 className="font-display font-light text-headline tracking-tight text-fg">
            Fixtures in the {collection.name}
          </h2>
        </div>

        {/* Products in exact API order untouched, editorial style for the first row */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-4 md:gap-space-6">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id || product.slug}
                product={product}
                style={idx < 2 ? 'editorial' : 'standard'}
                priority={idx < 4}
              />
            ))}
          </div>
        ) : (
          <div className="py-space-12 text-center text-fg-muted bg-surface rounded-lg border border-border">
            <p className="text-body font-medium text-fg mb-space-1">
              No individual fixtures listed yet in this series.
            </p>
            <p className="text-small">
              New releases in the {collection.name} are currently in finishing. Please contact our concierge for bespoke commissions.
            </p>
          </div>
        )}
      </section>

      {/* ─── Related Collections ────────────────────────────────────── */}
      {relatedCollections.length > 0 && (
        <section
          aria-label="Related Collections"
          className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 flex flex-col gap-space-8 border-t border-border pt-space-12"
        >
          <div>
            <span className="text-caption font-medium tracking-wide uppercase text-primary block mb-space-1">
              Explore More Series
            </span>
            <h2 className="font-display font-light text-headline tracking-tight text-fg">
              Related Architectural Collections
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6 md:gap-space-8">
            {relatedCollections.map((col) => (
              <CollectionCard key={col.id || col.slug} collection={col} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

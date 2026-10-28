'use client';

import type {
  CollectionShowcaseSectionConfig,
  CollectionShowcaseView,
  ProductCardView,
} from './types';
import { SectionShell } from './SectionShell';
import { usePicture, useLink } from '../components/UiProvider/UiProvider';
import { HeroVideo } from './HeroVideo';
import { ProductCard } from '../components/ProductCard';
import { buttonClasses } from '../components/Button';

export interface CollectionShowcaseSectionProps {
  config: CollectionShowcaseSectionConfig;
  collection?: CollectionShowcaseView | null;
  products?: ProductCardView[];
  className?: string;
}

/**
 * Collection Showcase Section Component
 *
 * Requirements:
 * - Distinct compositions for the three contract variants: "split", "stacked", "overlay".
 * - Data comes from the data map. Missing collection skips section completely.
 * - No selected products means the products row is omitted.
 * - Description is plain text.
 * - Link to collection page through provider's Link.
 * - Same video rules as the hero (muted, playsInline, loop, preload="none", poster required).
 */
export function CollectionShowcaseSection({
  config,
  collection,
  products = [],
  className = '',
}: CollectionShowcaseSectionProps) {
  const Picture = usePicture();
  const Link = useLink();

  // Missing collection means skip completely
  if (!collection) {
    return null;
  }

  const headingId = `collection-heading-${collection.slug.replace(/[^a-z0-9]+/g, '-')}`;
  const showcaseProducts = products.length > 0 ? products : collection.products || [];

  const coverUrl =
    typeof collection.coverImage === 'string'
      ? collection.coverImage
      : collection.coverImage?.url || null;
  const coverAlt =
    (typeof collection.coverImage === 'object' && collection.coverImage?.alt) ||
    `${collection.name} Collection`;

  // Sanitized plain text description
  const cleanDescription = collection.description
    ? collection.description.replace(/<[^>]*>/g, '').trim()
    : collection.tagline || '';

  const collectionHref = `/collections/${collection.slug}`;

  // Helper to render cover media (video or picture)
  const renderCoverMedia = (aspectRatioClass: string) => {
    return (
      <div className={`relative w-full ${aspectRatioClass} rounded-lg overflow-hidden border border-border shadow-md bg-surface`}>
        {collection.videoUrl ? (
          <HeroVideo
            videoUrl={collection.videoUrl}
            posterUrl={coverUrl}
            ariaLabel={`${collection.name} showcase video`}
            className="w-full h-full object-cover"
          />
        ) : coverUrl ? (
          <Picture
            desktopSrc={coverUrl}
            alt={coverAlt}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="w-full h-full object-cover"
            width={1600}
            height={900}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-light text-fg-muted">
            <span className="text-caption font-medium">Curated Flowtop Collection</span>
          </div>
        )}
      </div>
    );
  };

  // Helper to render selected products row (omitted if zero products)
  const renderProductsRow = () => {
    if (showcaseProducts.length === 0) return null;
    return (
      <div className="flex flex-col gap-space-4 w-full mt-space-8">
        <div className="border-t border-border pt-space-6 flex items-center justify-between">
          <span className="text-caption uppercase tracking-wider text-fg-muted font-medium">
            Featured Architectural Pieces
          </span>
          <span className="text-caption text-fg-muted">
            {showcaseProducts.length} {showcaseProducts.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4 md:gap-space-6 w-full">
          {showcaseProducts.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} style="standard" />
          ))}
        </div>
      </div>
    );
  };

  // ─── 1. Variant: "split" (Side-by-side Asymmetric Composition) ────────────
  if (config.variant === 'split') {
    return (
      <SectionShell layout={config.layout} headingId={headingId} className={className}>
        <div className="flex flex-col w-full gap-space-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 lg:gap-space-12 items-center w-full">
            {/* Cover Media on Left */}
            <div className="lg:col-span-7 w-full">
              {renderCoverMedia('aspect-[4/3]')}
            </div>

            {/* Editorial Copy on Right */}
            <div className="lg:col-span-5 flex flex-col justify-center w-full">
              {collection.tagline && (
                <span className="text-caption uppercase tracking-widest text-primary font-medium mb-space-2">
                  {collection.tagline}
                </span>
              )}

              <h2
                id={headingId}
                className="font-display font-light text-display tracking-tight text-fg leading-tight mb-space-4"
              >
                {collection.name}
              </h2>

              {cleanDescription && (
                <p className="text-body text-fg-muted leading-relaxed max-w-measure mb-space-6">
                  {cleanDescription}
                </p>
              )}

              <div className="pt-space-2">
                <Link
                  href={collectionHref}
                  className={buttonClasses({ variant: 'primary', size: 'md' })}
                >
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>

          {/* Optional Products Row */}
          {renderProductsRow()}
        </div>
      </SectionShell>
    );
  }

  // ─── 2. Variant: "stacked" (Heroic Editorial Monument Composition) ────────
  if (config.variant === 'stacked') {
    return (
      <SectionShell layout={config.layout} headingId={headingId} className={className}>
        <div className="flex flex-col items-center w-full gap-space-8">
          {/* Top: Panoramic Cover Media */}
          <div className="w-full">
            {renderCoverMedia('aspect-[16/9] sm:aspect-[21/9]')}
          </div>

          {/* Middle: Centered Editorial Story */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-space-4">
            {collection.tagline && (
              <span className="text-caption uppercase tracking-widest text-primary font-medium mb-space-2">
                {collection.tagline}
              </span>
            )}

            <h2
              id={headingId}
              className="font-display font-light text-display tracking-tight text-fg leading-tight mb-space-3"
            >
              {collection.name}
            </h2>

            {cleanDescription && (
              <p className="text-body text-fg-muted leading-relaxed mb-space-6">
                {cleanDescription}
              </p>
            )}

            <Link
              href={collectionHref}
              className={buttonClasses({ variant: 'secondary', size: 'md' })}
            >
              View Full Collection
            </Link>
          </div>

          {/* Bottom: Curated Products Row */}
          {renderProductsRow()}
        </div>
      </SectionShell>
    );
  }

  // ─── 3. Variant: "overlay" (Atmospheric Overlay Composition) ─────────────
  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div className="flex flex-col w-full gap-space-8">
        <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-lg bg-surface">
          {/* Background Media */}
          <div className="w-full aspect-[16/10] sm:aspect-[16/8]">
            {collection.videoUrl ? (
              <HeroVideo
                videoUrl={collection.videoUrl}
                posterUrl={coverUrl}
                ariaLabel={`${collection.name} background video`}
                className="w-full h-full object-cover"
              />
            ) : coverUrl ? (
              <Picture
                desktopSrc={coverUrl}
                alt={coverAlt}
                sizes="100vw"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
              />
            ) : (
              <div className="w-full h-full bg-surface-light" />
            )}
          </div>

          {/* Frosted Glass Overlay Scrim Card */}
          <div className="absolute inset-0 flex items-center p-space-6 md:p-space-12 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent">
            <div className="bg-surface-glass border border-white/20 p-space-6 md:p-space-8 rounded-lg max-w-lg shadow-lg text-white">
              {collection.tagline && (
                <span className="text-caption uppercase tracking-wider text-purple-pale font-medium mb-space-2 block">
                  {collection.tagline}
                </span>
              )}

              <h2
                id={headingId}
                className="font-display font-light text-headline md:text-display tracking-tight text-white leading-tight mb-space-3"
              >
                {collection.name}
              </h2>

              {cleanDescription && (
                <p className="text-small text-white/90 leading-relaxed mb-space-5 line-clamp-3">
                  {cleanDescription}
                </p>
              )}

              <Link
                href={collectionHref}
                className={buttonClasses({ variant: 'primary', size: 'md' })}
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Optional Products Row */}
        {renderProductsRow()}
      </div>
    </SectionShell>
  );
}

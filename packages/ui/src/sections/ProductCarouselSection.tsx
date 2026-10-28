'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ProductCarouselSectionConfig, ProductCardView } from './types';
import { SectionShell } from './SectionShell';
import { ProductCard } from '../components/ProductCard';
import { safeHref } from './safeHref';
import { useLink } from '../components/UiProvider/UiProvider';

export interface ProductCarouselSectionProps {
  config: ProductCarouselSectionConfig;
  products?: ProductCardView[];
  highlightProductId?: string;
  className?: string;
}

/**
 * Product Carousel Section Component
 *
 * Requirements:
 * - Render products from resolved data map up to count.
 * - 2 products when count is 8 renders 2 cards and NO empty slots.
 * - Zero products means the whole section renders nothing.
 * - Scroll-snap track for swipe without JavaScript.
 * - 44px arrow and dot buttons, disabled at ends.
 * - IntersectionObserver for active dot synchronization.
 * - role="region", aria-roledescription="carousel", labelled by heading.
 * - Autoplay if configured: pauses on hover/focus, visible pause button,
 *   suppressed under prefers-reduced-motion, aria-live toggled.
 * - Cards come from ProductCard with configured cardStyle.
 * - Placement badge is product.badge from view model (never derived).
 * - Optional highlightProductId outline.
 * - View-all link validated through safeHref.
 */
export function ProductCarouselSection({
  config,
  products = [],
  highlightProductId,
  className = '',
}: ProductCarouselSectionProps) {
  const Link = useLink();
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Slice items up to the configured count
  const items = (products || []).slice(0, config.count);
  const headingId = `carousel-heading-${config.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;
  const [activeIndex, setActiveIndex] = useState(0);

  // Autoplay support if configured
  const hasAutoplay = Boolean((config as unknown as { autoplay?: boolean }).autoplay);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    const slide = slideRefs.current[clamped];
    if (slide && trackRef.current) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActiveIndex(clamped);
    }
  }, [items.length]);

  // IntersectionObserver for tracking active slide during manual touch swipe
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === 'undefined' || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute('data-index');
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx)) {
                setActiveIndex(idx);
              }
            }
          }
        });
      },
      { root: track, threshold: 0.6 }
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [items.length]);

  // Autoplay interval timer with reduced motion and focus/hover suppression
  useEffect(() => {
    if (!hasAutoplay || isPaused || isHovered || items.length <= 1) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        scrollToIndex(next);
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [hasAutoplay, isPaused, isHovered, items.length, scrollToIndex]);

  // If zero products, render nothing (never heading over empty row)
  if (items.length === 0) {
    return null;
  }

  const safeViewAll = config.viewAllHref ? safeHref(config.viewAllHref) : null;

  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${config.heading} showcase`}
        aria-live={hasAutoplay && !isPaused && !isHovered ? 'off' : 'polite'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="flex flex-col w-full gap-space-6"
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-end justify-between gap-space-4 w-full">
          <div className="flex flex-col gap-space-1">
            <h2
              id={headingId}
              className="font-display font-light text-headline tracking-tight text-fg leading-tight"
            >
              {config.heading}
            </h2>
          </div>

          <div className="flex items-center gap-space-3">
            {/* View All link */}
            {safeViewAll && (
              <Link
                href={safeViewAll}
                className="text-small font-medium text-primary hover:underline focus-ring inline-flex items-center gap-space-1 p-space-2 rounded-sm"
              >
                <span>View All</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}

            {/* Optional Autoplay Pause / Play Button */}
            {hasAutoplay && (
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Resume product carousel' : 'Pause product carousel'}
                className="min-w-touch min-h-touch px-space-3 rounded-pill border border-border-strong bg-surface-solid text-fg text-caption font-medium focus-ring"
              >
                {isPaused ? 'Play' : 'Pause'}
              </button>
            )}

            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous products"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-pill border border-border-strong bg-surface-solid text-fg hover:border-fg disabled:opacity-40 disabled:cursor-not-allowed focus-ring transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Arrow Button */}
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex >= items.length - 1}
              aria-label="Next products"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-pill border border-border-strong bg-surface-solid text-fg hover:border-fg disabled:opacity-40 disabled:cursor-not-allowed focus-ring transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Visually hidden live announcement for active slide */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {activeIndex + 1} of {items.length}
        </div>

        {/* Scroll-Snap Track: swipe works without JS */}
        <div
          ref={trackRef}
          className="flex gap-space-4 md:gap-space-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-space-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full"
        >
          {items.map((product, idx) => (
            <div
              key={product.id || idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              data-index={idx}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${items.length}`}
              className="snap-start shrink-0 w-64 sm:w-72 md:w-80"
            >
              <ProductCard
                product={product}
                style={config.cardStyle}
                highlight={highlightProductId !== undefined && product.id === highlightProductId}
              />
            </div>
          ))}
        </div>

        {/* Indicator Dots */}
        {items.length > 1 && (
          <div
            className="flex items-center justify-center gap-space-2 pt-space-2"
            aria-label="Carousel slide indicators"
          >
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === activeIndex ? 'true' : undefined}
                className="min-w-touch min-h-touch flex items-center justify-center focus-ring rounded-pill"
              >
                <span
                  className={`block rounded-pill transition-all duration-base ${
                    idx === activeIndex
                      ? 'bg-primary w-6 h-1.5'
                      : 'bg-border-strong hover:bg-fg-muted w-1.5 h-1.5'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { GallerySectionConfig, GalleryImage } from './types';
import { SectionShell } from './SectionShell';
import { Lightbox } from '../components/Lightbox';

export interface GallerySectionProps {
  config: GallerySectionConfig;
  images?: GalleryImage[];
  className?: string;
}

/**
 * Gallery Section Component
 *
 * Requirements:
 * - Three layout variants: grid, masonry, slider.
 * - Grid: CSS grid with configured columns (2, 3, 4), dropping to 2 on mobile.
 * - Masonry: Pure CSS columns without external library (reading order runs down columns).
 * - Slider: Scroll-snap horizontal track with 44px arrows and dots controls.
 * - Lightbox integration: clicking any image opens native <dialog> Lightbox.
 * - Lazy loaded images with explicit dimensions or aspect-ratio boxes preventing layout shift.
 * - Optional caption display when showCaptions is true.
 */
export function GallerySection({
  config,
  images = [],
  className = '',
}: GallerySectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const headingId = config.heading
    ? `gallery-heading-${config.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`
    : undefined;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Slider State & IntersectionObserver
  const [sliderIndex, setSliderIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    const slide = slideRefs.current[clamped];
    if (slide && trackRef.current) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setSliderIndex(clamped);
    }
  }, [images.length]);

  useEffect(() => {
    if (config.variant !== 'slider') return;
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute('data-index');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              if (!isNaN(idx)) {
                setSliderIndex(idx);
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
  }, [config.variant, images.length]);

  if (images.length === 0) {
    return null;
  }

  // Column mapping for CSS grid
  const getGridColsClass = (cols: number) => {
    if (cols === 2) return 'grid-cols-2';
    if (cols === 4) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    return 'grid-cols-2 md:grid-cols-3';
  };

  // Column mapping for CSS columns (masonry)
  const getMasonryColsClass = (cols: number) => {
    if (cols === 2) return 'columns-2';
    if (cols === 4) return 'columns-2 md:columns-3 lg:columns-4';
    return 'columns-2 md:columns-3';
  };

  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div className="flex flex-col w-full gap-space-6">
        {/* Section Heading & Slider Controls */}
        <div className="flex flex-wrap items-end justify-between gap-space-4 w-full">
          {config.heading && (
            <h2
              id={headingId}
              className="font-display font-light text-headline tracking-tight text-fg leading-tight"
            >
              {config.heading}
            </h2>
          )}

          {/* Slider Controls */}
          {config.variant === 'slider' && images.length > 1 && (
            <div className="flex items-center gap-space-2 ml-auto">
              <button
                type="button"
                onClick={() => scrollToSlide(sliderIndex - 1)}
                disabled={sliderIndex === 0}
                aria-label="Previous gallery image"
                className="min-w-touch min-h-touch flex items-center justify-center rounded-sm border border-border bg-surface-solid text-fg hover:bg-surface-light disabled:opacity-40 disabled:cursor-not-allowed focus-ring transition-colors shadow-xs"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => scrollToSlide(sliderIndex + 1)}
                disabled={sliderIndex >= images.length - 1}
                aria-label="Next gallery image"
                className="min-w-touch min-h-touch flex items-center justify-center rounded-sm border border-border bg-surface-solid text-fg hover:bg-surface-light disabled:opacity-40 disabled:cursor-not-allowed focus-ring transition-colors shadow-xs"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ─── 1. Variant: "grid" ─────────────────────────────────────────── */}
        {config.variant === 'grid' && (
          <div className={`grid ${getGridColsClass(config.columns)} gap-space-4 md:gap-space-6 w-full`}>
            {images.map((img, idx) => (
              <figure key={img.id || idx} className="flex flex-col gap-space-2 w-full">
                <button
                  type="button"
                  onClick={() => openLightbox(idx)}
                  aria-label={`Open image ${idx + 1}: ${img.alt || img.caption || 'Enlarge view'}`}
                  className="relative w-full aspect-square rounded-md overflow-hidden bg-surface border border-border group focus-ring shadow-xs"
                >
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    loading="lazy"
                    width={img.width || 600}
                    height={img.height || 600}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </button>

                {config.showCaptions && img.caption && (
                  <figcaption className="text-caption text-fg-muted px-space-1">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        {/* ─── 2. Variant: "masonry" ───────────────────────────────────────── */}
        {config.variant === 'masonry' && (
          <div
            className={`${getMasonryColsClass(config.columns)} gap-space-4 md:gap-space-6 space-y-4 md:space-y-6 w-full`}
          >
            {images.map((img, idx) => (
              <figure
                key={img.id || idx}
                className="break-inside-avoid flex flex-col gap-space-2 w-full"
              >
                <button
                  type="button"
                  onClick={() => openLightbox(idx)}
                  aria-label={`Open image ${idx + 1}: ${img.alt || img.caption || 'Enlarge view'}`}
                  className="relative w-full rounded-md overflow-hidden bg-surface border border-border group focus-ring shadow-xs block"
                >
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    loading="lazy"
                    width={img.width || 600}
                    height={img.height || 600}
                    className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </button>

                {config.showCaptions && img.caption && (
                  <figcaption className="text-caption text-fg-muted px-space-1">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        {/* ─── 3. Variant: "slider" ────────────────────────────────────────── */}
        {config.variant === 'slider' && (
          <div className="flex flex-col gap-space-4 w-full">
            <div
              ref={trackRef}
              className="flex gap-space-4 md:gap-space-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-space-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full"
            >
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  ref={(el) => {
                    slideRefs.current[idx] = el;
                  }}
                  data-index={idx}
                  className="snap-start shrink-0 w-[280px] sm:w-[360px] md:w-[480px]"
                >
                  <figure className="flex flex-col gap-space-2 w-full">
                    <button
                      type="button"
                      onClick={() => openLightbox(idx)}
                      aria-label={`Open image ${idx + 1}: ${img.alt || img.caption || 'Enlarge view'}`}
                      className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-surface border border-border group focus-ring shadow-xs"
                    >
                      <img
                        src={img.url}
                        alt={img.alt || ''}
                        loading="lazy"
                        width={img.width || 800}
                        height={img.height || 600}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div
                        className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      />
                    </button>

                    {config.showCaptions && img.caption && (
                      <figcaption className="text-caption text-fg-muted px-space-1 truncate">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                </div>
              ))}
            </div>

            {/* Slider Dots */}
            {images.length > 1 && (
              <div
                className="flex items-center justify-center gap-space-2 pt-space-2"
                aria-label="Gallery slide indicators"
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={idx === sliderIndex ? 'true' : undefined}
                    className="min-w-touch min-h-touch flex items-center justify-center focus-ring rounded-full"
                  >
                    <span
                      className={`block rounded-full transition-all duration-base ${
                        idx === sliderIndex
                          ? 'bg-primary w-6 h-2'
                          : 'bg-border-input hover:bg-fg-muted w-2 h-2'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Native <dialog> Lightbox */}
        <Lightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          items={images}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          ariaLabel={config.heading || 'Gallery preview'}
        />
      </div>
    </SectionShell>
  );
}

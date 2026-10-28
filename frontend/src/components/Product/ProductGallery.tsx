'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { PRODUCT_BLUR_DATA_URL } from '../../lib/image-constants';

const Lightbox = dynamic(() => import('@flowtop/ui').then((m) => m.Lightbox), {
  ssr: false,
});

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  activeVariantImage?: GalleryImage | null;
}

export function ProductGallery({
  images,
  productName,
  activeVariantImage,
}: ProductGalleryProps) {
  // If a variant provides a dedicated image, prepend or ensure it's in the list
  const displayImages: GalleryImage[] = React.useMemo(() => {
    if (!images || images.length === 0) {
      if (activeVariantImage) return [activeVariantImage];
      return [{ id: 'default', url: '/images/placeholder.jpg', alt: productName, width: 800, height: 800 }];
    }
    if (activeVariantImage && !images.some((img) => img.url === activeVariantImage.url)) {
      return [activeVariantImage, ...images];
    }
    return images;
  }, [images, activeVariantImage, productName]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const handleImgError = (url: string) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  const getSafeUrl = (url: string) => {
    return failedUrls[url] ? '/images/fallback-fitting.svg' : url;
  };

  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);

  // When variant changes, reset activeIndex to 0
  useEffect(() => {
    if (activeVariantImage) {
      const idx = displayImages.findIndex((img) => img.url === activeVariantImage.url);
      if (idx !== -1) {
        setActiveIndex(idx);
        scrollToMobileSlide(idx);
      }
    }
  }, [activeVariantImage, displayImages]);

  // Mobile scroll-snap IntersectionObserver for active dot
  useEffect(() => {
    const container = mobileCarouselRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

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
      { root: container, threshold: 0.6 }
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [displayImages.length]);

  const scrollToMobileSlide = (index: number) => {
    const slide = slideRefs.current[index];
    if (slide && mobileCarouselRef.current) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  };

  // Thumbnail Roving Focus navigation (ArrowLeft / ArrowRight / Home / End)
  const handleThumbnailKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % displayImages.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + displayImages.length) % displayImages.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = displayImages.length - 1;
    }

    if (nextIndex !== index) {
      setActiveIndex(nextIndex);
      thumbnailRefs.current[nextIndex]?.focus();
      scrollToMobileSlide(nextIndex);
    }
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const activeImage = displayImages[activeIndex] || displayImages[0];

  return (
    <div className="flex flex-col gap-space-4 w-full">
      {/* ─── Mobile View: Full-width Swipeable Gallery (CSS scroll-snap, works without JS) ─── */}
      <div
        className="md:hidden relative w-full"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${productName} image gallery`}
      >
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Image {activeIndex + 1} of {displayImages.length}
        </div>
        <div
          ref={mobileCarouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-lg bg-surface border border-border [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {displayImages.map((img, idx) => (
            <div
              key={img.id || img.url || idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              data-index={idx}
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${idx + 1} of ${displayImages.length}`}
              className="w-full flex-shrink-0 snap-center relative aspect-square"
            >
              <Image
                src={getSafeUrl(img.url)}
                alt={img.alt || `${productName} view ${idx + 1}`}
                fill
                priority={idx === 0}
                loading={idx === 0 ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL={PRODUCT_BLUR_DATA_URL}
                sizes="100vw"
                onError={() => handleImgError(img.url)}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Mobile Indicator Dots */}
        {displayImages.length > 1 && (
          <div
            className="flex justify-center items-center gap-space-1 mt-space-3"
            aria-label="Slide indicators"
          >
            {displayImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  scrollToMobileSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === activeIndex ? 'true' : undefined}
                className="min-w-touch min-h-touch inline-flex items-center justify-center focus-ring rounded-full"
              >
                <span
                  className={`block rounded-full transition-all duration-base ${
                    idx === activeIndex
                      ? 'bg-primary w-6 h-2'
                      : 'bg-border-input hover:bg-fg-muted w-2 h-2'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Desktop View: Large Main Frame with Zoom Trigger ─── */}
      <div className="hidden md:block relative w-full aspect-square rounded-lg overflow-hidden bg-surface border border-border group shadow-sm">
        {activeImage && (
          <Image
            src={getSafeUrl(activeImage.url)}
            alt={activeImage.alt || `${productName} main view`}
            width={activeImage.width || 800}
            height={activeImage.height || 800}
            priority
            placeholder="blur"
            blurDataURL={PRODUCT_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 50vw, 45vw"
            onError={() => handleImgError(activeImage.url)}
            className="w-full h-full object-cover transition-transform duration-base group-hover:scale-[1.02]"
          />
        )}

        {/* Click to Zoom Opener Button */}
        <button
          ref={zoomTriggerRef}
          type="button"
          onClick={openLightbox}
          aria-haspopup="dialog"
          aria-label="Click to zoom image"
          className="absolute bottom-space-3 right-space-3 bg-surface-solid/90 hover:bg-surface-solid text-fg px-space-3 py-space-2 rounded-sm shadow-sm border border-border font-medium text-caption focus-ring flex items-center gap-space-2 transition-all opacity-90 group-hover:opacity-100"
        >
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
            />
          </svg>
          Zoom
        </button>
      </div>

      {/* ─── Desktop View: Thumbnail Strip with Roving Focus ─── */}
      {displayImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Product thumbnails"
          className="hidden md:flex items-center gap-space-3 overflow-x-auto py-space-1 [scrollbar-width:none]"
        >
          {displayImages.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={img.id || img.url || idx}
                ref={(el) => {
                  thumbnailRefs.current[idx] = el;
                }}
                role="tab"
                tabIndex={isSelected ? 0 : -1}
                aria-selected={isSelected}
                aria-label={`Thumbnail ${idx + 1} of ${displayImages.length}: ${img.alt || productName}`}
                onClick={() => {
                  setActiveIndex(idx);
                  scrollToMobileSlide(idx);
                }}
                onKeyDown={(e) => handleThumbnailKeyDown(e, idx)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border transition-all focus-ring ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary shadow-sm'
                    : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={getSafeUrl(img.url)}
                  alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={PRODUCT_BLUR_DATA_URL}
                  onError={() => handleImgError(img.url)}
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Lightbox Modal Component from @flowtop/ui ─── */}
      <Lightbox
        open={isLightboxOpen}
        onClose={closeLightbox}
        items={displayImages}
        currentIndex={activeIndex}
        onIndexChange={setActiveIndex}
        ariaLabel={`${productName} image lightbox`}
      />
    </div>
  );
}

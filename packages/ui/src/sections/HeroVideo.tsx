'use client';

import { useEffect, useRef } from 'react';

export interface HeroVideoProps {
  videoUrl: string;
  posterUrl?: string | null;
  className?: string;
  ariaLabel?: string;
}

/**
 * Autoplay Hero Video Island
 *
 * Requirements:
 * - muted, playsInline, loop, preload="none"
 * - poster image required
 * - Autoplay ONLY when prefers-reduced-motion is not set
 * - If reduced motion is set, remains on poster image without playing
 */
export function HeroVideo({
  videoUrl,
  posterUrl,
  className = '',
  ariaLabel = 'Hero background video',
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      video.play().catch(() => {
        // Autoplay policy fallback: video remains on poster
      });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      poster={posterUrl || undefined}
      muted
      playsInline
      loop
      preload="none"
      aria-label={ariaLabel}
      className={`w-full h-full object-cover pointer-events-none ${className}`}
    />
  );
}

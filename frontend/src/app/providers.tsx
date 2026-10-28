'use client';

import React from 'react';
import Link from 'next/link';
import Image, { getImageProps } from 'next/image';
import dynamic from 'next/dynamic';
import { UiProvider, type PictureProps } from '@flowtop/ui';
import { CartProvider } from '../components/Cart';

// Code split non-critical components to reduce initial JavaScript payload
const CartDrawer = dynamic(
  () => import('../components/Cart').then((mod) => mod.CartDrawer),
  { ssr: false }
);

const FloatingWhatsAppButton = dynamic(
  () => import('../components/WhatsApp').then((mod) => mod.FloatingWhatsAppButton),
  { ssr: false }
);

const CookieConsentBanner = dynamic(
  () => import('../components/Consent/CookieConsentBanner').then((mod) => mod.CookieConsentBanner),
  { ssr: false }
);

export function NextPicture({
  desktopSrc,
  mobileSrc,
  alt,
  sizes = '100vw',
  priority = false,
  className = '',
  width = 1600,
  height = 900,
}: PictureProps) {
  const safeAlt = typeof alt === 'string' && alt.trim().length > 0 ? alt : '';
  const common = { alt: safeAlt, sizes, priority };

  if (mobileSrc) {
    const {
      props: { srcSet: mobileSrcSet },
    } = getImageProps({
      ...common,
      width: width || 768,
      height: height || 768,
      src: mobileSrc,
    });

    const {
      props: { srcSet: desktopSrcSet, ...rest },
    } = getImageProps({
      ...common,
      width: width || 1600,
      height: height || 900,
      src: desktopSrc,
    });

    return (
      <picture className="contents">
        <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
        <img
          {...rest}
          alt={safeAlt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={className}
        />
      </picture>
    );
  }

  return (
    <Image
      src={desktopSrc}
      alt={safeAlt}
      width={width || 1600}
      height={height || 900}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UiProvider Picture={NextPicture} Link={Link}>
      <CartProvider>
        {children}
        <CartDrawer />
        <FloatingWhatsAppButton />
        <CookieConsentBanner />
      </CartProvider>
    </UiProvider>
  );
}

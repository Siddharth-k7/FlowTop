'use client';

import React from 'react';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { UiProvider, type PictureProps } from '@flowtop/ui';

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
        <img {...rest} alt={safeAlt} className={className} />
      </picture>
    );
  }

  const {
    props: { ...rest },
  } = getImageProps({
    ...common,
    width: width || 1600,
    height: height || 900,
    src: desktopSrc,
  });

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} alt={safeAlt} className={className} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UiProvider Picture={NextPicture} Link={Link}>
      {children}
    </UiProvider>
  );
}

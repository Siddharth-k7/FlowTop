'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard as ProductCardType } from '../../lib/types-pending';
import { formatPaise, isValidHex } from '../../lib/format';
import { PRODUCT_BLUR_DATA_URL } from '../../lib/image-constants';
import { Badge } from '@flowtop/ui';
import { ProductWhatsAppButton } from '../WhatsApp';

export type ProductCardStyle = 'standard' | 'compact' | 'editorial';

export interface ProductCardProps {
  product: ProductCardType & {
    hoverImage?: string | { id: string; url: string; alt?: string };
    badge?: string | null;
    swatches?: { id: string; name: string; swatchHex: string }[];
  };
  style?: ProductCardStyle;
  priority?: boolean;
}

export function ProductCard({
  product,
  style = 'standard',
  priority = false,
}: ProductCardProps) {
  const {
    name,
    slug,
    price,
    salePrice,
    primaryImage,
    hoverImage,
    badge,
    swatches,
    availabilityMessage,
    isAvailable,
  } = product;

  const primaryImgUrl =
    typeof primaryImage === 'string' ? primaryImage : (primaryImage as { url: string })?.url;
  const hoverImgUrl =
    typeof hoverImage === 'string' ? hoverImage : (hoverImage as { url: string })?.url;

  const [imgSrc, setImgSrc] = React.useState(primaryImgUrl || '/images/fallback-fitting.svg');
  const [hoverSrc, setHoverSrc] = React.useState<string | undefined>(hoverImgUrl);

  const isEditorial = style === 'editorial';

  return (
    <article
      className={`group relative flex flex-col bg-surface-solid border border-border rounded-md overflow-hidden transition-all duration-base hover:shadow-md ${
        isEditorial ? 'p-space-6' : 'p-space-4'
      }`}
    >
      {/* Placement Badge */}
      {badge && (
        <div className="absolute top-space-3 left-space-3 z-raised">
          <Badge variant="primary">
            {badge}
          </Badge>
        </div>
      )}

      {/* Image Container with Hover Swap & Resilient Fallback */}
      <Link
        href={`/products/${slug}`}
        className="relative block w-full aspect-square overflow-hidden rounded-sm bg-surface mb-space-3"
        aria-label={`View details for ${name}`}
      >
        {imgSrc && (
          <Image
            src={imgSrc}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL={PRODUCT_BLUR_DATA_URL}
            onError={() => setImgSrc('/images/fallback-fitting.svg')}
            className={`object-cover transition-opacity duration-base ${
              hoverSrc ? 'group-hover:opacity-0' : ''
            }`}
          />
        )}
        {hoverSrc && (
          <Image
            src={hoverSrc}
            alt={`${name} - alternate view`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={PRODUCT_BLUR_DATA_URL}
            onError={() => setHoverSrc(undefined)}
            className="object-cover opacity-0 transition-opacity duration-base group-hover:opacity-100"
          />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Swatches */}
        {swatches && swatches.length > 0 && (
          <div
            className="flex items-center gap-space-1 mb-space-2"
            aria-label="Available finishes"
          >
            {swatches.slice(0, 5).map((swatch) => (
              <span
                key={swatch.id || swatch.name}
                title={swatch.name}
                className="w-3.5 h-3.5 rounded-full border border-border shadow-sm inline-block"
                style={{
                  backgroundColor: isValidHex(swatch.swatchHex) ? swatch.swatchHex : undefined,
                }}
              />
            ))}
            {swatches.length > 5 && (
              <span className="text-caption text-text-muted">
                +{swatches.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-display font-medium text-body text-fg group-hover:text-primary transition-colors line-clamp-1 mb-space-1">
          <Link href={`/products/${slug}`}>{name}</Link>
        </h3>

        {/* Price display with strikethrough salePrice & WhatsApp inquiry button */}
        <div className="flex items-center justify-between gap-space-2 mt-auto pt-space-2">
          <div className="flex items-baseline gap-space-2">
            <span className="font-semibold text-body text-fg">
              {formatPaise(salePrice ? salePrice : price)}
            </span>
            {salePrice && salePrice < price && (
              <span className="text-small text-text-muted line-through">
                {formatPaise(price)}
              </span>
            )}
          </div>

          <ProductWhatsAppButton
            product={{
              productName: name,
              sku: product.sku,
              finish: swatches?.[0]?.name,
              url: `/products/${slug}`,
            }}
            variant="compact"
          />
        </div>

        {/* Availability note if out of stock */}
        {!isAvailable && availabilityMessage && (
          <p className="text-caption text-warning mt-space-1">{availabilityMessage}</p>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ style = 'standard' }: { style?: ProductCardStyle }) {
  return (
    <div
      className={`animate-pulse flex flex-col bg-surface-solid border border-border rounded-md ${
        style === 'editorial' ? 'p-space-6' : 'p-space-4'
      }`}
    >
      <div className="w-full aspect-square bg-surface rounded-sm mb-space-3" />
      <div className="h-4 bg-surface rounded-sm w-3/4 mb-space-2" />
      <div className="h-4 bg-surface rounded-sm w-1/3" />
    </div>
  );
}

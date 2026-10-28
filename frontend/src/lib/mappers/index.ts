/**
 * Flowtop API-to-ViewModel Mappers
 *
 * Centralizes translation between backend API entity envelopes / mock fixtures
 * and UI view models (@flowtop/ui). If the contract drifts, update this single file.
 */

import type { ProductCardView, CollectionShowcaseView } from '@flowtop/ui';
import type { ProductCard, CollectionDetail, Collection } from '../types-pending';

/**
 * Maps any ProductCard API response or fixture to the framework-agnostic ProductCardView.
 */
export function mapProductToCardView(
  product: ProductCard | Record<string, unknown>
): ProductCardView {
  const p = product as Record<string, unknown>;

  const id = String(p.id || '');
  const name = String(p.name || '');
  const slug = String(p.slug || '');
  const sku = typeof p.sku === 'string' ? p.sku : undefined;
  const price = typeof p.price === 'number' ? p.price : 0;
  const salePrice = typeof p.salePrice === 'number' ? p.salePrice : null;
  const originalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : null;

  // Image normalization
  let primaryImage: { url: string; alt?: string; width?: number; height?: number } = {
    url: '/images/placeholder.jpg',
    alt: name,
  };

  if (typeof p.primaryImage === 'string' && p.primaryImage) {
    primaryImage = { url: p.primaryImage, alt: name };
  } else if (p.primaryImage && typeof p.primaryImage === 'object') {
    const imgObj = p.primaryImage as { url?: string; alt?: string; width?: number; height?: number };
    primaryImage = {
      url: imgObj.url || '/images/placeholder.jpg',
      alt: imgObj.alt || name,
      width: imgObj.width,
      height: imgObj.height,
    };
  }

  let hoverImage: { url: string; alt?: string; width?: number; height?: number } | null = null;
  const secondaryRaw = p.hoverImage || p.secondaryImage;
  if (typeof secondaryRaw === 'string' && secondaryRaw) {
    hoverImage = { url: secondaryRaw, alt: `${name} alternate` };
  } else if (secondaryRaw && typeof secondaryRaw === 'object') {
    const secObj = secondaryRaw as { url?: string; alt?: string; width?: number; height?: number };
    if (secObj.url) {
      hoverImage = {
        url: secObj.url,
        alt: secObj.alt || `${name} alternate`,
        width: secObj.width,
        height: secObj.height,
      };
    }
  }

  // Direct badge from placement row (never derived)
  const badge = typeof p.badge === 'string' && p.badge.trim() ? p.badge.trim() : null;

  // Finishes and swatches mapping
  let finishes: Array<{ code: string; label: string; hex: string }> | undefined;
  if (Array.isArray(p.finishes) && p.finishes.length > 0) {
    finishes = p.finishes.map((f: unknown) => {
      if (typeof f === 'string') {
        return { code: f, label: f, hex: '' };
      }
      const fObj = f as { code?: string; name?: string; label?: string; swatchHex?: string; hex?: string };
      return {
        code: fObj.code || fObj.name || '',
        label: fObj.label || fObj.name || '',
        hex: fObj.hex || fObj.swatchHex || '',
      };
    });
  }

  const isPurchasable = p.isPurchasable !== false;
  const isAvailable = p.isAvailable !== false;
  const enquiryOnly = p.enquiryOnly === true;
  const availabilityMessage = typeof p.availabilityMessage === 'string' ? p.availabilityMessage : null;

  return {
    id,
    name,
    slug,
    sku,
    price,
    salePrice,
    originalPrice,
    primaryImage,
    hoverImage,
    secondaryImage: hoverImage,
    badge,
    finishes,
    isPurchasable,
    isAvailable,
    enquiryOnly,
    availabilityMessage,
  };
}

/**
 * Maps a CollectionDetail or Collection API response to the CollectionShowcaseView model.
 */
export function mapCollectionToShowcaseView(
  collection: CollectionDetail | Collection | Record<string, unknown>
): CollectionShowcaseView {
  const c = collection as Record<string, unknown>;

  const id = String(c.id || '');
  const name = String(c.name || '');
  const slug = String(c.slug || '');
  const tagline = typeof c.tagline === 'string' ? c.tagline : null;

  // Plain-text description (strip HTML tags if passed as story)
  let description: string | null = null;
  if (typeof c.description === 'string' && c.description.trim()) {
    description = c.description.replace(/<[^>]*>/g, '').trim();
  } else if (typeof c.story === 'string' && c.story.trim()) {
    description = c.story.replace(/<[^>]*>/g, '').trim();
  }

  // Cover image
  let coverImage: { url: string; alt?: string; width?: number; height?: number } | null = null;
  const rawCover = c.heroImage || c.coverImage;
  if (typeof rawCover === 'string' && rawCover) {
    coverImage = { url: rawCover, alt: name };
  } else if (rawCover && typeof rawCover === 'object') {
    const covObj = rawCover as { url?: string; alt?: string; width?: number; height?: number };
    if (covObj.url) {
      coverImage = {
        url: covObj.url,
        alt: covObj.alt || name,
        width: covObj.width || 1600,
        height: covObj.height || 900,
      };
    }
  }

  const videoUrl = typeof c.videoUrl === 'string' ? c.videoUrl : null;
  const rawProducts = Array.isArray(c.products) ? c.products : [];
  const products = rawProducts.map((p) => mapProductToCardView(p as ProductCard));

  return {
    id,
    name,
    slug,
    tagline,
    description,
    coverImage,
    videoUrl,
    productCount: products.length,
    products,
  };
}

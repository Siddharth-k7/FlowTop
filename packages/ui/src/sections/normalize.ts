// TODO(types): move to shared/types when Dev A merges.
/**
 * Flowtop Page Sections Config Normalizers
 *
 * Implements strict runtime normalization and defaulting for all six section configs.
 * Rules:
 * 1. A missing REQUIRED field returns null. The renderer then skips the section.
 * 2. An unknown enum value falls back to the contract's default for that field.
 * 3. Unknown extra keys are ignored.
 * 4. Empty strings count as absent.
 * 5. Arrays drop invalid entries.
 * 6. Strict TypeScript: zero `any`.
 */

import {
  SECTION_BACKGROUNDS,
  DEFAULT_SECTION_BACKGROUND,
  SECTION_SPACINGS,
  DEFAULT_SECTION_SPACING,
  SECTION_WIDTHS,
  DEFAULT_SECTION_WIDTH,
  SECTION_ALIGNS,
  DEFAULT_SECTION_ALIGN,
  SectionLayout,
  CTA_STYLES,
  DEFAULT_CTA_STYLE,
  SectionCta,
  HERO_MEDIA_TYPES,
  DEFAULT_HERO_MEDIA_TYPE,
  HERO_OVERLAYS,
  DEFAULT_HERO_OVERLAY,
  HERO_TEXT_POSITIONS,
  DEFAULT_HERO_TEXT_POSITION,
  HeroSectionConfig,
  PRODUCT_CAROUSEL_SOURCES,
  DEFAULT_PRODUCT_CAROUSEL_SOURCE,
  PRODUCT_CARD_STYLES,
  DEFAULT_PRODUCT_CARD_STYLE,
  ProductCarouselRule,
  ProductCarouselSectionConfig,
  COLLECTION_SHOWCASE_VARIANTS,
  DEFAULT_COLLECTION_SHOWCASE_VARIANT,
  CollectionShowcaseSectionConfig,
  IMAGE_SIDES,
  DEFAULT_IMAGE_SIDE,
  IMAGE_TEXT_RATIOS,
  DEFAULT_IMAGE_TEXT_RATIO,
  MOBILE_ORDERS,
  DEFAULT_MOBILE_ORDER,
  ImageTextSectionConfig,
  GALLERY_VARIANTS,
  DEFAULT_GALLERY_VARIANT,
  GALLERY_COLUMNS,
  DEFAULT_GALLERY_COLUMNS,
  GallerySectionConfig,
  CTA_MODES,
  DEFAULT_CTA_MODE,
  CtaSectionConfig,
  SECTION_TYPES,
  SectionType,
  Section,
} from './types';

// ─── Type Guard Helpers ──────────────────────────────────────────────────────

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asNonEmptyString(val: unknown): string | null {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function asEnum<T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof val === 'string' && (allowed as readonly string[]).includes(val)) {
    return val as T;
  }
  return fallback;
}

function asCta(val: unknown): SectionCta | null {
  if (!isRecord(val)) return null;
  const label = asNonEmptyString(val.label);
  const href = asNonEmptyString(val.href);
  if (!label || !href) return null;

  const style = asEnum(val.style, CTA_STYLES, DEFAULT_CTA_STYLE);
  return { label, href, style };
}

// ─── Shared Layout Normalizer ────────────────────────────────────────────────

export function normalizeLayout(raw: unknown): SectionLayout {
  if (!isRecord(raw)) {
    return {
      background: DEFAULT_SECTION_BACKGROUND,
      spacingTop: DEFAULT_SECTION_SPACING,
      spacingBottom: DEFAULT_SECTION_SPACING,
      width: DEFAULT_SECTION_WIDTH,
      align: DEFAULT_SECTION_ALIGN,
    };
  }

  return {
    background: asEnum(raw.background, SECTION_BACKGROUNDS, DEFAULT_SECTION_BACKGROUND),
    spacingTop: asEnum(raw.spacingTop, SECTION_SPACINGS, DEFAULT_SECTION_SPACING),
    spacingBottom: asEnum(raw.spacingBottom, SECTION_SPACINGS, DEFAULT_SECTION_SPACING),
    width: asEnum(raw.width, SECTION_WIDTHS, DEFAULT_SECTION_WIDTH),
    align: asEnum(raw.align, SECTION_ALIGNS, DEFAULT_SECTION_ALIGN),
  };
}

// ─── 1. Hero Normalizer ──────────────────────────────────────────────────────

export function normalizeHeroConfig(raw: unknown): HeroSectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required field: headline
  const headline = asNonEmptyString(raw.headline);
  if (!headline) return null;

  const mediaType = asEnum(raw.mediaType, HERO_MEDIA_TYPES, DEFAULT_HERO_MEDIA_TYPE);
  const desktopImageId = asNonEmptyString(raw.desktopImageId);
  const videoUrl = asNonEmptyString(raw.videoUrl);

  // Contract requirement: image requires desktopImageId, video requires videoUrl
  if (mediaType === 'image' && !desktopImageId) {
    return null;
  }
  if (mediaType === 'video' && !videoUrl) {
    return null;
  }

  const subheading = asNonEmptyString(raw.subheading);
  const mobileImageId = asNonEmptyString(raw.mobileImageId);
  const overlay = asEnum(raw.overlay, HERO_OVERLAYS, DEFAULT_HERO_OVERLAY);
  const textPosition = asEnum(raw.textPosition, HERO_TEXT_POSITIONS, DEFAULT_HERO_TEXT_POSITION);

  // Parse CTAs array dropping invalid items
  const ctas: SectionCta[] = [];
  if (Array.isArray(raw.ctas)) {
    for (const item of raw.ctas) {
      const cta = asCta(item);
      if (cta) ctas.push(cta);
    }
  }

  const layout = normalizeLayout(raw.layout);

  return {
    headline,
    subheading,
    mediaType,
    desktopImageId,
    mobileImageId,
    videoUrl,
    overlay,
    textPosition,
    ctas,
    layout,
  };
}

// ─── 2. Product Carousel Normalizer ──────────────────────────────────────────

export function normalizeProductCarouselConfig(raw: unknown): ProductCarouselSectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required field: heading
  const heading = asNonEmptyString(raw.heading);
  if (!heading) return null;

  const source = asEnum(raw.source, PRODUCT_CAROUSEL_SOURCES, DEFAULT_PRODUCT_CAROUSEL_SOURCE);
  const placementLocation = asNonEmptyString(raw.placementLocation) || (source === 'placement' ? 'featured' : null);

  // Parse productIds dropping invalid non-string or empty items
  const productIds: string[] = [];
  if (Array.isArray(raw.productIds)) {
    for (const id of raw.productIds) {
      const validId = asNonEmptyString(id);
      if (validId) productIds.push(validId);
    }
  }

  // Parse rule object if source === 'rule'
  let rule: ProductCarouselRule | null = null;
  if (source === 'rule' && isRecord(raw.rule)) {
    rule = {
      type: 'newest',
      categoryId: asNonEmptyString(raw.rule.categoryId),
    };
  }

  // Count must be an integer >= 1
  let count = 8;
  if (typeof raw.count === 'number' && Number.isInteger(raw.count) && raw.count >= 1) {
    count = raw.count;
  }

  const cardStyle = asEnum(raw.cardStyle, PRODUCT_CARD_STYLES, DEFAULT_PRODUCT_CARD_STYLE);
  const viewAllHref = asNonEmptyString(raw.viewAllHref);
  const layout = normalizeLayout(raw.layout);

  return {
    heading,
    source,
    placementLocation,
    productIds,
    rule,
    count,
    cardStyle,
    viewAllHref,
    layout,
  };
}

// ─── 3. Collection Showcase Normalizer ───────────────────────────────────────

export function normalizeCollectionShowcaseConfig(raw: unknown): CollectionShowcaseSectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required field: collectionId (UUID)
  const collectionId = asNonEmptyString(raw.collectionId);
  if (!collectionId) return null;

  const coverImageId = asNonEmptyString(raw.coverImageId);
  const description = asNonEmptyString(raw.description);

  const productIds: string[] = [];
  if (Array.isArray(raw.productIds)) {
    for (const id of raw.productIds) {
      const validId = asNonEmptyString(id);
      if (validId) productIds.push(validId);
    }
  }

  const variant = asEnum(raw.variant, COLLECTION_SHOWCASE_VARIANTS, DEFAULT_COLLECTION_SHOWCASE_VARIANT);
  const layout = normalizeLayout(raw.layout);

  return {
    collectionId,
    coverImageId,
    description,
    productIds,
    variant,
    layout,
  };
}

// ─── 4. Image Text Normalizer ────────────────────────────────────────────────

export function normalizeImageTextConfig(raw: unknown): ImageTextSectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required fields: heading, body, imageId
  const heading = asNonEmptyString(raw.heading);
  const body = asNonEmptyString(raw.body);
  const imageId = asNonEmptyString(raw.imageId);

  if (!heading || !body || !imageId) return null;

  const mobileImageId = asNonEmptyString(raw.mobileImageId);
  const imageSide = asEnum(raw.imageSide, IMAGE_SIDES, DEFAULT_IMAGE_SIDE);
  const ratio = asEnum(raw.ratio, IMAGE_TEXT_RATIOS, DEFAULT_IMAGE_TEXT_RATIO);
  const mobileOrder = asEnum(raw.mobileOrder, MOBILE_ORDERS, DEFAULT_MOBILE_ORDER);
  const cta = asCta(raw.cta);
  const layout = normalizeLayout(raw.layout);

  return {
    heading,
    body,
    imageId,
    mobileImageId,
    imageSide,
    ratio,
    mobileOrder,
    cta,
    layout,
  };
}

// ─── 5. Gallery Normalizer ───────────────────────────────────────────────────

export function normalizeGalleryConfig(raw: unknown): GallerySectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required field: imageIds array with at least 1 valid ID
  const imageIds: string[] = [];
  if (Array.isArray(raw.imageIds)) {
    for (const id of raw.imageIds) {
      const validId = asNonEmptyString(id);
      if (validId) imageIds.push(validId);
    }
  }

  if (imageIds.length === 0) return null;

  const heading = asNonEmptyString(raw.heading);
  const variant = asEnum(raw.variant, GALLERY_VARIANTS, DEFAULT_GALLERY_VARIANT);

  let columns = DEFAULT_GALLERY_COLUMNS;
  if (typeof raw.columns === 'number' && (GALLERY_COLUMNS as readonly number[]).includes(raw.columns)) {
    columns = raw.columns as (typeof GALLERY_COLUMNS)[number];
  }

  const showCaptions = typeof raw.showCaptions === 'boolean' ? raw.showCaptions : true;
  const layout = normalizeLayout(raw.layout);

  return {
    heading,
    imageIds,
    variant,
    columns,
    showCaptions,
    layout,
  };
}

// ─── 6. CTA Normalizer ───────────────────────────────────────────────────────

export function normalizeCtaConfig(raw: unknown): CtaSectionConfig | null {
  if (!isRecord(raw)) return null;

  // Required field: heading
  const heading = asNonEmptyString(raw.heading);
  if (!heading) return null;

  const body = asNonEmptyString(raw.body);
  const mode = asEnum(raw.mode, CTA_MODES, DEFAULT_CTA_MODE);
  const cta = asCta(raw.cta);
  const documentId = asNonEmptyString(raw.documentId);
  const layout = normalizeLayout(raw.layout);

  return {
    heading,
    body,
    mode,
    cta,
    documentId,
    layout,
  };
}

// ─── Master Section Normalizer ───────────────────────────────────────────────

/**
 * Normalizes an unknown section record.
 * Returns null if required container fields (id, type, config) are missing
 * or if the section config fails required field validation.
 */
export function normalizeSection(raw: unknown): Section | null {
  if (!isRecord(raw)) return null;

  const id = asNonEmptyString(raw.id);
  const type = raw.type;

  if (!id || typeof type !== 'string' || !(SECTION_TYPES as readonly string[]).includes(type)) {
    return null;
  }

  const position = typeof raw.position === 'number' && !isNaN(raw.position) ? raw.position : 0;
  const visible = typeof raw.visible === 'boolean' ? raw.visible : true;
  const rawConfig = raw.config;

  switch (type as SectionType) {
    case 'hero': {
      const config = normalizeHeroConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: hero) due to missing required fields.`);
        return null;
      }
      return { id, type: 'hero', position, visible, config };
    }
    case 'product_carousel': {
      const config = normalizeProductCarouselConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: product_carousel) due to missing required fields.`);
        return null;
      }
      return { id, type: 'product_carousel', position, visible, config };
    }
    case 'collection_showcase': {
      const config = normalizeCollectionShowcaseConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: collection_showcase) due to missing required fields.`);
        return null;
      }
      return { id, type: 'collection_showcase', position, visible, config };
    }
    case 'image_text': {
      const config = normalizeImageTextConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: image_text) due to missing required fields.`);
        return null;
      }
      return { id, type: 'image_text', position, visible, config };
    }
    case 'gallery': {
      const config = normalizeGalleryConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: gallery) due to missing required fields.`);
        return null;
      }
      return { id, type: 'gallery', position, visible, config };
    }
    case 'cta': {
      const config = normalizeCtaConfig(rawConfig);
      if (!config) {
        console.warn(`[SectionRenderer] Skipped section "${id}" (type: cta) due to missing required fields.`);
        return null;
      }
      return { id, type: 'cta', position, visible, config };
    }
    default: {
      console.warn(`[SectionRenderer] Unknown section type "${type}" in section "${id}". Skipped.`);
      return null;
    }
  }
}

export const normalizeHeroSectionConfig = normalizeHeroConfig;
export const normalizeProductCarouselSectionConfig = normalizeProductCarouselConfig;
export const normalizeCollectionShowcaseSectionConfig = normalizeCollectionShowcaseConfig;
export const normalizeImageTextSectionConfig = normalizeImageTextConfig;
export const normalizeGallerySectionConfig = normalizeGalleryConfig;
export const normalizeCtaSectionConfig = normalizeCtaConfig;


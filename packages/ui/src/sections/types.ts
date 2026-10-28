// TODO(types): move to shared/types when Dev A merges.
/**
 * Flowtop Page Sections Contract Types
 *
 * Defines the six CMS section configurations, the shared layout block,
 * and preset enum lists matching docs/03-api-contract.md.
 * Every preset enum is defined as a `const` array with derived union types.
 */

// ─── Shared Layout Enums & Type ──────────────────────────────────────────────

export const SECTION_BACKGROUNDS = ['white', 'pale', 'deep', 'black', 'image'] as const;
export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];
export const DEFAULT_SECTION_BACKGROUND: SectionBackground = 'white';

export const SECTION_SPACINGS = ['none', 'small', 'medium', 'large'] as const;
export type SectionSpacing = (typeof SECTION_SPACINGS)[number];
export const DEFAULT_SECTION_SPACING: SectionSpacing = 'medium';

export const SECTION_WIDTHS = ['contained', 'wide', 'full'] as const;
export type SectionWidth = (typeof SECTION_WIDTHS)[number];
export const DEFAULT_SECTION_WIDTH: SectionWidth = 'contained';

export const SECTION_ALIGNS = ['left', 'center', 'right'] as const;
export type SectionAlign = (typeof SECTION_ALIGNS)[number];
export const DEFAULT_SECTION_ALIGN: SectionAlign = 'left';

export interface SectionLayout {
  background: SectionBackground;
  spacingTop: SectionSpacing;
  spacingBottom: SectionSpacing;
  width: SectionWidth;
  align: SectionAlign;
}

// ─── Shared CTA Item ─────────────────────────────────────────────────────────

export const CTA_STYLES = ['primary', 'secondary', 'ghost'] as const;
export type CtaStyle = (typeof CTA_STYLES)[number];
export const DEFAULT_CTA_STYLE: CtaStyle = 'primary';

export interface SectionCta {
  label: string;
  href: string;
  style?: CtaStyle;
}

// ─── 1. Hero Section Config ──────────────────────────────────────────────────

export const HERO_MEDIA_TYPES = ['image', 'video'] as const;
export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];
export const DEFAULT_HERO_MEDIA_TYPE: HeroMediaType = 'image';

export const HERO_OVERLAYS = ['none', 'light', 'medium', 'strong'] as const;
export type HeroOverlay = (typeof HERO_OVERLAYS)[number];
export const DEFAULT_HERO_OVERLAY: HeroOverlay = 'medium';

export const HERO_TEXT_POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;
export type HeroTextPosition = (typeof HERO_TEXT_POSITIONS)[number];
export const DEFAULT_HERO_TEXT_POSITION: HeroTextPosition = 'bottom-left';

export interface HeroSectionConfig {
  headline: string;
  subheading: string | null;
  mediaType: HeroMediaType;
  desktopImageId: string | null;
  mobileImageId: string | null;
  videoUrl: string | null;
  overlay: HeroOverlay;
  textPosition: HeroTextPosition;
  ctas: SectionCta[];
  layout: SectionLayout;
}

// ─── 2. Product Carousel Section Config ──────────────────────────────────────

export const PRODUCT_CAROUSEL_SOURCES = ['placement', 'manual', 'rule'] as const;
export type ProductCarouselSource = (typeof PRODUCT_CAROUSEL_SOURCES)[number];
export const DEFAULT_PRODUCT_CAROUSEL_SOURCE: ProductCarouselSource = 'placement';

export const PRODUCT_CARD_STYLES = ['standard', 'compact', 'editorial'] as const;
export type ProductCardStyle = (typeof PRODUCT_CARD_STYLES)[number];
export const DEFAULT_PRODUCT_CARD_STYLE: ProductCardStyle = 'standard';

export interface ProductCarouselRule {
  type: 'newest';
  categoryId?: string | null;
}

export interface ProductCarouselSectionConfig {
  heading: string;
  source: ProductCarouselSource;
  placementLocation: string | null;
  productIds: string[];
  rule: ProductCarouselRule | null;
  count: number;
  cardStyle: ProductCardStyle;
  viewAllHref: string | null;
  layout: SectionLayout;
}

// ─── 3. Collection Showcase Section Config ───────────────────────────────────

export const COLLECTION_SHOWCASE_VARIANTS = ['split', 'stacked', 'overlay'] as const;
export type CollectionShowcaseVariant = (typeof COLLECTION_SHOWCASE_VARIANTS)[number];
export const DEFAULT_COLLECTION_SHOWCASE_VARIANT: CollectionShowcaseVariant = 'split';

export interface CollectionShowcaseSectionConfig {
  collectionId: string;
  coverImageId: string | null;
  description: string | null;
  productIds: string[];
  variant: CollectionShowcaseVariant;
  layout: SectionLayout;
}

// ─── 4. Image Text Section Config ────────────────────────────────────────────

export const IMAGE_SIDES = ['left', 'right'] as const;
export type ImageSide = (typeof IMAGE_SIDES)[number];
export const DEFAULT_IMAGE_SIDE: ImageSide = 'left';

export const IMAGE_TEXT_RATIOS = ['50-50', '60-40', '40-60'] as const;
export type ImageTextRatio = (typeof IMAGE_TEXT_RATIOS)[number];
export const DEFAULT_IMAGE_TEXT_RATIO: ImageTextRatio = '50-50';

export const MOBILE_ORDERS = ['image-first', 'text-first'] as const;
export type MobileOrder = (typeof MOBILE_ORDERS)[number];
export const DEFAULT_MOBILE_ORDER: MobileOrder = 'image-first';

export interface ImageTextSectionConfig {
  heading: string;
  body: string; // HTML string
  imageId: string;
  mobileImageId: string | null;
  imageSide: ImageSide;
  ratio: ImageTextRatio;
  mobileOrder: MobileOrder;
  cta: SectionCta | null;
  layout: SectionLayout;
}

// ─── 5. Gallery Section Config ───────────────────────────────────────────────

export const GALLERY_VARIANTS = ['grid', 'masonry', 'slider'] as const;
export type GalleryVariant = (typeof GALLERY_VARIANTS)[number];
export const DEFAULT_GALLERY_VARIANT: GalleryVariant = 'grid';

export const GALLERY_COLUMNS = [2, 3, 4] as const;
export type GalleryColumns = (typeof GALLERY_COLUMNS)[number];
export const DEFAULT_GALLERY_COLUMNS: GalleryColumns = 3;

export interface GallerySectionConfig {
  heading: string | null;
  imageIds: string[];
  variant: GalleryVariant;
  columns: GalleryColumns;
  showCaptions: boolean;
  layout: SectionLayout;
}

// ─── 6. CTA Section Config ───────────────────────────────────────────────────

export const CTA_MODES = ['button', 'download'] as const;
export type CtaMode = (typeof CTA_MODES)[number];
export const DEFAULT_CTA_MODE: CtaMode = 'button';

export interface CtaSectionConfig {
  heading: string;
  body: string | null;
  mode: CtaMode;
  cta: SectionCta | null;
  documentId: string | null;
  layout: SectionLayout;
}

// ─── Section Discriminated Union ─────────────────────────────────────────────

export const SECTION_TYPES = [
  'hero',
  'product_carousel',
  'collection_showcase',
  'image_text',
  'gallery',
  'cta',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface BaseSection<TType extends SectionType, TConfig> {
  id: string;
  type: TType;
  position: number;
  visible: boolean;
  config: TConfig;
}

export type HeroSectionItem = BaseSection<'hero', HeroSectionConfig>;
export type ProductCarouselSectionItem = BaseSection<'product_carousel', ProductCarouselSectionConfig>;
export type CollectionShowcaseSectionItem = BaseSection<'collection_showcase', CollectionShowcaseSectionConfig>;
export type ImageTextSectionItem = BaseSection<'image_text', ImageTextSectionConfig>;
export type GallerySectionItem = BaseSection<'gallery', GallerySectionConfig>;
export type CtaSectionItem = BaseSection<'cta', CtaSectionConfig>;

export type Section =
  | HeroSectionItem
  | ProductCarouselSectionItem
  | CollectionShowcaseSectionItem
  | ImageTextSectionItem
  | GallerySectionItem
  | CtaSectionItem;

/**
 * Type map connecting SectionType to its corresponding Config interface.
 */
export interface SectionConfigMap {
  hero: HeroSectionConfig;
  product_carousel: ProductCarouselSectionConfig;
  collection_showcase: CollectionShowcaseSectionConfig;
  image_text: ImageTextSectionConfig;
  gallery: GallerySectionConfig;
  cta: CtaSectionConfig;
}

// ─── Section Resolved Data View Models ───────────────────────────────────────

export interface ProductCardView {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price?: number; // in integer paise
  salePrice?: number | null;
  originalPrice?: number | null;
  primaryImage: string | { url: string; alt?: string; width?: number | null; height?: number | null };
  hoverImage?: string | { url: string; alt?: string; width?: number | null; height?: number | null } | null;
  secondaryImage?: string | { url: string; alt?: string; width?: number | null; height?: number | null } | null;
  badge?: string | null;
  swatches?: { id: string; name: string; swatchHex?: string; code?: string }[];
  finishes?: Array<{ code: string; label: string; hex: string }>;
  isAvailable?: boolean;
  isPurchasable?: boolean;
  enquiryOnly?: boolean;
  availabilityMessage?: string | null;
}

export interface CollectionShowcaseView {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  coverImage?: string | { url: string; alt?: string; width?: number; height?: number } | null;
  videoUrl?: string | null;
  productCount?: number;
  products?: ProductCardView[];
}

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export type sectionId = string;

export type SectionDataMap = Record<
  sectionId,
  {
    products?: ProductCardView[];
    collection?: CollectionShowcaseView;
    images?: GalleryImage[];
  }
>;


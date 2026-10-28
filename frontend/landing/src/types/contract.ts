/**
 * Exact Section & Domain Contracts
 * Source of Truth: docs/03-api-contract.md
 */

export type LayoutBackground = 'white' | 'pale' | 'deep' | 'black' | 'image';
export type LayoutSpacing = 'none' | 'small' | 'medium' | 'large';
export type LayoutWidth = 'contained' | 'wide' | 'full';
export type LayoutAlign = 'left' | 'center' | 'right';

export interface SectionLayout {
  background: LayoutBackground;
  spacingTop: LayoutSpacing;
  spacingBottom: LayoutSpacing;
  width: LayoutWidth;
  align: LayoutAlign;
}

export interface CtaButton {
  label: string;
  href: string;
  style?: 'primary' | 'secondary' | 'ghost';
}

// 1. Hero
export interface HeroConfig {
  headline: string;
  subheading?: string;
  mediaType: 'image' | 'video';
  desktopImageId?: string;
  mobileImageId?: string;
  videoUrl?: string | null;
  overlay?: 'none' | 'light' | 'medium' | 'strong';
  textPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  ctas?: CtaButton[];
  layout: SectionLayout;
}

// 2. Product Carousel
export interface ProductCarouselConfig {
  heading: string;
  source: 'placement' | 'manual' | 'rule';
  placementLocation?: string;
  productIds?: string[];
  rule?: { type: 'newest'; categoryId?: string } | null;
  count: number;
  cardStyle: 'standard' | 'compact' | 'editorial';
  viewAllHref?: string;
  layout: SectionLayout;
}

// 3. Collection Showcase
export interface CollectionShowcaseConfig {
  collectionId: string;
  coverImageId?: string;
  description: string;
  productIds?: string[];
  variant: 'split' | 'stacked' | 'overlay';
  layout: SectionLayout;
}

// 4. Image Text
export interface ImageTextConfig {
  heading: string;
  body: string;
  imageId?: string;
  mobileImageId?: string;
  imageSide: 'left' | 'right';
  ratio: '50-50' | '60-40' | '40-60';
  mobileOrder: 'image-first' | 'text-first';
  cta?: { label: string; href: string };
  layout: SectionLayout;
}

// 5. Gallery
export interface GalleryConfig {
  heading: string;
  imageIds: string[];
  variant: 'grid' | 'masonry' | 'slider';
  columns: 2 | 3 | 4;
  showCaptions?: boolean;
  layout: SectionLayout;
}

// 6. CTA
export interface CtaConfig {
  heading: string;
  body: string;
  mode: 'button' | 'download';
  cta: { label: string; href: string };
  documentId?: string | null;
  layout: SectionLayout;
}

export type SectionType =
  | 'hero'
  | 'product_carousel'
  | 'collection_showcase'
  | 'image_text'
  | 'gallery'
  | 'cta';

export type SectionConfigMap = {
  hero: HeroConfig;
  product_carousel: ProductCarouselConfig;
  collection_showcase: CollectionShowcaseConfig;
  image_text: ImageTextConfig;
  gallery: GalleryConfig;
  cta: CtaConfig;
};

export interface Section<T = any> {
  id: string;
  type: SectionType;
  position: number;
  visible: boolean;
  config: T;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  sections: Section[];
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
  };
}

// Supporting Domain Entities
export interface ProductCard {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryName: string;
  collectionName?: string;
  basePricePaise: number; // Integer paise e.g. 450000 = ₹4,500.00
  finishNames: string[];
  coverImageUrl: string;
  badge?: string;
  specSummary?: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImageUrl: string;
  productCount: number;
}

/**
 * Pending shared types for Flowtop.
 *
 * TODO(types): Move to shared/types once the shared API contract types are finalized.
 * Owned by Dev C locally in frontend.
 */

import type { MediaAsset } from '@flowtop/types';

// ─── API Envelope, Pagination & Media ─────────────────────────────────────────
// Paginated, ErrorEnvelope and MediaAsset are owned by @flowtop/types
// (shared/types/src/index.ts). Import them from there. Do not copy them here:
// a private copy is how a mock drifts from the contract without a compile error.
export interface SingleResponse<T> {
  data: T;
}

// ─── Navigation & Settings ───────────────────────────────────────────────────
export interface NavigationSubItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  items?: NavigationSubItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: {
    id: string;
    label: string;
    href: string;
  }[];
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'linkedin' | 'pinterest' | 'youtube';
  url: string;
  label: string;
}

export interface NavigationResponse {
  header: NavigationItem[];
  footer: {
    columns: FooterColumn[];
    socialLinks: SocialLink[];
    legalNotice: string;
  };
}

export interface PublicSettingsResponse {
  whatsapp: {
    number: string;
    generalTemplate: string;
    productTemplate: string;
  };
}

// ─── Products & Catalogue ────────────────────────────────────────────────────
export interface ProductFinish {
  id: string;
  name: string;
  code: string;
  inStock: boolean;
  pricePaise?: number; // integer paise
}

export interface ProductSpecification {
  key: string;
  label: string;
  value: string;
  unit?: string;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number; // integer paise
  salePrice?: number | null; // integer paise
  primaryImage: string;
  categorySlug: string;
  collectionSlug?: string | null;
  isAvailable: boolean;
  availabilityMessage?: string | null;
  finishes: string[]; // e.g. ['chrome', 'brushed-gold', 'matte-black']
}

export interface ProductDetail extends ProductCard {
  shortDescription: string;
  fullDescriptionHtml: string;
  isPurchasable: boolean;
  gallery: MediaAsset[];
  specifications: ProductSpecification[];
  finishesDetail: ProductFinish[];
  downloads?: {
    title: string;
    url: string;
    fileType: string;
  }[];
}

// ─── Categories & Collections ────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentSlug?: string | null;
  productCount: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImage: string;
  featured: boolean;
  productCount: number;
}

// ─── Cart & Commerce ─────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  finishName: string;
  unitPrice: number; // integer paise
  quantity: number;
  lineTotal: number; // integer paise
  imageUrl: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number; // integer paise
  tax: number; // integer paise
  shipping: number; // integer paise
  total: number; // integer paise
  itemCount: number;
}

export interface CartSummary {
  itemCount: number;
}

// ─── Submissions ─────────────────────────────────────────────────────────────
export interface SubmissionRequest {
  type: 'contact' | 'dealer';
  payload: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    firmName?: string;
    message: string;
  };
}

export interface SubmissionResponse {
  reference: string;
  saved: boolean;
  emailSent: boolean;
  message: string;
}

// ─── Journal ─────────────────────────────────────────────────────────────────
export interface JournalArticleCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
}

export interface JournalArticleDetail extends JournalArticleCard {
  contentHtml: string;
  author: string;
  relatedProducts?: ProductCard[];
}

// ─── Pages & CMS Sections ────────────────────────────────────────────────────
export type SectionType =
  | 'hero'
  | 'product_carousel'
  | 'collection_showcase'
  | 'image_text'
  | 'gallery'
  | 'cta';

export interface PageSection {
  id: string;
  type: SectionType;
  position: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface PageDetail {
  id: string;
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: PageSection[];
}

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
  status?: string;
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

export interface CollectionDetail extends Collection {
  story?: string;
  editorialImage?: string;
  products?: ProductCard[];
  sharedFinishes?: string[];
}

// ─── Cart & Commerce ─────────────────────────────────────────────────────────
export interface CartWarning {
  itemId?: string;
  code: string;
  message: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  finishName?: string;
  unitPrice: number; // integer paise
  quantity: number;
  lineTotal: number; // integer paise
  imageUrl?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    primaryImage?: string;
  };
  variant?: {
    id: string;
    name: string;
    skuSuffix?: string;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number; // integer paise
  tax: number; // integer paise
  shipping: number; // integer paise
  total: number; // integer paise
  itemCount: number;
  warnings?: CartWarning[];
}

export interface CartSummary {
  itemCount: number;
}

// ─── Checkout & Orders ───────────────────────────────────────────────────────
export interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutDelivery {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pin: string; // 6-digit Indian PIN code
  landmark?: string;
  notes?: string;
}

export interface CheckoutRequest {
  contact: CheckoutContact;
  delivery: CheckoutDelivery;
}

export interface GatewayHandoff {
  provider: string;
  orderId: string;
  amount: number; // integer paise
  key: string;
  redirectUrl?: string;
}

export interface CheckoutResponse {
  orderId: string;
  reference: string;
  gateway: GatewayHandoff;
}

export interface OrderStatusResponse {
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export interface OrderDetailItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  sku: string;
  finishName?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
}

export interface OrderDetailResponse {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryPin: string;
  deliveryLandmark?: string | null;
  deliveryNotes?: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'received' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
  createdAt: string;
  items: OrderDetailItem[];
}

// ─── Submissions ─────────────────────────────────────────────────────────────
export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website?: string; // honeypot
}

export interface DealerPayload {
  name: string;
  company: string;
  role: string;
  city: string;
  projectType: string;
  requirement: string;
  message: string;
  website?: string; // honeypot
}

export type SubmissionPayload = ContactPayload | DealerPayload;

export interface SubmissionRequest {
  type: 'contact' | 'dealer';
  payload: Record<string, unknown>;
}

export interface SubmissionResponse {
  reference: string;
  saved: boolean;
  emailSent: boolean;
  message: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'search'
  | 'filter_applied'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'whatsapp_click'
  | 'form_submit'
  | 'document_download'
  | 'journal_view'
  | 'collection_view';

export interface AnalyticsEventRequest {
  type: AnalyticsEventType;
  payload?: Record<string, unknown>;
}

// ─── Site Search ─────────────────────────────────────────────────────────────
export interface SearchProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string;
  categoryName?: string;
}

export interface SearchCollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  heroImage?: string;
}

export interface SearchArticleItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  readTimeMinutes?: number;
}

export interface SiteSearchResults {
  products: SearchProductItem[];
  collections: SearchCollectionItem[];
  articles: SearchArticleItem[];
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

export interface PageSeo {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  shareImage?: { url: string } | null;
}

export interface PageResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  template?: string | null;
  content?: string | null;
  updatedAt?: string | null;
  sections: import('@flowtop/ui').Section[];
  seo?: PageSeo | null;
}

// ─── Support & Customer Care ────────────────────────────────────────────────
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ManualItem {
  id: string;
  title: string;
  productType: string;
  fileSize: string;
  fileType: string;
  downloadUrl: string;
}

export interface SupportDataResponse {
  faqs: FaqItem[];
  categories: string[];
  manuals: ManualItem[];
  manualProductTypes: string[];
  warrantyNotice: {
    title: string;
    description: string;
    standardDurationYears: number;
    comingSoonMessage: string;
  };
}

export interface PlacementResponse {
  locationType: string;
  locationId: string;
  products: ProductCard[];
}

// ─── Sitemap Data (Dev B contract Prompt 4.3) ───────────────────────────────
export type SitemapItemType = 'product' | 'category' | 'collection' | 'page' | 'article';

export interface SitemapItem {
  slug: string;
  type: SitemapItemType;
  updatedAt: string;
}

export interface SitemapDataResponse {
  items: SitemapItem[];
  total: number;
}


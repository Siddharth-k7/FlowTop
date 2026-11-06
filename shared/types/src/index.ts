/**
 * Type declarations shared by the frontend and the admin.
 *
 * No values, no imports, no dependencies. Everything here is erased at compile
 * time, so importing it cannot pull runtime code into a bundle.
 *
 * backend/src must not import this folder. The API image is built with
 * backend/ as the Docker context, so shared/ does not exist during that build.
 * The copies in backend/src are the source of truth. A backend test compares
 * these types to those copies and fails when they drift.
 *
 * The product catalogue types (ProductCard, ProductDetail, Variant,
 * Specification, Category, Collection and their parts) have no backend copy
 * yet: Dev B has not written the endpoints. Their source of truth is
 * docs/03-api-contract.md for the field names and shapes, and
 * backend/prisma/schema.prisma for nullability, value types and enums.
 * backend/src/common/catalog-types.drift.spec.ts compares both.
 *
 * ROLE_PERMISSIONS is a type, not a const. A const would be runtime code.
 * Each role maps to a readonly tuple so an exact grant list can be checked.
 */

export type Permission =
  | 'product:read'
  | 'product:create'
  | 'product:update'
  | 'product:publish'
  | 'product:archive'
  | 'category:read'
  | 'category:write'
  | 'collection:read'
  | 'collection:write'
  | 'placement:manage'
  | 'page:read'
  | 'page:write'
  | 'page:publish'
  | 'section:write'
  | 'navigation:read'
  | 'navigation:write'
  | 'journal:read'
  | 'journal:write'
  | 'journal:publish'
  | 'media:read'
  | 'media:write'
  | 'media:delete'
  | 'order:read'
  | 'order:status_change'
  | 'order:export'
  | 'submission:read'
  | 'submission:update'
  | 'submission:export'
  | 'settings:read'
  | 'settings:write'
  | 'user:read'
  | 'user:read_self'
  | 'user:manage'
  | 'audit:read'
  | 'analytics:read';

/** The three roles that ship in v1. */
export type RoleName = 'super_admin' | 'marketing_admin' | 'product_manager';

/** Which role holds which permissions. Type-level only: there is no runtime object. */
export type ROLE_PERMISSIONS = {
  readonly super_admin: readonly [
    'product:read',
    'product:create',
    'product:update',
    'product:publish',
    'product:archive',
    'category:read',
    'category:write',
    'collection:read',
    'collection:write',
    'placement:manage',
    'page:read',
    'page:write',
    'page:publish',
    'section:write',
    'navigation:read',
    'navigation:write',
    'journal:read',
    'journal:write',
    'journal:publish',
    'media:read',
    'media:write',
    'media:delete',
    'order:read',
    'order:status_change',
    'order:export',
    'submission:read',
    'submission:update',
    'submission:export',
    'settings:read',
    'settings:write',
    'user:read',
    'user:read_self',
    'user:manage',
    'audit:read',
    'analytics:read',
  ];
  readonly marketing_admin: readonly [
    'page:read',
    'page:write',
    'page:publish',
    'section:write',
    'navigation:read',
    'navigation:write',
    'journal:read',
    'journal:write',
    'journal:publish',
    'media:read',
    'media:write',
    'media:delete',
    'product:read',
    'category:read',
    'collection:read',
    'analytics:read',
    'user:read_self',
  ];
  readonly product_manager: readonly [
    'product:read',
    'product:create',
    'product:update',
    'product:publish',
    'product:archive',
    'category:read',
    'category:write',
    'collection:read',
    'collection:write',
    'placement:manage',
    'page:read',
    'media:read',
    'media:write',
    'analytics:read',
    'user:read_self',
  ];
};

/**
 * The user object returned by GET /auth/me, and by login when no second
 * factor is pending. `permissions` is for showing and hiding UI. The server
 * checks again on every call. `role` is null only when no role is assigned.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName | null;
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaSetupRequired: boolean;
}

/** One media library file, as the admin media endpoints return it. */
export interface MediaAsset {
  id: string;
  /** Cleaned original upload name, for display. Not the last segment of `url`. */
  filename: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  /** ISO 8601 UTC. */
  createdAt: string;
  variants: {
    thumb?: string;
    medium?: string;
    large?: string;
  };
}

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'MFA_SETUP_REQUIRED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** The error body on every failed response. `fields` is present only for field errors. */
export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}

/** The list envelope. `page` starts at 1. */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ─── Product catalogue ─────────────────────────────────────────────────────
// Shapes only. Dev B builds the endpoints that return them; Dev C and Dev D
// build screens against them from day one. Money is integer paise.
//
// Where docs/03-api-contract.md and prisma/schema.prisma disagree, the field
// name and shape follow the contract and the nullability follows the schema.
// Every such place is listed in docs/reviews/dev-a-feat-product-catalog-types-2026-10-24.md.

/** The lifecycle of a product, category or collection. Matches the Prisma enum PublishStatus. */
export type PublishStatus = 'draft' | 'published' | 'unpublished' | 'archived';

/** How a specification value is read. Matches the Prisma enum SpecificationType. */
export type SpecificationType = 'text' | 'number' | 'boolean' | 'choice';

/** An image as a product card or variant shows it. A MediaAsset trimmed to what the page needs. */
export type ImageRef = Pick<MediaAsset, 'id' | 'url' | 'alt'>;

/** One image in a product gallery. */
export type GalleryImage = Pick<MediaAsset, 'id' | 'url' | 'alt' | 'width' | 'height'>;

/** The search-engine fields on a product, category or collection. */
export interface Seo {
  title: string;
  description: string;
  canonical: string | null;
  shareImage: Pick<MediaAsset, 'url'> | null;
}

/** A finish swatch on a ProductCard. Built from the product's variants. */
export interface Finish {
  /** The variant id. */
  id: string;
  name: string;
  swatchHex: string | null;
}

/** One finish of a product, as ProductDetail.variants returns it. */
export interface Variant {
  id: string;
  /** "Chrome", "Matte Black". */
  name: string;
  skuSuffix: string;
  /** Paise. Already resolved: the override when set, the product price otherwise. Never compute it. */
  price: number;
  swatchHex: string | null;
  image: ImageRef | null;
  isAvailable: boolean;
  isDefault: boolean;
}

/**
 * One specification row, as GET and PUT /admin/products/:id/specifications
 * carry it. The admin sends the whole ordered list on save. The public page
 * gets SpecificationGroup instead, with empty values already removed.
 */
export interface Specification {
  id: string;
  /** "Technical", "Installation". Null when the row has no group. */
  group: string | null;
  /** "Material". Any name is allowed: there is no fixed list. */
  name: string;
  /** Never empty. A row with an empty value is rejected, not stored. */
  value: string;
  /** "mm", "LPM". */
  unit: string | null;
  type: SpecificationType;
  position: number;
}

/** One name and value in a SpecificationGroup. */
export interface SpecificationItem {
  name: string;
  value: string;
  unit: string | null;
}

/** The public shape of specifications: rows grouped by `group`, in position order. */
export interface SpecificationGroup {
  group: string | null;
  items: SpecificationItem[];
}

/** A category as a product card or product page refers to it. */
export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** A collection as a product page refers to it. */
export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

/**
 * A category. GET /categories returns a tree, one level deep: top-level
 * categories carry their sub-categories in `children`, and those carry [].
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** The parent's id. Null for a top-level category. */
  parentId: string | null;
  image: ImageRef | null;
  /** Menu and listing order. */
  position: number;
  status: PublishStatus;
  seo: Seo;
  children: Category[];
}

/**
 * A collection. `story` is HTML. GET /collections/:slug returns a
 * CollectionDetail, which adds its products.
 */
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Rich text as HTML. */
  story: string;
  image: ImageRef | null;
  heroImage: ImageRef | null;
  position: number;
  status: PublishStatus;
  seo: Seo;
}

/** GET /collections/:slug. `products` are in rank order. */
export interface CollectionDetail extends Collection {
  products: ProductCard[];
}

/** What listings, carousels and placements return. */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sku: string;
  /** Paise. */
  price: number;
  /** Paise. Null when the product is not on sale. */
  salePrice: number | null;
  /** False means enquiry-only: show an enquiry action, not an add-to-cart button. */
  isPurchasable: boolean;
  isAvailable: boolean;
  primaryImage: ImageRef | null;
  hoverImage: ImageRef | null;
  finishes: Finish[];
  /** From the Placement row being rendered. Null outside a placement context. */
  badge: string | null;
  category: CategoryRef | null;
}

/** One file to download on a product page. */
export interface ProductDocument {
  /** The media asset id. */
  id: string;
  /** "Installation Manual". */
  name: string;
  url: string;
  sizeBytes: number;
}

/** GET /products/:slug. The full product page. */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  /** Rich text as HTML. */
  fullDescription: string;
  /** Paise. */
  price: number;
  /** Paise. Null when the product is not on sale. */
  salePrice: number | null;
  /** False for an archived or unavailable product, whatever the product's own flag says. */
  isPurchasable: boolean;
  isAvailable: boolean;
  /** "Ships in 3 working days". */
  availabilityMessage: string | null;
  category: CategoryRef | null;
  collections: CollectionRef[];
  /** [] when the product has no finishes. Never null. */
  variants: Variant[];
  /** Specifications with an empty value are never in here. */
  specifications: SpecificationGroup[];
  gallery: GalleryImage[];
  documents: ProductDocument[];
  seo: Seo;
}

// ─── Admin CMS ─────────────────────────────────────────────────────────────
// Shapes the admin reads and writes. Each has a drift test:
// backend/src/common/admin-types.drift.spec.ts.

/**
 * GET, POST and PATCH /admin/products(/:id). The product row as the API stores
 * it, so every column is here. Dates are ISO 8601 strings on the wire.
 * `category` and `_count` come with GET only; POST and PATCH return the bare row.
 */
export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  categoryId: string | null;
  shortDescription: string;
  /** Rich text as HTML. */
  fullDescription: string;
  /** Paise. */
  price: number;
  /** Paise. */
  salePrice: number | null;
  taxClass: string;
  isPurchasable: boolean;
  isAvailable: boolean;
  availabilityMessage: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  status: PublishStatus;
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string | null;
  seoShareImageId: string | null;
  modelUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category?: CategoryRef | null;
  _count?: { specifications: number; media: number; variants: number; placements: number };
}

/** `homepage_section` ids are keys (`featured`); every other type uses a uuid. */
export type PlacementLocationType = 'homepage_section' | 'category' | 'collection' | 'campaign_page' | 'related';

/** One row in the placements table: one product in one place. docs/03-api-contract.md, Placements. */
export interface Placement {
  id: string;
  productId: string;
  locationType: PlacementLocationType;
  locationId: string;
  locationName: string;
  position: number;
  label: string;
  enabled: boolean;
}

/** One entry in GET /admin/placement-locations, the picker's list. */
export type PlacementLocation = Pick<Placement, 'locationType' | 'locationId' | 'locationName'>;

/** One block on a page. docs/03-api-contract.md, Pages and sections. `config` shapes are listed there. */
export interface Section {
  id: string;
  type: string;
  position: number;
  visible: boolean;
  config: Record<string, unknown>;
}

/** A page with its sections in position order. */
export interface Page {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  sections: Section[];
  seo: Seo;
}

/**
 * One item of the navigation tree, PUT whole to /admin/navigation.
 * TODO: docs/03-api-contract.md gives no JSON for it. This is the admin's proposal; Dev B to confirm.
 */
export interface NavNode {
  id: string;
  label: string;
  href: string;
  children: NavNode[];
}

/** GET /admin/categories. A flat row; the public tree is `Category`. */
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  position: number;
  status: PublishStatus;
}

/** Admin collection row. Membership is PUT /admin/collections/:id/products, not a field on this row. */
export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Rich text as HTML. */
  story: string;
  heroMediaId: string | null;
  status: PublishStatus;
}

/** One ranked product in PUT /admin/collections/:id/products. */
export interface CollectionProductRank {
  productId: string;
  position: number;
}

/** Admin journal article. `heroImageId` is the cover. */
export interface AdminJournalArticle {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string;
  /** Rich text as HTML. */
  body: string;
  heroImageId: string | null;
  status: PublishStatus;
  publishedAt: string | null;
}

/** order.order_status. The admin calls this `status`. */
export type OrderStatusName = 'received' | 'confirmed' | 'shipped' | 'cancelled';

/** order.payment_status. */
export type PaymentStatusName = 'pending' | 'paid' | 'failed' | 'refunded';

/** One row of GET /admin/orders. */
export interface AdminOrderSummary {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  /** Paise. */
  total: number;
  paymentStatus: PaymentStatusName;
  status: OrderStatusName;
  createdAt: string;
}

/** A snapshot line. `finish` is the variant name, null when the product had no finish. */
export interface AdminOrderItem {
  id: string;
  name: string;
  sku: string;
  finish: string | null;
  quantity: number;
  /** Paise. */
  unitPrice: number;
  /** Paise. */
  lineTotal: number;
}

/** One status change, read back from the audit log. */
export interface AdminOrderEvent {
  at: string;
  status: OrderStatusName;
  note: string;
  by: string;
}

/** GET /admin/orders/:id. Delivery is the stored address, not one concatenated string. */
export interface AdminOrderDetail extends AdminOrderSummary {
  customerPhone: string;
  delivery: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pin: string;
    landmark: string | null;
    notes: string | null;
  };
  /** Paise. */
  subtotal: number;
  /** Paise. */
  shipping: number;
  /** Paise. */
  tax: number;
  items: AdminOrderItem[];
  timeline: AdminOrderEvent[];
}

/** submission.type. `dealer` is the dealer enquiry, not a separate string. */
export type SubmissionKind = 'contact' | 'dealer';

/** submission.status. */
export type SubmissionState = 'new' | 'read' | 'handled';

/**
 * GET /admin/submissions and PATCH /admin/submissions/:id.
 * Contact fields are the payload the public form stores. Missing keys are null or ''.
 */
export interface AdminSubmission {
  id: string;
  type: SubmissionKind;
  reference: string;
  status: SubmissionState;
  emailSent: boolean;
  emailError: string | null;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  firmName: string | null;
  message: string;
}

/** GET /admin/dashboard. Orders and submissions are empty unless the caller may read them. */
export interface DashboardSummary {
  draftPages: number;
  productsMissingImages: number;
  productsMissingSpecs: number;
  recentOrders: { id: string; reference: string; total: number; status: string }[];
  recentSubmissions: { id: string; name: string; type: string; read: boolean }[];
}

/** One entry of GET /admin/settings. `value` depends on the key: text, a list of emails, or null. */
export interface SettingItem {
  key: string;
  value: unknown;
  description: string;
  public: boolean;
  /** Null until someone changes it from its seed value. */
  updatedBy: { id: string; name: string } | null;
  updatedAt: string | null;
}

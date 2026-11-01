// TODO: swap for @flowtop/types when shared/types is populated. Mirrors docs/03-api-contract.md
// plus the PDF-driven additions listed in admin/SECTION-SHAPES.md (proposed, not yet agreed with Dev B/C).
export type Doc = { id: string } & Record<string, unknown>;
export type Status = 'draft' | 'published' | 'archived';

export interface Variant { id: string; name: string; skuSuffix: string; price: number; swatchHex: string; imageId: string; isAvailable: boolean; isDefault: boolean }
export interface SpecItem { id: string; group: string; name: string; value: string; unit: string }

export interface Product extends Doc {
  name: string; slug: string; sku: string; status: Status;
  shortDescription: string; fullDescription: string;
  price: number; salePrice: number | null; isPurchasable: boolean; isAvailable: boolean; availabilityMessage: string;
  categoryId: string; collectionIds: string[];
  variants: Variant[]; specs: SpecItem[];
  galleryIds: string[]; documentIds: string[];
  seoTitle: string; seoDescription: string; seoCanonical: string; shareImageId: string;
  relatedIds: string[]; compatibleIds: string[]; beforeYouBuy: string[]; fitChecks: string[];
  updatedAt: string;
}

export interface Placement {
  id: string; productId: string; locationType: string; locationId: string; locationName: string;
  position: number; label: string; enabled: boolean;
}
export interface PlacementLocation { locationType: string; locationId: string; locationName: string }

export interface Section { id: string; type: string; visible: boolean; config: Record<string, unknown> }
export interface Page extends Doc {
  title: string; slug: string; status: Status; isCampaign: boolean;
  seoTitle: string; seoDescription: string; sections: Section[]; updatedAt: string;
}
export interface NavNode { id: string; label: string; href: string; children: NavNode[] }

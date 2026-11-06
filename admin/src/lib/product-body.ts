import type { AdminProduct } from '@flowtop/types';

/** Only what CreateProductDto and UpdateProductDto accept. The API refuses unknown fields, so `status`, dates and ids are never sent. */
export const toBody = (p: AdminProduct) => ({
  name: p.name, sku: p.sku, slug: p.slug, categoryId: p.categoryId || undefined, shortDescription: p.shortDescription, fullDescription: p.fullDescription,
  price: p.price, salePrice: p.salePrice, isPurchasable: p.isPurchasable, isAvailable: p.isAvailable, availabilityMessage: p.availabilityMessage || null,
  seoTitle: p.seoTitle, seoDescription: p.seoDescription, seoCanonical: p.seoCanonical || null,
});

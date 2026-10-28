import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import type { ProductDetail, ProductCard as ProductCardType, PublicSettingsResponse } from '../../../lib/types-pending';
import { paiseToDecimalString } from '../../../lib/format';
import { Breadcrumbs } from '@flowtop/ui';
import { ProductHero } from '../../../components/Product/ProductHero';
import { ProductDescription } from '../../../components/Product/ProductDescription';
import { ProductSpecsTable } from '../../../components/Product/ProductSpecsTable';
import { ProductDocuments } from '../../../components/Product/ProductDocuments';
import { ProductCard } from '../../../components/Product/ProductCard';

/**
 * Revalidate every 60 seconds (ISR).
 * Public read fetches never read or send cookies, keeping this page static.
 */
export const revalidate = 60;

/**
 * Generate static params at build time so the dynamic route prerenders with ISR.
 */
export async function generateStaticParams() {
  try {
    const res = await api.getProducts({ perPage: 50 });
    return (res.data || []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  try {
    const res = await api.getProductBySlug(slug);
    const product = res.data;

    const rawSeo = (product as unknown as {
      seo?: { title?: string; description?: string; canonical?: string | null; shareImage?: { url: string } };
      seoTitle?: string;
      seoDescription?: string;
      seoCanonical?: string;
    });

    const title = rawSeo.seo?.title || rawSeo.seoTitle || `${product.name} | Flowtop Bath Fittings`;
    const description =
      rawSeo.seo?.description ||
      rawSeo.seoDescription ||
      product.shortDescription ||
      'Architectural luxury bath brassware crafted in India.';
    const canonical = rawSeo.seo?.canonical || rawSeo.seoCanonical || `${siteUrl}/products/${product.slug}`;
    const ogImage = rawSeo.seo?.shareImage?.url || product.primaryImage;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Flowtop',
        locale: 'en_IN',
        type: 'website',
        images: ogImage ? [{ url: ogImage, alt: product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch {
    return {
      title: 'Product Details | Flowtop',
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  let product: ProductDetail;
  try {
    const res = await api.getProductBySlug(slug);
    product = res.data;
  } catch (err: unknown) {
    // 404 ApiError with code NOT_FOUND triggers notFound()
    if (err instanceof ApiError && err.status === 404 && err.code === 'NOT_FOUND') {
      notFound();
    }
    // Any other error (e.g. 500, network error) goes to error.tsx. Never turn a server failure into a 404.
    throw err;
  }

  // Fetch related products and public settings in parallel
  let relatedProducts: ProductCardType[] = [];
  let whatsappSettings: PublicSettingsResponse['whatsapp'] = {
    number: '+919876543210',
    generalTemplate: "Hi, I'd like to know more about Flowtop products.",
    productTemplate: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
  };

  try {
    const [relatedRes, settingsRes] = await Promise.all([
      api.getRelatedProducts(slug).catch(() => ({ data: [] })),
      api.getPublicSettings().catch(() => ({ data: undefined })),
    ]);

    if (relatedRes.data) {
      relatedProducts = relatedRes.data;
    }
    if (settingsRes?.data?.whatsapp) {
      whatsappSettings = settingsRes.data.whatsapp;
    }
  } catch {
    // Graceful fallback for secondary metadata
  }

  // Check if complete the look or extra placements exist
  const completeTheLook = (product as unknown as { completeTheLook?: ProductCardType[] }).completeTheLook || [];

  // Breadcrumbs items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    ...(product.categorySlug
      ? [
          {
            label: product.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            href: `/products?category=${product.categorySlug}`,
          },
        ]
      : []),
    { label: product.name },
  ];

  // Safe Product JSON-LD generation
  const isEnquiryOnly = Boolean((product as unknown as { enquiryOnly?: boolean }).enquiryOnly);
  const canonicalUrl = `${siteUrl}/products/${product.slug}`;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    image: product.gallery && product.gallery.length > 0 ? product.gallery.map((g) => g.url) : [product.primaryImage],
    description: product.shortDescription || product.name,
    brand: {
      '@type': 'Brand',
      name: 'Flowtop',
    },
  };

  // For enquiry-only products, emit the Product without offers.
  if (!isEnquiryOnly) {
    jsonLd.offers = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: paiseToDecimalString(product.salePrice ? product.salePrice : product.price),
      availability:
        product.isPurchasable && product.isAvailable
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    };
  }

  // Serialise safely: escape "<" as \u003c
  const jsonLdScript = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  const rawFullDescription = (product as unknown as { fullDescription?: string }).fullDescription || product.fullDescriptionHtml;

  return (
    <>
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript }}
      />

      <div className="container-page mx-auto px-space-4 md:px-space-6 lg:px-space-8 py-space-6 md:py-space-8 flex flex-col gap-space-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Top Product Hero: Gallery + Buy Panel */}
        <ProductHero
          product={product}
          whatsappNumber={whatsappSettings.number}
          whatsappTemplate={whatsappSettings.productTemplate}
        />

        {/* Below the Fold: Description */}
        <ProductDescription
          fullDescription={rawFullDescription}
          shortDescription={product.shortDescription}
        />

        {/* Below the Fold: Specifications Table */}
        <ProductSpecsTable specifications={product.specifications} />

        {/* Below the Fold: Downloads & Documents */}
        <ProductDocuments documents={product.downloads} />

        {/* Related Products: Render ONLY what the API returns; omitted when empty */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="mt-space-8 pt-space-8 border-t border-border"
          >
            <div className="flex items-center justify-between mb-space-6">
              <h2
                id="related-heading"
                className="font-display font-light text-headline tracking-tight text-fg"
              >
                Related Architectural Pieces
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4 md:gap-space-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} style="standard" />
              ))}
            </div>
          </section>
        )}

        {/* Complete the Look: Render ONLY what the API returns; omitted when empty */}
        {completeTheLook && completeTheLook.length > 0 && (
          <section
            aria-labelledby="complete-look-heading"
            className="mt-space-8 pt-space-8 border-t border-border"
          >
            <div className="flex items-center justify-between mb-space-6">
              <h2
                id="complete-look-heading"
                className="font-display font-light text-headline tracking-tight text-fg"
              >
                Complete the Look
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-4 md:gap-space-6">
              {completeTheLook.map((p) => (
                <ProductCard key={p.id} product={p} style="standard" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

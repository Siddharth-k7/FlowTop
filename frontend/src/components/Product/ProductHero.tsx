'use client';

import React, { useState, useMemo } from 'react';
import type { ProductDetail } from '../../lib/types-pending';
import { ProductGallery, GalleryImage } from './ProductGallery';
import { ProductBuyPanel, NormalizedVariant } from './ProductBuyPanel';
import { MobileStickyBar } from './MobileStickyBar';

export interface ProductHeroProps {
  product: ProductDetail;
  whatsappNumber?: string;
  whatsappTemplate?: string;
}

export function ProductHero({
  product,
  whatsappNumber,
  whatsappTemplate,
}: ProductHeroProps) {
  const [selectedVariant, setSelectedVariant] = useState<NormalizedVariant | null>(null);
  const [mainButtonEl, setMainButtonEl] = useState<HTMLElement | null>(null);

  // Normalize gallery images
  const galleryImages: GalleryImage[] = useMemo(() => {
    if (product.gallery && product.gallery.length > 0) {
      return product.gallery.map((item, idx) => ({
        id: item.id || `gallery-${idx}`,
        url: item.url,
        alt: item.alt || `${product.name} view ${idx + 1}`,
        width: item.width || 800,
        height: item.height || 800,
      }));
    }

    if (product.primaryImage) {
      return [
        {
          id: 'primary',
          url: product.primaryImage,
          alt: `${product.name} primary view`,
          width: 800,
          height: 800,
        },
      ];
    }

    return [];
  }, [product]);

  // Variant image if variant defines one
  const activeVariantImage: GalleryImage | null = useMemo(() => {
    if (selectedVariant?.image?.url) {
      return {
        id: selectedVariant.image.id || `var-${selectedVariant.id}`,
        url: selectedVariant.image.url,
        alt: selectedVariant.image.alt || `${product.name} in ${selectedVariant.name}`,
        width: 800,
        height: 800,
      };
    }
    return null;
  }, [selectedVariant, product.name]);

  const activePrice = selectedVariant
    ? selectedVariant.salePrice
      ? selectedVariant.salePrice
      : selectedVariant.price
    : product.salePrice
    ? product.salePrice
    : product.price;

  const isEnquiryOnly = Boolean((product as unknown as { enquiryOnly?: boolean }).enquiryOnly);
  const isPurchasable = product.isPurchasable && (selectedVariant ? selectedVariant.isAvailable : product.isAvailable) && !isEnquiryOnly;

  // WhatsApp link for mobile sticky bar
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const cleanPhone = (whatsappNumber || '+919876543210').replace(/[^0-9]/g, '');
  const template = whatsappTemplate || "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}";
  const whatsappText = template
    .replace('{productName}', product.name)
    .replace('{sku}', selectedVariant?.sku || product.sku)
    .replace('{finish}', selectedVariant?.name || 'Standard')
    .replace('{url}', currentUrl);
  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 items-start">
        {/* Left: Gallery (7 columns on large desktop) */}
        <div className="lg:col-span-7 w-full">
          <ProductGallery
            images={galleryImages}
            productName={product.name}
            activeVariantImage={activeVariantImage}
          />
        </div>

        {/* Right: Buy Panel (5 columns on large desktop, sticky) */}
        <div className="lg:col-span-5 w-full lg:sticky lg:top-space-6">
          <ProductBuyPanel
            product={product}
            whatsappNumber={whatsappNumber}
            whatsappTemplate={whatsappTemplate}
            onVariantChange={setSelectedVariant}
            onMainButtonRefReady={setMainButtonEl}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (IntersectionObserver on main button) */}
      <MobileStickyBar
        productName={product.name}
        price={activePrice}
        isPurchasable={isPurchasable}
        isEnquiryOnly={isEnquiryOnly}
        whatsappHref={whatsappHref}
        onAddToCart={() => {
          if (mainButtonEl) {
            mainButtonEl.click();
          }
        }}
        mainButtonElement={mainButtonEl}
      />
    </>
  );
}

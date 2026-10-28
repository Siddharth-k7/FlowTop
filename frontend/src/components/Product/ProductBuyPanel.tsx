'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ProductDetail } from '../../lib/types-pending';
import { api, ApiError } from '../../lib/api';
import { formatPaise, isValidHex } from '../../lib/format';
import { Button } from '@flowtop/ui';
import { useOptionalCart } from '../Cart';
import { ProductWhatsAppButton } from '../WhatsApp';
import { analytics } from '../../lib/analytics';

export interface NormalizedVariant {
  id: string;
  name: string;
  code: string;
  price: number;
  salePrice?: number | null;
  sku: string;
  skuSuffix?: string;
  swatchHex?: string;
  image?: { id: string; url: string; alt?: string };
  isAvailable: boolean;
  isDefault?: boolean;
}

export interface ProductBuyPanelProps {
  product: ProductDetail;
  whatsappNumber?: string;
  whatsappTemplate?: string;
  onVariantChange?: (variant: NormalizedVariant | null) => void;
  onMainButtonRefReady?: (el: HTMLElement | null) => void;
}

export function ProductBuyPanel({
  product,
  onVariantChange,
  onMainButtonRefReady,
}: ProductBuyPanelProps) {
  const fallbackVariant: NormalizedVariant = useMemo(
    () => ({
      id: 'default',
      name: 'Standard',
      code: 'standard',
      price: product.price,
      salePrice: product.salePrice,
      sku: product.sku,
      isAvailable: product.isAvailable !== false,
      isDefault: true,
    }),
    [product]
  );

  // 1. Normalize variants / finishes from payload
  const variants: NormalizedVariant[] = useMemo(() => {
    // Check if contract-style variants array exists
    const contractVariants = (product as unknown as { variants?: NormalizedVariant[] }).variants;
    if (contractVariants && Array.isArray(contractVariants) && contractVariants.length > 0) {
      return contractVariants.map((v, i) => ({
        id: v.id || `var-${i}`,
        name: v.name,
        code: v.code || v.name.toLowerCase().replace(/\s+/g, '-'),
        price: v.price || product.price,
        salePrice: v.salePrice ?? product.salePrice,
        sku: v.skuSuffix ? `${product.sku}-${v.skuSuffix}` : product.sku,
        skuSuffix: v.skuSuffix,
        swatchHex: v.swatchHex,
        image: v.image,
        isAvailable: v.isAvailable !== false,
        isDefault: Boolean(v.isDefault),
      }));
    }

    // Fallback to finishesDetail from mock payload
    if (product.finishesDetail && product.finishesDetail.length > 0) {
      return product.finishesDetail.map((f, i) => ({
        id: f.id || `f-${i}`,
        name: f.name,
        code: f.code,
        price: f.pricePaise || product.price,
        salePrice: product.salePrice,
        sku: `${product.sku}-${f.code.toUpperCase()}`,
        swatchHex: undefined,
        image: undefined,
        isAvailable: f.inStock !== false,
        isDefault: i === 0,
      }));
    }

    // Default single finish representing base product
    return [fallbackVariant];
  }, [product, fallbackVariant]);

  // 2. Active variant selection
  const [selectedCode, setSelectedCode] = useState<string>(() => {
    const def = variants.find((v) => v.isDefault && v.isAvailable) || variants.find((v) => v.isAvailable) || variants[0];
    return def ? def.code : 'standard';
  });

  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const mainButtonRef = useRef<HTMLButtonElement | null>(null);

  // Notify parent of button ref for sticky bar observer
  useEffect(() => {
    if (onMainButtonRefReady) {
      onMainButtonRefReady(mainButtonRef.current);
    }
  }, [onMainButtonRefReady]);

  // Read ?finish=code from URL on initial client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const finishFromUrl = urlParams.get('finish');
    if (finishFromUrl) {
      const match = variants.find((v) => v.code === finishFromUrl);
      if (match && match.isAvailable) {
        setSelectedCode(match.code);
        onVariantChange?.(match);
      }
    }
  }, [variants, onVariantChange]);

  // Track product_view analytics event (product events carry strictly id, name, category, price)
  useEffect(() => {
    analytics.productView({
      id: product.id,
      name: product.name,
      category: product.categorySlug || 'general',
      price: product.price,
    });
  }, [product.id, product.name, product.categorySlug, product.price]);

  const activeVariant: NormalizedVariant = useMemo(() => {
    return variants.find((v) => v.code === selectedCode) || variants[0] || fallbackVariant;
  }, [variants, selectedCode, fallbackVariant]);

  // 3. Switch finish handler (zero network traffic, pure in-memory)
  const handleSelectFinish = (v: NormalizedVariant) => {
    if (!v.isAvailable) return; // Unavailable variants cannot be selected

    setSelectedCode(v.code);
    setCartSuccess(false);
    setCartError(null);

    // Reflect choice in URL with window.history.replaceState (?finish=code) without reload or network call
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('finish', v.code);
      window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
    }

    // Polite live region announcement
    const priceStr = formatPaise(v.price);
    setLiveAnnouncement(`Finish: ${v.name}, price ${priceStr}`);

    // Notify parent (e.g. to update gallery image)
    onVariantChange?.(v);
  };

  const cartContext = useOptionalCart();

  // 4. Add to cart handler
  const handleAddToCart = async () => {
    if (!product.isPurchasable || !activeVariant.isAvailable || isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);
    setCartError(null);
    setCartSuccess(false);

    try {
      /**
       * CRITICAL SECURITY RULE: NEVER SEND A PRICE TO THE API.
       * Product ID, variant ID and quantity are the ONLY inputs sent.
       * A client-supplied price is a real attack vector (price manipulation / client tampering)
       * and must never exist in this request. All pricing and money calculations are performed
       * strictly server-side by the commerce engine.
       */
      if (cartContext) {
        await cartContext.addToCart({
          productId: product.id,
          variantId: activeVariant.id !== 'default' ? activeVariant.id : undefined,
          quantity,
        });
        cartContext.openCart();
      } else {
        await api.addToCart({
          productId: product.id,
          variantId: activeVariant.id !== 'default' ? activeVariant.id : undefined,
          quantity,
        });
      }

      setCartSuccess(true);
      // Fire typed addToCart analytics (strictly id, name, category, price)
      analytics.addToCart({
        id: product.id,
        name: product.name,
        category: product.categorySlug || 'general',
        price: activeVariant.price || product.price,
      });
      setTimeout(() => setCartSuccess(false), 2400);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCartError(err.message);
      } else if (err instanceof Error) {
        setCartError(err.message);
      } else {
        setCartError('Could not add item to cart. Please try again.');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isArchived =
    product.status === 'archived' ||
    Boolean((product as unknown as { isArchived?: boolean }).isArchived);
  const isEnquiryOnly = Boolean((product as unknown as { enquiryOnly?: boolean }).enquiryOnly);
  const isPurchasable = !isArchived && product.isPurchasable && activeVariant.isAvailable && !isEnquiryOnly;
  const activePrice = activeVariant.salePrice ? activeVariant.salePrice : activeVariant.price;
  const hasSale = Boolean(activeVariant.salePrice && activeVariant.salePrice < activeVariant.price);

  return (
    <div className="flex flex-col bg-surface-solid rounded-md border border-border shadow-md p-space-6 w-full">
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Header: Name & SKU */}
      <div className="border-b border-border pb-space-4 mb-space-4">
        <h1 className="font-display font-light text-headline tracking-tight text-fg mb-space-1">
          {product.name}
        </h1>
        <p className="text-caption text-text-muted">
          SKU: <span className="font-mono text-fg">{activeVariant.sku}</span>
        </p>
      </div>

      {/* Price Block */}
      <div className="flex items-baseline gap-space-3 mb-space-4">
        <span className="font-display font-semibold text-headline text-fg">
          {formatPaise(activePrice)}
        </span>
        {hasSale && (
          <span className="text-body text-text-muted line-through">
            {formatPaise(activeVariant.price)}
          </span>
        )}
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-body text-fg-muted mb-space-6 leading-relaxed">
          {product.shortDescription}
        </p>
      )}

      {/* Finish Picker (Radiogroup) */}
      {variants.length > 1 && (
        <div className="mb-space-6">
          <div className="flex items-center justify-between mb-space-2">
            <label id="finish-label" className="text-small font-medium text-fg">
              Finish: <span className="text-primary font-semibold">{activeVariant.name}</span>
            </label>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="finish-label"
            className="flex flex-wrap gap-space-3"
          >
            {variants.map((v) => {
              const isSelected = v.code === selectedCode;
              const isDisabled = !v.isAvailable;

              return (
                <button
                  key={v.id || v.code}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={isDisabled}
                  disabled={isDisabled}
                  onClick={() => handleSelectFinish(v)}
                  className={`flex items-center gap-space-2 px-space-3 py-space-2 rounded-sm border text-small transition-all focus-ring ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary bg-primary-tint/30 text-fg font-medium'
                      : isDisabled
                      ? 'border-border opacity-40 cursor-not-allowed bg-surface line-through text-text-muted'
                      : 'border-border-input hover:border-fg text-fg bg-surface-solid'
                  }`}
                >
                  {/* Swatch Dot */}
                  <span
                    className="w-4 h-4 rounded-full border border-border shadow-sm flex-shrink-0"
                    style={{
                      backgroundColor: isValidHex(v.swatchHex) ? v.swatchHex : undefined,
                    }}
                    aria-hidden="true"
                  />
                  {/* Visible Text Label */}
                  <span>{v.name}</span>
                  {isDisabled && <span className="text-caption text-warning">(Unavailable)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability Status */}
      <div className="mb-space-6">
        {product.isAvailable && activeVariant.isAvailable ? (
          <div className="flex items-center gap-space-2 text-caption text-success font-medium">
            <span className="w-2 h-2 rounded-full bg-success" />
            {product.availabilityMessage || 'In Stock — Ships within 2-3 business days'}
          </div>
        ) : (
          <div className="flex items-center gap-space-2 text-caption text-warning font-medium">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {product.availabilityMessage || 'Currently Unavailable for immediate dispatch'}
          </div>
        )}
      </div>

      {/* Quantity & CTA Actions */}
      <div className="flex flex-col gap-space-3 mt-auto pt-space-2">
        {/* Quantity Stepper (only for purchasable products) */}
        {!isEnquiryOnly && product.isPurchasable && (
          <div className="flex items-center gap-space-3 mb-space-2">
            <label htmlFor="product-qty" className="text-small font-medium text-fg">
              Quantity:
            </label>
            <div className="inline-flex items-center rounded-sm border border-border-input bg-surface-solid">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !isPurchasable}
                aria-label="Decrease quantity"
                className="px-space-3 py-space-2 text-body hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-l-sm"
              >
                −
              </button>
              <input
                id="product-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) setQuantity(val);
                }}
                disabled={!isPurchasable}
                className="w-12 text-center text-small font-medium bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                disabled={!isPurchasable}
                aria-label="Increase quantity"
                className="px-space-3 py-space-2 text-body hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed focus-ring rounded-r-sm"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Archival State Notice */}
        {isArchived && (
          <div
            role="status"
            className="p-space-3 rounded-sm bg-warning-tint border border-warning/30 text-fg text-small flex items-start gap-space-2 mb-space-3"
          >
            <span className="text-warning font-semibold" aria-hidden="true">ⓘ</span>
            <span>
              This fitting has been archived and is no longer in production. It cannot be added to a new bag.
            </span>
          </div>
        )}

        {/* Primary CTA Button */}
        {isEnquiryOnly ? (
          /* Enquiry-Only: WhatsApp is the prominent primary action */
          <ProductWhatsAppButton
            product={{
              productName: product.name,
              sku: activeVariant.sku || product.sku,
              finish: activeVariant.name,
              url: typeof window !== 'undefined' ? window.location.href : `/products/${product.slug}`,
            }}
            variant="primary"
            label="Inquire on WhatsApp"
          />
        ) : (
          /* Standard Product: Add to Cart button with attached round arrow */
          <Button
            ref={mainButtonRef}
            variant="primary"
            size="lg"
            loading={isAddingToCart}
            disabled={!isPurchasable}
            onClick={handleAddToCart}
            className="w-full"
          >
            <span>
              {cartSuccess
                ? 'Added to Bag'
                : isArchived
                ? 'Archived Piece'
                : !product.isPurchasable || !activeVariant.isAvailable
                ? 'Unavailable'
                : 'Add to Cart'}
            </span>
            {!isArchived && isPurchasable && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 ml-space-1"
                aria-hidden="true"
              >
                →
              </span>
            )}
          </Button>
        )}

        {/* Secondary WhatsApp Enquiry (rendered if not enquiry-only) */}
        {!isEnquiryOnly && (
          <ProductWhatsAppButton
            product={{
              productName: product.name,
              sku: activeVariant.sku || product.sku,
              finish: activeVariant.name,
              url: typeof window !== 'undefined' ? window.location.href : `/products/${product.slug}`,
            }}
            variant="outline"
            label="Ask a Specialist via WhatsApp"
          />
        )}

        {/* Success Confirmation Notice */}
        {cartSuccess && (
          <div
            role="status"
            className="p-space-3 rounded-sm bg-success-tint border border-success/30 text-success text-small flex items-center justify-between animate-fade-in"
          >
            <span>Added to cart successfully!</span>
            <span className="font-semibold text-caption">Phase 4 Cart Drawer</span>
          </div>
        )}

        {/* Real Failure Error Notice */}
        {cartError && (
          <div
            role="alert"
            className="p-space-3 rounded-sm bg-error-tint border border-error/30 text-error text-small"
          >
            {cartError}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ProductDetail } from '../../lib/types-pending';
import { api, ApiError } from '../../lib/api';
import { formatPaise, isValidHex } from '../../lib/format';
import { Button } from '@flowtop/ui';

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
  whatsappNumber = '+919876543210',
  whatsappTemplate = "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
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
       * Rule: Never trust the client with price or money calculations.
       * Product ID, variant ID and quantity are the only inputs sent;
       * prices, totals, tax, and discounts are computed strictly server-side by the commerce engine.
       */
      await api.addToCart({
        productId: product.id,
        variantId: activeVariant.id !== 'default' ? activeVariant.id : undefined,
        quantity,
      });

      setCartSuccess(true);
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

  // 5. WhatsApp enquiry link generator
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const whatsappText = whatsappTemplate
    .replace('{productName}', product.name)
    .replace('{sku}', activeVariant.sku)
    .replace('{finish}', activeVariant.name)
    .replace('{url}', currentUrl);
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

  const isEnquiryOnly = Boolean((product as unknown as { enquiryOnly?: boolean }).enquiryOnly);
  const isPurchasable = product.isPurchasable && activeVariant.isAvailable && !isEnquiryOnly;
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

        {/* Primary CTA Button */}
        {isEnquiryOnly ? (
          /* Enquiry-Only: WhatsApp is the prominent primary action */
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center font-medium rounded-pill focus-ring touch-target transition-colors select-none text-center bg-primary text-on-primary hover:bg-primary-dark shadow-sm border border-transparent min-h-touch px-space-6 py-space-3 text-body gap-space-3"
          >
            <span>Inquire on WhatsApp</span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 ml-space-1"
              aria-hidden="true"
            >
              →
            </span>
          </a>
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
              {!product.isPurchasable || !activeVariant.isAvailable
                ? 'Unavailable'
                : 'Add to Cart'}
            </span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 ml-space-1"
              aria-hidden="true"
            >
              →
            </span>
          </Button>
        )}

        {/* Secondary WhatsApp Enquiry (rendered if not enquiry-only) */}
        {!isEnquiryOnly && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center font-medium rounded-pill focus-ring touch-target transition-colors select-none text-center bg-surface-solid text-fg border border-border-input hover:bg-surface shadow-sm min-h-touch px-space-4 py-space-2 text-small gap-space-2"
          >
            <svg
              className="w-4 h-4 text-success"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>Ask a Specialist via WhatsApp</span>
          </a>
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

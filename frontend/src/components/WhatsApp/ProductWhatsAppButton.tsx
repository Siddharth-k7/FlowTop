'use client';

import React from 'react';
import { usePublicSettings } from '../../lib/usePublicSettings';
import { buildProductWhatsAppUrl, ProductWhatsAppContext } from '../../lib/whatsapp';
import { analytics } from '../../lib/analytics';

export interface ProductWhatsAppButtonProps {
  product: ProductWhatsAppContext;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact' | 'icon';
  className?: string;
  label?: string;
}

/**
 * ProductWhatsAppButton
 *
 * Requirements:
 * 1. Used on product detail pages and product cards.
 * 2. Builds message from settings.whatsapp.productTemplate, replacing
 *    {productName}, {sku}, {finish}, and {url}.
 * 3. URL-encodes properly (handles ampersands '&' and non-ASCII characters).
 * 4. Fires an analytics click event. A WhatsApp click is NOT a lead.
 */
export function ProductWhatsAppButton({
  product,
  variant = 'secondary',
  className = '',
  label = 'Enquire on WhatsApp',
}: ProductWhatsAppButtonProps) {
  const { settings } = usePublicSettings();

  // If settings not loaded yet, don't show or render disabled placeholder
  if (!settings?.whatsapp?.number) {
    return null;
  }

  // Derive absolute URL if relative path supplied
  let fullUrl = product.url;
  if (fullUrl && fullUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      fullUrl = `${window.location.origin}${fullUrl}`;
    } else {
      fullUrl = `https://flowtop.in${fullUrl}`;
    }
  }

  const href = buildProductWhatsAppUrl({
    number: settings.whatsapp.number,
    template:
      settings.whatsapp.productTemplate ||
      "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
    product: {
      ...product,
      url: fullUrl,
    },
  });

  const handleClick = () => {
    /**
     * CRITICAL ANALYTICS CONTRACT:
     * A WhatsApp click is strictly recorded as a click event.
     * It is NEVER recorded as a lead or conversion.
     */
    analytics.whatsAppClick({
      placement: variant === 'compact' || variant === 'icon' ? 'product_card' : 'product_page',
      sku: product.sku,
      productName: product.productName,
    });
  };

  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus-ring touch-target select-none';

  if (variant === 'icon') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`w-9 h-9 rounded-full bg-surface-solid border border-border text-success hover:bg-success hover:text-on-primary hover:border-transparent transition-all shadow-sm flex items-center justify-center focus-ring ${className}`}
        aria-label={`Enquire about ${product.productName} on WhatsApp (opens in new tab)`}
        title="Enquire on WhatsApp"
      >
        <WhatsAppIcon className="w-4 h-4 fill-current" />
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`${baseClasses} text-caption px-space-3 py-space-1.5 rounded-pill border border-border text-fg hover:bg-surface gap-space-1.5 ${className}`}
        aria-label={`Enquire about ${product.productName} on WhatsApp`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-success" />
        <span>WhatsApp</span>
      </a>
    );
  }

  if (variant === 'outline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`${baseClasses} text-small px-space-4 py-space-2.5 rounded-pill border border-border text-fg hover:bg-surface gap-space-2 w-full shadow-xs ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 fill-current text-success" />
        <span>{label}</span>
      </a>
    );
  }

  // Primary / Secondary full-width button (ideal for PDP)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${baseClasses} text-body px-space-6 py-space-3 rounded-pill gap-space-2 w-full text-center border shadow-xs ${
        variant === 'primary'
          ? 'bg-success text-on-primary hover:opacity-90 border-transparent font-medium'
          : 'bg-surface-solid hover:bg-surface border-border text-fg'
      } ${className}`}
    >
      <WhatsAppIcon className="w-5 h-5 fill-current text-success" />
      <span>{label}</span>
    </a>
  );
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.031 2C6.505 2 2.016 6.488 2.016 12.015c0 1.954.561 3.82 1.626 5.419L2 22l4.721-1.603a9.98 9.98 0 005.31 1.618h.004c5.524 0 10.015-4.489 10.015-10.016 0-2.677-1.043-5.195-2.936-7.087C17.222 3.039 14.704 2 12.031 2zm5.823 14.168c-.244.686-1.42 1.31-1.959 1.391-.512.077-1.168.109-3.754-.962-3.155-1.306-5.184-4.512-5.34-4.722-.157-.209-1.282-1.704-1.282-3.25 0-1.547.81-2.308 1.098-2.622.287-.314.628-.393.837-.393.209 0 .419.002.602.011.194.009.454-.073.71.541.263.63 1.022 2.493 1.111 2.676.089.183.149.398.029.637-.119.239-.179.387-.358.597-.18.21-.378.468-.54.629-.18.179-.367.373-.158.732.209.359.93 1.534 1.996 2.483 1.369 1.219 2.523 1.597 2.882 1.776.359.179.569.15.779-.09.21-.239.897-1.047 1.137-1.406.239-.359.478-.3.799-.18.322.12 2.037.961 2.387 1.136.35.175.583.262.668.409.085.147.085.852-.159 1.538z" />
    </svg>
  );
}

'use client';

import type { ProductCardView, ProductCardStyle } from '../../sections/types';
import { usePicture, useLink } from '../UiProvider/UiProvider';
import { Badge } from '../Badge';

export type { ProductCardStyle };

export interface ProductCardProps {
  product: ProductCardView;
  style?: ProductCardStyle;
  cardStyle?: ProductCardStyle;
  highlight?: boolean;
  priority?: boolean;
  className?: string;
}

function formatPaiseToRupees(paise?: number): string {
  if (paise === undefined || paise === null || isNaN(paise)) return '';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * ProductCard Component
 *
 * Requirements:
 * - Card styles: standard, compact, editorial
 * - Direct placement badge rendering from view model (never derived)
 * - Optional highlight outline for Dev D's placement preview
 * - Navigation via provider's Link
 * - Imagery via provider's Picture with calm hover scaling
 * - Accessible name, 44px touch targets, focus-ring
 */
export function ProductCard({
  product,
  style,
  cardStyle,
  highlight = false,
  priority = false,
  className = '',
}: ProductCardProps) {
  const activeStyle = cardStyle || style || 'standard';
  const Picture = usePicture();
  const Link = useLink();

  const {
    id,
    name,
    slug,
    sku,
    price,
    salePrice,
    primaryImage,
    hoverImage,
    badge,
    swatches,
    isAvailable = true,
    availabilityMessage,
  } = product;

  const primaryUrl =
    typeof primaryImage === 'string' ? primaryImage : primaryImage?.url || '';
  const primaryAlt =
    (typeof primaryImage === 'object' && primaryImage?.alt) || name;

  const hoverUrl =
    typeof hoverImage === 'string' ? hoverImage : hoverImage?.url || null;
  const hoverAlt =
    (typeof hoverImage === 'object' && hoverImage?.alt) || `${name} alternate angle`;

  const isEditorial = activeStyle === 'editorial';
  const isCompact = activeStyle === 'compact';

  const formattedPrice = formatPaiseToRupees(price);
  const formattedSalePrice = salePrice ? formatPaiseToRupees(salePrice) : null;

  return (
    <article
      data-product-id={id}
      className={`group relative flex flex-col justify-between bg-surface-solid border rounded-md overflow-hidden transition-all duration-base hover:shadow-lg ${
        highlight
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-solid border-primary'
          : 'border-border'
      } ${isEditorial ? 'p-space-5' : isCompact ? 'p-space-3' : 'p-space-3'} ${className}`}
    >
      {/* Product Image Frame */}
      <div className="relative w-full aspect-[4/5] rounded-sm overflow-hidden bg-surface">
        {/* Placement Badge from View Model (never derived) */}
        {badge && (
          <div className="absolute top-space-3 left-space-3 z-raised">
            <Badge
              variant="neutral"
              className="bg-surface-solid/95 text-fg border-transparent shadow-sm font-semibold"
            >
              {badge}
            </Badge>
          </div>
        )}

        {primaryUrl ? (
          <>
            <Picture
              desktopSrc={primaryUrl}
              alt={primaryAlt}
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                hoverUrl ? 'group-hover:opacity-0' : ''
              }`}
              width={600}
              height={750}
            />
            {hoverUrl && (
              <Picture
                desktopSrc={hoverUrl}
                alt={hoverAlt}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out opacity-0 group-hover:opacity-100 group-hover:scale-105"
                width={600}
                height={750}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-light text-fg-muted">
            <span className="text-caption">Architectural Brassware</span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="flex flex-col flex-1 justify-between gap-space-1 pt-space-4 pb-space-2 px-space-1">
        <div className="flex flex-col gap-space-1">
          {sku && isEditorial && (
            <span className="text-caption font-mono text-fg-muted tracking-wider">
              {sku}
            </span>
          )}

          <h3 className="font-body font-regular text-small text-fg group-hover:text-primary transition-colors line-clamp-2">
            <Link
              href={`/products/${slug}`}
              className="focus-ring outline-none after:absolute after:inset-0"
              aria-label={`${name}, ${formattedPrice || 'Price on request'}`}
            >
              {name}
            </Link>
          </h3>
        </div>

        {/* Swatches strip if present */}
        {swatches && swatches.length > 0 && (
          <div className="flex items-center gap-space-1 py-space-1 z-raised">
            {swatches.map((swatch) => (
              <span
                key={swatch.id}
                title={swatch.name}
                aria-label={swatch.name}
                className="w-3.5 h-3.5 rounded-pill border border-border shadow-xs bg-surface-solid"
              />
            ))}
          </div>
        )}

        {/* Pricing & Availability */}
        <div className="flex items-baseline justify-between gap-space-2 pt-space-1">
          <div className="flex items-baseline gap-space-2">
            {formattedSalePrice ? (
              <>
                <span className="text-small font-semibold text-fg">
                  {formattedSalePrice}
                </span>
                <span className="text-caption text-fg-muted line-through">
                  {formattedPrice}
                </span>
              </>
            ) : formattedPrice ? (
              <span className="text-small font-semibold text-fg">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-caption text-fg-muted">Price on request</span>
            )}
          </div>

          {!isAvailable && (
            <span className="text-caption text-error font-medium">
              {availabilityMessage || 'Out of Stock'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

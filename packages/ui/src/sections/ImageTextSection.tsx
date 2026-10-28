import type { ImageTextSectionConfig } from './types';
import { SectionShell } from './SectionShell';
import { safeHref } from './safeHref';
import { usePicture } from '../components/UiProvider/UiProvider';
import { buttonClasses } from '../components/Button';
import {
  PRESET_COLUMN_RATIOS,
  PRESET_IMAGE_SIDES,
  PRESET_MOBILE_ORDERS,
} from './presets';

export interface ImageTextSectionProps {
  config: ImageTextSectionConfig;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  imageAlt?: string;
  className?: string;
}

/**
 * Image Text Section Component
 *
 * Requirements:
 * - Configurable column ratio (50-50, 60-40, 40-60)
 * - Configurable desktop image side (left or right)
 * - Stacks below 768px in the configured order (image-first or text-first)
 * - Plain text body split into paragraphs (never raw HTML)
 * - Image keeps aspect ratio with zero layout shift
 * - Safe CTA action button
 */
export function ImageTextSection({
  config,
  imageUrl,
  mobileImageUrl,
  imageAlt,
  className = '',
}: ImageTextSectionProps) {
  const Picture = usePicture();
  const headingId = `imagetext-heading-${config.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;

  // Safe alt resolution
  const safeAlt = typeof imageAlt === 'string' && imageAlt.trim().length > 0 ? imageAlt.trim() : '';
  if (!safeAlt) {
    console.warn('[ImageTextSection] Image missing alt text; provided decorative alt="".');
  }

  // Split plain text body into paragraphs (strictly never raw HTML)
  const paragraphs = config.body
    .replace(/<[^>]*>/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Column distribution & ordering presets
  const ratioClass = PRESET_COLUMN_RATIOS[config.ratio] || PRESET_COLUMN_RATIOS['50-50'];
  const sideClass = PRESET_IMAGE_SIDES[config.imageSide] || PRESET_IMAGE_SIDES.left;
  const mobileOrderClass = PRESET_MOBILE_ORDERS[config.mobileOrder] || PRESET_MOBILE_ORDERS['image-first'];

  const safeCtaUrl = config.cta ? safeHref(config.cta.href) : null;

  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div className={`flex ${mobileOrderClass} ${sideClass} gap-space-7 lg:gap-space-8 items-center w-full`}>
        {/* Image Column */}
        <div className={`${ratioClass} w-full shrink-0`}>
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-lg overflow-hidden border border-border bg-surface-light">
            {imageUrl ? (
              <Picture
                desktopSrc={imageUrl}
                mobileSrc={mobileImageUrl}
                alt={safeAlt}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="w-full h-full object-cover"
                width={1200}
                height={750}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-light text-fg-muted">
                <span className="text-small tracking-wide font-regular">Architectural Imagery</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Column */}
        <div className="flex-1 flex flex-col justify-center w-full">
          <h2
            id={headingId}
            className="font-display font-light text-headline md:text-display tracking-tight text-fg mb-space-4 leading-tight"
          >
            {config.heading}
          </h2>

          {/* Plain text paragraphs */}
          <div className="flex flex-col gap-space-4 text-body md:text-title font-regular text-fg-muted leading-relaxed max-w-md mb-space-6">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {/* Optional CTA */}
          {config.cta && safeCtaUrl && (
            <div className="pt-space-1">
              <a
                href={safeCtaUrl}
                className={buttonClasses({
                  variant: config.cta.style === 'secondary' ? 'secondary' : 'primary',
                  size: 'md',
                  className: 'px-space-6',
                })}
              >
                {config.cta.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

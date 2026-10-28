import type { HeroSectionConfig } from './types';
import { SectionShell } from './SectionShell';
import { safeHref } from './safeHref';
import { usePicture } from '../components/UiProvider/UiProvider';
import { HeroVideo } from './HeroVideo';
import { buttonClasses } from '../components/Button';
import { PRESET_OVERLAYS, PRESET_TEXT_POSITIONS } from './presets';

export interface HeroSectionProps {
  config: HeroSectionConfig;
  isFirst?: boolean;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  imageAlt?: string;
  posterUrl?: string | null;
  className?: string;
}

/**
 * Hero Section Component
 *
 * Requirements:
 * - Headline (H1 if isFirst, otherwise H2 for strict 1 H1 per page rule)
 * - Subheading, up to 2 CTAs (no gaps if absent)
 * - Art-directed Picture (desktop + mobile below 768px) or Video
 * - Rounded-lg frame when layout.width is not full-bleed
 * - Overlay preset (bg-ink opacity) or frosted glass panel for overlay="none"
 * - LCP element when isFirst: priority=true, explicit dimensions, zero fade-in
 * - 9-point alignment grid
 */
export function HeroSection({
  config,
  isFirst = false,
  desktopImageUrl,
  mobileImageUrl,
  imageAlt,
  posterUrl,
  className = '',
}: HeroSectionProps) {
  const Picture = usePicture();
  const HeadingTag = isFirst ? 'h1' : 'h2';
  const headingId = `hero-heading-${config.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;

  // Safe alt resolution: alt text required; missing alt gets alt="" and console warning, never filename
  const safeAlt = typeof imageAlt === 'string' && imageAlt.trim().length > 0 ? imageAlt.trim() : '';
  if (!safeAlt) {
    console.warn('[HeroSection] Image missing alt text; provided decorative alt="".');
  }

  const isFullBleed = config.layout?.width === 'full';
  const frameClasses = isFullBleed
    ? 'relative w-full overflow-hidden'
    : 'relative w-full rounded-lg overflow-hidden border border-border shadow-md';

  const overlayClass = PRESET_OVERLAYS[config.overlay];
  const textPositionClass = PRESET_TEXT_POSITIONS[config.textPosition];

  // Up to two CTAs with safeHref verification
  const validCtas = (config.ctas || [])
    .slice(0, 2)
    .map((cta) => ({
      ...cta,
      safeUrl: safeHref(cta.href),
    }))
    .filter((cta): cta is typeof cta & { safeUrl: string } => cta.safeUrl !== null);

  const hasMedia =
    (config.mediaType === 'image' && Boolean(desktopImageUrl || config.desktopImageId)) ||
    (config.mediaType === 'video' && Boolean(config.videoUrl));

  const isOverlayNone = config.overlay === 'none';

  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div
        className={`${frameClasses} min-h-[440px] md:min-h-[560px] lg:min-h-[640px] flex ${textPositionClass} p-space-6 md:p-space-10 lg:p-space-12 bg-surface`}
      >
        {/* Media Background */}
        {hasMedia && (
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {config.mediaType === 'video' && config.videoUrl ? (
              <HeroVideo
                videoUrl={config.videoUrl}
                posterUrl={posterUrl || desktopImageUrl}
                ariaLabel={safeAlt || config.headline}
              />
            ) : desktopImageUrl ? (
              <Picture
                desktopSrc={desktopImageUrl}
                mobileSrc={mobileImageUrl}
                alt={safeAlt}
                priority={isFirst}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 100vw"
                width={1920}
                height={1080}
              />
            ) : null}

            {/* Fixed Overlay Preset (unless overlay is 'none') */}
            {!isOverlayNone && (
              <div className={`absolute inset-0 ${overlayClass} pointer-events-none`} />
            )}
          </div>
        )}

        {/* Content Box: If overlay is 'none', wrap in frosted glass panel to guarantee contrast */}
        <div
          className={`relative z-10 max-w-2xl flex flex-col ${
            isOverlayNone && hasMedia
              ? 'bg-surface-glass backdrop-blur-md border border-white/40 rounded-lg p-space-6 md:p-space-8 text-fg shadow-xl'
              : hasMedia
              ? 'text-white'
              : 'text-fg'
          }`}
        >
          {/* Main Headline */}
          <HeadingTag
            id={headingId}
            className="font-display font-light text-display tracking-tight leading-tight mb-space-3"
          >
            {config.headline}
          </HeadingTag>

          {/* Subheading (renders with zero gap if absent) */}
          {config.subheading && (
            <p
              className={`text-body md:text-title font-light leading-relaxed mb-space-6 max-w-measure ${
                isOverlayNone && hasMedia ? 'text-fg-muted' : hasMedia ? 'text-white/90' : 'text-fg-muted'
              }`}
            >
              {config.subheading}
            </p>
          )}

          {/* Action CTAs (up to two, rendered without gap if absent) */}
          {validCtas.length > 0 && (
            <div className="flex flex-wrap items-center gap-space-3 pt-space-1">
              {validCtas.map((cta, idx) => {
                const variant =
                  cta.style === 'secondary'
                    ? 'secondary'
                    : cta.style === 'ghost'
                    ? 'ghost'
                    : 'primary';

                return (
                  <a
                    key={idx}
                    href={cta.safeUrl}
                    className={buttonClasses({ variant, size: 'lg' })}
                  >
                    {cta.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

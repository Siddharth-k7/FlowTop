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
        className={`${frameClasses} min-h-[440px] md:min-h-[580px] lg:min-h-[680px] flex flex-col justify-between ${textPositionClass} p-space-6 md:p-space-7 lg:p-space-8 ${
          hasMedia ? 'bg-surface-inverse shadow-lg' : 'bg-surface'
        }`}
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
              <>
                <div className={`absolute inset-0 ${overlayClass} pointer-events-none`} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/60 pointer-events-none" />
              </>
            )}
          </div>
        )}

        {/* Top Architectural Status Bar (rendered when media is present) */}
        {hasMedia && !isOverlayNone && (
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-space-3 border-b border-white/15 pb-space-4">
            <div className="flex items-center gap-space-2">
              <span className="w-2 h-2 rounded-pill bg-success-tint animate-pulse" aria-hidden="true" />
              <span className="text-caption font-semibold uppercase tracking-wider text-white/80">
                Architectural Bath Brassware
              </span>
            </div>
            <div className="text-caption text-white/80 font-light tracking-wide flex items-center gap-space-3">
              <span>Engineered in Lead-Free Brass</span>
              <span className="text-white/40" aria-hidden="true">•</span>
              <span>Bespoke Indian Craft</span>
            </div>
          </div>
        )}

        {/* Content Box: If overlay is 'none', wrap in frosted glass panel to guarantee contrast */}
        <div
          className={`relative z-10 max-w-2xl flex flex-col py-space-6 md:py-space-7 ${
            isOverlayNone && hasMedia
              ? 'bg-surface-glass backdrop-blur-md border border-white/40 rounded-lg p-space-6 md:p-space-8 text-fg shadow-xl'
              : hasMedia
              ? 'text-white'
              : 'text-fg'
          }`}
        >
          {hasMedia && !isOverlayNone && (
            <div className="inline-flex items-center gap-space-2 px-space-3 py-space-1 rounded-pill bg-white/10 backdrop-blur-md border border-white/20 text-white text-caption font-medium self-start mb-space-4">
              <span className="w-1.5 h-1.5 rounded-pill bg-purple-pale" aria-hidden="true" />
              <span>Flowtop Series 2026</span>
            </div>
          )}

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
                isOverlayNone && hasMedia ? 'text-fg-muted' : hasMedia ? 'text-white/85' : 'text-fg-muted'
              }`}
            >
              {config.subheading}
            </p>
          )}

          {/* Inline CTAs when not in full media framed mode */}
          {validCtas.length > 0 && (!hasMedia || isOverlayNone) && (
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

        {/* Bottom Docked Split Pill Action Bar & Compact Spec Badges */}
        {hasMedia && !isOverlayNone && (
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-space-4 pt-space-4">
            {validCtas.length > 0 ? (
              <div className="bg-surface-solid/95 backdrop-blur-md p-space-1 sm:p-space-2 rounded-pill shadow-lg inline-flex flex-wrap items-center gap-space-2 border border-white/60 self-start">
                {validCtas.map((cta, idx) => {
                  const isPrimary = idx === 0 && cta.style !== 'secondary' && cta.style !== 'ghost';
                  return isPrimary ? (
                    <a
                      key={idx}
                      href={cta.safeUrl}
                      className="inline-flex items-center gap-space-2 px-space-5 sm:px-space-6 py-space-3 rounded-pill bg-surface-inverse text-on-surface-inverse text-caption sm:text-small font-medium hover:bg-primary transition-colors group shadow-sm focus-ring min-h-touch"
                    >
                      <span>{cta.label}</span>
                      <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                        →
                      </span>
                    </a>
                  ) : (
                    <a
                      key={idx}
                      href={cta.safeUrl}
                      className="px-space-4 sm:px-space-5 py-space-3 rounded-pill text-fg hover:text-primary text-caption sm:text-small font-medium transition-colors inline-flex items-center focus-ring min-h-touch"
                    >
                      {cta.label}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-space-5 bg-surface-inverse/60 backdrop-blur-md border border-white/15 px-space-5 py-space-3 rounded-md text-white self-start sm:self-auto">
              <div className="flex flex-col text-left">
                <span className="text-caption uppercase tracking-widest text-white/70 font-semibold">
                  Grade
                </span>
                <span className="text-caption sm:text-small font-semibold text-white mt-px">
                  CuZn40 Lead-Free
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" aria-hidden="true" />
              <div className="flex flex-col text-left">
                <span className="text-caption uppercase tracking-widest text-white/70 font-semibold">
                  Warranty
                </span>
                <span className="text-caption sm:text-small font-semibold text-white mt-px">
                  15-Year Structural
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

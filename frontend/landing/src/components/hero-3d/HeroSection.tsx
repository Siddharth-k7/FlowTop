import React, { useState, useEffect, useRef, Suspense } from 'react';
import { HeroConfig } from '@/types/contract';
import { Button } from '@/components/common/Button';
import { FinishSwatches } from './FinishSwatches';
import { Hero3DFallback } from './Hero3DFallback';
import { Sparkles, Sliders } from 'lucide-react';
import { HERO_3D_FLAG_KEY } from './hero-3d.config';

// Dynamic import with React.lazy: Three.js bundle is ONLY fetched if this component is mounted.
// If is3dEligible is false, this component is never mounted and ZERO Three.js code is loaded.
const Hero3DCanvasLazy = React.lazy(() => import('./Hero3DCanvas'));

interface Hero3DSectionProps {
  config: HeroConfig;
  /** Optional override for feature flag (e.g. testing or API settings injection) */
  enabledFlagOverride?: boolean;
}

export const HeroSection: React.FC<Hero3DSectionProps> = ({
  config,
  enabledFlagOverride,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [manualScrubActive, setManualScrubActive] = useState<boolean>(false);

  // Gating States
  const [isFlagEnabled, setIsFlagEnabled] = useState<boolean>(false);
  const [isClientCapable, setIsClientCapable] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 1. Evaluate Feature Flag & Client Capabilities on Mount
  useEffect(() => {
    setIsMounted(true);

    // A. Read Flag: Query param override (e.g. ?hero3d=true or ?hero3d=false), prop override, or local setting
    const searchParams = new URLSearchParams(window.location.search);
    const paramOverride = searchParams.get('hero3d');

    let flagValue = true; // Default feature flag value for Dev E preview
    if (paramOverride !== null) {
      flagValue = paramOverride === 'true' || paramOverride === '1';
    } else if (typeof enabledFlagOverride === 'boolean') {
      flagValue = enabledFlagOverride;
    } else {
      // Read public settings from window if injected by backend GET /settings/public
      const publicSettings = (window as any).__FLOWTOP_SETTINGS__;
      if (publicSettings && typeof publicSettings[HERO_3D_FLAG_KEY] !== 'undefined') {
        flagValue = Boolean(publicSettings[HERO_3D_FLAG_KEY]);
      }
    }
    setIsFlagEnabled(flagValue);

    // B. Check Reduced Motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionHandler);

    // C. Check Viewport Width (>= 768px required) and Device Memory (>= 4 GB)
    const checkCapability = () => {
      const isDesktopWidth = window.innerWidth >= 768;

      // Device memory check (if supported by browser, e.g. Chrome/Android)
      const nav = navigator as any;
      const hasSufficientMemory =
        typeof nav.deviceMemory === 'undefined' || nav.deviceMemory >= 4;

      setIsClientCapable(isDesktopWidth && hasSufficientMemory);
    };

    checkCapability();
    window.addEventListener('resize', checkCapability);

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      window.removeEventListener('resize', checkCapability);
    };
  }, [enabledFlagOverride]);

  // 2. Scroll Progress Calculation for 3D Camera Lerp (Phase E.4)
  useEffect(() => {
    if (manualScrubActive || prefersReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const totalScrollableDistance = rect.height - window.innerHeight;

            if (totalScrollableDistance > 0) {
              const currentOffset = -rect.top;
              const normalized = Math.min(
                1,
                Math.max(0, currentOffset / totalScrollableDistance)
              );
              setScrollProgress(normalized);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [manualScrubActive, prefersReducedMotion]);

  // Strict Evaluation: 3D canvas is ONLY mounted if:
  // - Flag is ON
  // - Viewport >= 768px (NOT mobile)
  // - Device memory >= 4 GB
  // - prefers-reduced-motion is FALSE
  const is3dEligible =
    isMounted && isFlagEnabled && isClientCapable && !prefersReducedMotion;

  return (
    <section
      id="showroom"
      ref={containerRef}
      className="relative w-full bg-surface-white overflow-clip"
      style={{ height: prefersReducedMotion ? 'auto' : '180vh' }}
      aria-label="Flowtop Architectural 3D Showroom"
    >
      {/* Ambient Architectural Lighting Backdrop */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-white to-[#FAF8FC]" />
        {/* Soft Lavender Radial Glow */}
        <div
          className="absolute -top-[5%] right-0 w-[420px] sm:w-[580px] lg:w-[720px] h-[420px] sm:h-[580px] lg:h-[720px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(244, 238, 250, 0.90) 0%, rgba(234, 222, 246, 0.40) 45%, rgba(255, 255, 255, 0) 72%)',
          }}
        />
        {/* Text Protection Gradient */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none" />
      </div>

      {/* Sticky Stage Viewport: Strictly confined to hero section */}
      <div
        className={`${
          prefersReducedMotion ? 'relative min-h-[85vh]' : 'sticky top-0 h-screen max-h-screen'
        } w-full overflow-hidden flex flex-col justify-between pt-20 sm:pt-22 md:pt-24 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10`}
      >
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 my-auto">
          {/* Left Column: Real DOM Elements OUTSIDE the canvas for SEO & Accessibility */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-4 lg:space-y-6 z-10 max-w-xl">
            <div className="space-y-3">
              {/* Feature Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-token-full bg-purple-pale/80 border border-purple-light/25 text-purple-deep text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-purple-deep" />
                <span>
                  {is3dEligible ? 'Interactive 3D Experience' : 'Architectural Precision Series'}
                </span>
              </div>

              {/* Real <h1> Heading */}
              <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.15]">
                {config.headline}
              </h1>

              {/* Subheading */}
              {config.subheading && (
                <p className="text-xs sm:text-sm lg:text-base text-ink-muted leading-relaxed max-w-lg">
                  {config.subheading}
                </p>
              )}

              {/* Real CTA Buttons */}
              {config.ctas && config.ctas.length > 0 && (
                <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3">
                  {config.ctas.map((cta, i) => (
                    <Button
                      key={i}
                      asLink
                      href={cta.href}
                      variant={cta.style === 'secondary' ? 'secondary' : 'primary'}
                      size="md"
                    >
                      {cta.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Finish Swatches: Real Buttons Outside Canvas */}
            <div className="pt-2">
              <FinishSwatches />
            </div>
          </div>

          {/* Right Column: 3D Canvas OR Mobile / Zero-JS Fallback */}
          <div className="md:col-span-7 relative flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[500px]">
            <div className="w-full h-[300px] sm:h-[380px] md:h-[440px] lg:h-[500px] max-w-[360px] sm:max-w-[440px] md:max-w-[500px] lg:max-w-[560px] flex items-center justify-center">
              {is3dEligible ? (
                <Suspense
                  fallback={
                    <Hero3DFallback reason="loading" />
                  }
                >
                  <Hero3DCanvasLazy scrollProgress={scrollProgress} />
                </Suspense>
              ) : (
                <Hero3DFallback
                  reason={
                    !isFlagEnabled
                      ? 'flag-off'
                      : !isClientCapable
                      ? 'mobile'
                      : 'reduced-motion'
                  }
                />
              )}
            </div>

            {/* Optional Interactive Camera Scrubber for 3D Stage */}
            {is3dEligible && (
              <div className="mt-2 glass-panel px-4 py-1.5 rounded-token-md border border-border-subtle shadow-subtle flex items-center gap-3">
                <Sliders className="w-3.5 h-3.5 text-ink" />
                <span className="text-[11px] font-mono font-medium text-ink-subtle">
                  {Math.round(scrollProgress * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scrollProgress}
                  onChange={(e) => {
                    setManualScrubActive(true);
                    setScrollProgress(parseFloat(e.target.value));
                  }}
                  onMouseUp={() => setManualScrubActive(false)}
                  onTouchEnd={() => setManualScrubActive(false)}
                  className="w-24 sm:w-32 accent-ink cursor-pointer"
                  aria-label="3D orbit camera scrubber"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

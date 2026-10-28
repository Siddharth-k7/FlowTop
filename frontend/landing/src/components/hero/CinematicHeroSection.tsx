import React, { useState, useRef } from 'react';
import { HeroConfig } from '@/types/contract';
import { Button } from '@/components/common/Button';
import {
  Sparkles,
  Droplets,
  Layers,
  ShieldCheck,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type HeroFinishId = 'brushed-gold' | 'chrome' | 'matte-black' | 'rose-gold';

interface HeroFinish {
  id: HeroFinishId;
  name: string;
  tagline: string;
  material: string;
  image: string;
  swatchHex: string;
  borderHex: string;
  accentGlow: string;
}

const HERO_FINISHES: HeroFinish[] = [
  {
    id: 'brushed-gold',
    name: 'Brushed Gold',
    tagline: 'Warm Architectural PVD Satin',
    material: 'Physical Vapor Deposition over solid forged brass',
    image: '/flowtop/hero-cinematic.jpg',
    swatchHex: '#D4AF37',
    borderHex: '#B59428',
    accentGlow: 'rgba(212, 175, 55, 0.45)',
  },
  {
    id: 'chrome',
    name: 'Mirror Chrome',
    tagline: 'Triple-Plated High Luster Polish',
    material: 'Multi-layer electroplated specular nickel-chrome',
    image: '/flowtop/hero-chrome.jpg',
    swatchHex: '#CBD5E1',
    borderHex: '#94A3B8',
    accentGlow: 'rgba(203, 213, 225, 0.55)',
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    tagline: 'Deep Velvet Electro-Deposition',
    material: 'Anti-fingerprint ultra-matte architectural powder coat',
    image: '/flowtop/hero-black.jpg',
    swatchHex: '#1A181C',
    borderHex: '#383340',
    accentGlow: 'rgba(91, 42, 134, 0.40)',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    tagline: 'Lustrous Copper-Bronze Undertone',
    material: 'Refined warm PVD bronze alloy with polished micro-radiance',
    image: '/flowtop/hero-rose.jpg',
    swatchHex: '#C58F84',
    borderHex: '#A66D63',
    accentGlow: 'rgba(197, 143, 132, 0.45)',
  },
];

interface CinematicHeroProps {
  config: HeroConfig;
}

export const CinematicHeroSection: React.FC<CinematicHeroProps> = ({ config }) => {
  const [activeFinishId, setActiveFinishId] = useState<HeroFinishId>('brushed-gold');
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [isWaterActive, setIsWaterActive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeFinish =
    HERO_FINISHES.find((f) => f.id === activeFinishId) || HERO_FINISHES[0];

  // Subtle Mouse Parallax Effect (Smooth 3D translation)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 18, y: y * 14 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <section
      id="showroom"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[92vh] sm:min-h-screen bg-ink overflow-hidden flex flex-col justify-between selection:bg-purple-pale selection:text-purple-deep"
      aria-label="Flowtop Architectural Cinematic Showroom"
    >
      {/* 1. Cinematic Background Stage with Multi-Finish Crossfade */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {HERO_FINISHES.map((finish) => {
          const isActive = finish.id === activeFinishId;
          return (
            <div
              key={finish.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={finish.image}
                alt={`Flowtop Suite in ${finish.name}`}
                className="w-full h-full object-cover object-center scale-105 transition-transform duration-[1200ms] ease-out"
                style={{
                  transform: `scale(1.05) translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
                }}
              />
            </div>
          );
        })}

        {/* Cinematic Water Caustics Shimmer Light Layer */}
        {isWaterActive && (
          <div
            className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none animate-pulse"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 70% 65%, rgba(255,255,255,0.7) 0%, rgba(155,111,196,0.3) 40%, transparent 75%)',
              animationDuration: '6s',
            }}
            aria-hidden="true"
          />
        )}

        {/* Ambient Architectural Vignette & Contrast Gradients */}
        {/* Left Side Reading Gradient for Razor-Sharp Text Contrast */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-ink/90 via-ink/65 to-transparent z-20 pointer-events-none" />

        {/* Top Header Transition */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-ink/75 via-ink/30 to-transparent z-20 pointer-events-none" />

        {/* Bottom Section Blend into Page */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface-white to-transparent z-20 pointer-events-none" />
      </div>

      {/* 2. Main Hero Content Viewport */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-12 flex-1 flex flex-col justify-between">
        {/* Top Row: Floating Atmosphere Badge & Ambient Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-token-full bg-white/15 backdrop-blur-xl border border-white/30 text-white text-xs font-semibold tracking-wider uppercase shadow-floating animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-purple-pale" />
            <span>Architectural Masterpiece • Signature Range</span>
          </div>

          {/* Quick Ambient Toggle Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-token-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs">
            <button
              onClick={() => setIsWaterActive(!isWaterActive)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-token-xs transition-colors ${
                isWaterActive ? 'text-purple-pale font-medium' : 'text-white/60'
              }`}
              title="Toggle laminar water flow visualization"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-300" />
              <span>{isWaterActive ? 'Water Flowing' : 'Flow Paused'}</span>
            </button>
            <span className="w-px h-3 bg-white/20" />
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/70 hover:text-white transition-colors"
              title={isMuted ? 'Atmospheric sound muted' : 'Atmospheric sound active'}
              aria-label="Sound toggle"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-purple-pale" />}
            </button>
          </div>
        </div>

        {/* Center Grid: Left Text Showcase + Right Interactive Feature Glass Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8">
          {/* Left Column: Brand Statement & Finish Swatches */}
          <div className="lg:col-span-7 space-y-6 max-w-2xl text-white">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.10] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
                {config.headline}
              </h1>

              {config.subheading && (
                <p className="text-sm sm:text-base lg:text-lg text-purple-pale/95 leading-relaxed max-w-xl font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.50)]">
                  {config.subheading}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            {config.ctas && config.ctas.length > 0 && (
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                {config.ctas.map((cta, i) => (
                  <Button
                    key={i}
                    asLink
                    href={cta.href}
                    variant={cta.style === 'secondary' ? 'secondary' : 'primary'}
                    size="lg"
                    className={
                      cta.style === 'secondary'
                        ? 'bg-white/20 backdrop-blur-md text-white border-white/40 hover:bg-white/30'
                        : 'shadow-floating'
                    }
                  >
                    {cta.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Interactive Finish Selector Bar (Smooth Room Transformation) */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-purple-pale/80">
                  Select Architectural Finish:
                </span>
                <span className="h-px flex-1 bg-white/20" />
              </div>

              {/* Swatches Row */}
              <div
                role="group"
                aria-label="Finish Showroom Switcher"
                className="inline-flex items-center gap-3 p-2 rounded-token-full bg-black/40 backdrop-blur-xl border border-white/25 shadow-floating"
              >
                {HERO_FINISHES.map((finish) => {
                  const isSelected = activeFinishId === finish.id;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => setActiveFinishId(finish.id)}
                      aria-pressed={isSelected}
                      aria-label={`Show suite in ${finish.name}`}
                      className={`relative group w-9 h-9 sm:w-10 sm:h-10 rounded-token-full flex items-center justify-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-elevated'
                          : 'opacity-75 hover:opacity-100 hover:scale-105 ring-1 ring-white/30'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-token-full shadow-inner flex items-center justify-center transition-transform"
                        style={{
                          backgroundColor: finish.swatchHex,
                          border: `1.5px solid ${finish.borderHex}`,
                        }}
                      >
                        {isSelected && (
                          <Check
                            className={`w-4 h-4 ${
                              finish.id === 'matte-black' ? 'text-white' : 'text-ink'
                            }`}
                            strokeWidth={2.5}
                          />
                        )}
                      </span>

                      {/* Tooltip */}
                      <span className="sr-only sm:not-sr-only pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-2.5 py-1 rounded-token-sm bg-ink/90 backdrop-blur-md text-white text-[10px] font-medium tracking-tight whitespace-nowrap z-30 border border-white/20 shadow-floating">
                        {finish.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Finish Subtitle */}
              <div className="flex items-center gap-2 text-xs text-purple-pale">
                <span
                  className="w-2 h-2 rounded-token-full animate-ping"
                  style={{ backgroundColor: activeFinish.swatchHex }}
                />
                <span className="font-semibold text-white">{activeFinish.name}</span>
                <span className="text-white/70">— {activeFinish.tagline}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Interactive Architectural Spec Glass Card */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end">
            <div className="w-full max-w-md rounded-token-xl overflow-hidden backdrop-blur-2xl bg-white/15 border border-white/35 p-6 sm:p-7 text-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55),0_0_80px_rgba(155,111,196,0.35),inset_0_1.5px_2px_0_rgba(255,255,255,0.7)] transition-all duration-500 hover:-translate-y-2 hover:border-white/60 hover:shadow-[0_36px_84px_-16px_rgba(0,0,0,0.70),0_0_100px_rgba(155,111,196,0.55)]">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-pale font-semibold">
                    Architectural Spec
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/70">Opel Monobloc</span>
              </div>

              {/* Interactive Specification Hotspots */}
              <div className="py-4 space-y-3">
                {[
                  {
                    id: 1,
                    title: 'Forged DR Brass Core',
                    subtitle: 'Reassuring tactile weight & zero porosity',
                    detail: 'Precision-machined from solid high-density brass alloy.',
                  },
                  {
                    id: 2,
                    title: 'Ceramic Disc Micromotion',
                    subtitle: 'Frictionless quarter-turn fluid control',
                    detail: 'High-temperature ceramic disc core tested to 500,000 cycles.',
                  },
                  {
                    id: 3,
                    title: 'PVD Vapor Metallurgy',
                    subtitle: activeFinish.tagline,
                    detail: activeFinish.material,
                  },
                ].map((spec) => {
                  const isExpanded = activeHotspot === spec.id;
                  return (
                    <div
                      key={spec.id}
                      onClick={() => setActiveHotspot(isExpanded ? null : spec.id)}
                      className={`p-3 rounded-token-md border transition-all duration-300 cursor-pointer ${
                        isExpanded
                          ? 'bg-white/25 border-white/50 shadow-inner'
                          : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/35'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isExpanded ? 'bg-emerald-300' : 'bg-purple-light'
                            }`}
                          />
                          <p className="text-xs font-bold text-white tracking-tight">
                            {spec.title}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-purple-pale/80">
                          {isExpanded ? 'Hide' : 'Inspect'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80 mt-1 pl-4.5 leading-snug">
                        {spec.subtitle}
                      </p>
                      {isExpanded && (
                        <p className="text-[11px] text-purple-pale mt-2 pl-4.5 pt-2 border-t border-white/15 leading-relaxed font-mono">
                          {spec.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-purple-pale">
                <span>Warranty Coverage</span>
                <span className="font-bold text-white">10 Years Solid Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges Console - Unified Architectural Frosted Glass Dock */}
        <div className="pt-6 sm:pt-8 w-full">
          <div className="w-full rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(155,111,196,0.18)] p-2.5 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Feature 1 */}
            <div className="group flex items-center gap-3.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-light/50 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-deep/70 border border-purple-light/40 flex items-center justify-center text-purple-pale shrink-0 group-hover:scale-105 group-hover:border-purple-light shadow-[0_2px_10px_rgba(91,42,134,0.45)] transition-transform duration-300">
                <Layers className="w-4 h-4 text-purple-pale" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-purple-pale transition-colors truncate">
                  100% Solid Brass
                </p>
                <p className="text-[11px] font-medium text-purple-pale/90 truncate">
                  Zero plastic core architecture
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex items-center gap-3.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-light/50 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-deep/70 border border-purple-light/40 flex items-center justify-center text-purple-pale shrink-0 group-hover:scale-105 group-hover:border-purple-light shadow-[0_2px_10px_rgba(91,42,134,0.45)] transition-transform duration-300">
                <Droplets className="w-4 h-4 text-purple-pale" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-purple-pale transition-colors truncate">
                  Laminar Comfort Flow
                </p>
                <p className="text-[11px] font-medium text-purple-pale/90 truncate">
                  Anti-splash comfort aerator
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group flex items-center gap-3.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-light/50 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-deep/70 border border-purple-light/40 flex items-center justify-center text-purple-pale shrink-0 group-hover:scale-105 group-hover:border-purple-light shadow-[0_2px_10px_rgba(91,42,134,0.45)] transition-transform duration-300">
                <Sparkles className="w-4 h-4 text-purple-pale" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-purple-pale transition-colors truncate">
                  4 Architectural Finishes
                </p>
                <p className="text-[11px] font-medium text-purple-pale/90 truncate">
                  PVD vacuum molecular metallurgy
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group flex items-center gap-3.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-light/50 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-deep/70 border border-purple-light/40 flex items-center justify-center text-purple-pale shrink-0 group-hover:scale-105 group-hover:border-purple-light shadow-[0_2px_10px_rgba(91,42,134,0.45)] transition-transform duration-300">
                <ShieldCheck className="w-4 h-4 text-purple-pale" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-purple-pale transition-colors truncate">
                  Architectural Grade
                </p>
                <p className="text-[11px] font-medium text-purple-pale/90 truncate">
                  Tested to 500k cycles • 10Y warranty
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

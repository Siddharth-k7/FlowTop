import React, { useRef, useState, useEffect } from 'react';
import { HeroConfig } from '@/types/contract';
import { HERO_CHAPTERS } from './hero-narrative.config';
import { Button } from '@/components/common/Button';
import { Sparkles, Play, Pause, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  config: HeroConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // 1. Detect user reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsVideoPlaying(false);
    }

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        setIsVideoPlaying(false);
        videoRef.current?.pause();
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 2. Ensure video plays smoothly on mount and stays active
  useEffect(() => {
    if (videoRef.current && !prefersReducedMotion) {
      videoRef.current.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  // 3. Play / Pause toggle for background video
  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  const activeChapter = HERO_CHAPTERS[activeChapterIndex] || HERO_CHAPTERS[0];

  return (
    <section
      id="showroom"
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#ECE8F2]"
      aria-label="Flowtop Signature Architectural Faucet Exhibition"
    >
      {/* 1. Entire HeroSection Animated Background Video (Scrolls do NOT affect video) */}
      <div
        className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden select-none z-0"
        aria-hidden="true"
      >
        {/* Full-Bleed Continuous Looping Video across ENTIRE HeroSection background */}
        <video
          ref={videoRef}
          src="/flowtop/hero-transformation.mp4"
          autoPlay={!prefersReducedMotion}
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center transition-opacity duration-700"
          aria-label="Flowtop faucet architectural background animation"
        />

        {/* Sophisticated Architectural Ambient Overlays tuned to the studio lighting */}
        {/* Gentle Left Editorial Reading Gradient: Softened so video shines through completely across the entire section */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-[50%] bg-gradient-to-r from-[#ECE8F2]/75 via-[#ECE8F2]/40 to-transparent pointer-events-none" />

        {/* Subtle Top Header Feathering for Seamless Navbar Integration */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#ECE8F2]/60 via-[#ECE8F2]/20 to-transparent pointer-events-none" />

        {/* Bottom Section Soft Feathering into Catalogue */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
      </div>

      {/* 2. Top Floating Brand Metadata Strip */}
      <div className="relative z-10 w-full max-w-7xl mx-auto pt-24 sm:pt-28 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-purple-light/40 text-purple-deep text-[11px] sm:text-xs font-semibold tracking-wider uppercase shadow-subtle backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-deep" />
          <span>Flowtop Exhibition • Opel Monobloc</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-ink-subtle">
          <a
            href="#catalogue"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-ink-subtle hover:text-purple-deep transition-colors"
          >
            <span>Explore Collection</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-purple-deep" />
          </a>

          <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm border border-white/60">
            <span>CH. {activeChapter.index} / 05</span>
            <span className="w-1 h-1 rounded-full bg-purple-light" />
            <span className="text-purple-deep font-semibold">{activeChapter.label}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Exhibition Stage: Left Editorial Narrative (Floats over Animated Background) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex-1 flex items-center py-8 sm:py-12">
        <div className="w-full max-w-xl flex flex-col justify-center space-y-4 sm:space-y-6">
          {/* Dynamic Eyebrow Tag */}
          <div className="space-y-2">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-purple-deep font-semibold transition-all duration-300 block">
              {activeChapter.eyebrow}
            </span>

            {/* Expressive Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-ink tracking-tight leading-[1.12] transition-all duration-300">
              {activeChapter.headline}
            </h1>

            {/* Editorial Narrative */}
            <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-normal transition-all duration-300 pt-1">
              {activeChapter.narrative}
            </p>
          </div>

          {/* Architectural Technical Detail Micro-Tags */}
          <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-border-subtle/80 transition-all duration-300 bg-white/65 backdrop-blur-md rounded-sm px-3.5 shadow-subtle">
            {activeChapter.attributes.map((attr, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle block">
                  {attr.label}
                </span>
                <span className="text-xs font-semibold text-ink font-display block truncate">
                  {attr.value}
                </span>
              </div>
            ))}
          </div>

          {/* Primary Action Buttons (Capsule Geometry) */}
          {config.ctas && config.ctas.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
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
      </div>

      {/* 4. Bottom Architectural Story Timeline & Video Controls */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Story Chapter Pills */}
        <div
          role="navigation"
          aria-label="Story Chapter Timeline"
          className="glass-panel px-4 py-2 rounded-full border border-white/80 shadow-subtle flex items-center gap-2 sm:gap-4 overflow-x-auto max-w-full scrollbar-none bg-white/80 backdrop-blur-md"
        >
          {HERO_CHAPTERS.map((ch, idx) => {
            const isActive = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChapterIndex(idx)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-left transition-all ${
                  isActive
                    ? 'bg-purple-deep text-white shadow-subtle'
                    : 'text-ink-subtle hover:text-ink hover:bg-white/60'
                }`}
                aria-label={`View chapter ${ch.index}: ${ch.label}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isActive ? 'text-purple-light' : 'text-purple-deep'
                  }`}
                >
                  {ch.index}
                </span>
                <span className="text-xs font-semibold tracking-wide hidden md:inline-block">
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Video Play / Pause Toggle Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleVideoPlayback}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-ink border border-white/80 hover:border-purple-deep/40 hover:text-purple-deep active:scale-95 transition-all text-xs font-semibold shadow-subtle"
            aria-label={isVideoPlaying ? 'Pause background animation' : 'Play background animation'}
          >
            {isVideoPlaying ? (
              <Pause className="w-3.5 h-3.5 text-purple-deep fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 text-purple-deep fill-current ml-0.5" />
            )}
            <span className="hidden sm:inline">
              {isVideoPlaying ? 'Pause Video' : 'Play Video'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

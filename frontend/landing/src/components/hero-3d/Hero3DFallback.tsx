import React from 'react';
import { useFinish } from './useFinish';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface Hero3DFallbackProps {
  reason?: 'flag-off' | 'mobile' | 'low-memory' | 'reduced-motion' | 'loading';
}

export const Hero3DFallback: React.FC<Hero3DFallbackProps> = ({ reason = 'mobile' }) => {
  const { activeFinish } = useFinish();

  // Pick visual gradient corresponding to active finish
  const getFinishAura = () => {
    switch (activeFinish.id) {
      case 'brushed-gold':
        return 'from-[#D4AF37]/20 via-[#FDF8E8]/60 to-transparent';
      case 'matte-black':
        return 'from-[#1A181C]/15 via-[#F2EEF5]/40 to-transparent';
      case 'rose-gold':
        return 'from-[#C58F84]/25 via-[#FDF3F1]/60 to-transparent';
      case 'chrome':
      default:
        return 'from-purple-light/20 via-purple-pale/40 to-transparent';
    }
  };

  return (
    <div
      data-fallback-reason={reason}
      className="relative w-full h-full min-h-[260px] sm:min-h-[340px] md:min-h-[420px] flex flex-col items-center justify-center p-4 rounded-token-xl overflow-hidden select-none"
      aria-label={`Flowtop Architectural Tap — Shown in ${activeFinish.name}`}
    >
      {/* Ambient Radial Radiance Tinted to Active Finish */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${getFinishAura()} rounded-token-xl transition-all duration-500 pointer-events-none`}
        aria-hidden="true"
      />

      {/* Decorative Vector Precision Graphic of Flowtop Tap */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] aspect-square flex items-center justify-center">
        {/* Soft Contact Ground Shadow */}
        <div
          className="absolute bottom-6 w-44 sm:w-56 h-6 rounded-[100%] bg-ink/10 blur-md pointer-events-none"
          aria-hidden="true"
        />

        {/* High-Fidelity SVG Monobloc Tap Graphic */}
        <svg
          viewBox="0 0 400 480"
          className="w-full h-full drop-shadow-elevated transition-transform duration-500 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Dynamic Finish Metallic Gradient */}
            <linearGradient id="bodyFinishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {activeFinish.id === 'brushed-gold' && (
                <>
                  <stop offset="0%" stopColor="#DFBF5B" />
                  <stop offset="35%" stopColor="#FFF2B8" />
                  <stop offset="70%" stopColor="#C49B24" />
                  <stop offset="100%" stopColor="#8C6A0C" />
                </>
              )}
              {activeFinish.id === 'matte-black' && (
                <>
                  <stop offset="0%" stopColor="#2E2A34" />
                  <stop offset="45%" stopColor="#16121C" />
                  <stop offset="85%" stopColor="#231F2A" />
                  <stop offset="100%" stopColor="#0B090F" />
                </>
              )}
              {activeFinish.id === 'rose-gold' && (
                <>
                  <stop offset="0%" stopColor="#D9978D" />
                  <stop offset="40%" stopColor="#FBE3DE" />
                  <stop offset="75%" stopColor="#B3695F" />
                  <stop offset="100%" stopColor="#87443C" />
                </>
              )}
              {activeFinish.id === 'chrome' && (
                <>
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="30%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#94A3B8" />
                  <stop offset="85%" stopColor="#E2E8F0" />
                  <stop offset="100%" stopColor="#64748B" />
                </>
              )}
            </linearGradient>

            <linearGradient id="specularHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="waterFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Solid Cylindrical Escutcheon Base */}
          <ellipse cx="200" cy="420" rx="65" ry="16" fill="url(#bodyFinishGrad)" />
          <ellipse cx="200" cy="415" rx="55" ry="12" fill="#FFFFFF" fillOpacity="0.25" />

          {/* Main Monobloc Vertical Cylinder Body */}
          <path
            d="M170 210 L230 210 L234 416 C234 418 200 422 166 416 Z"
            fill="url(#bodyFinishGrad)"
          />
          <path
            d="M178 215 L184 215 L184 414 L178 414 Z"
            fill="url(#specularHighlight)"
            opacity="0.6"
          />

          {/* High-Arc Swept Spout */}
          <path
            d="M175 220 C175 140 215 90 290 90 C340 90 350 130 350 180 L326 180 C326 142 320 114 290 114 C236 114 200 150 200 220 Z"
            fill="url(#bodyFinishGrad)"
          />

          {/* Aerator Nozzle */}
          <rect
            x="326"
            y="180"
            width="24"
            height="14"
            rx="3"
            fill="url(#bodyFinishGrad)"
            stroke="#16121C"
            strokeOpacity="0.1"
          />

          {/* Translucent Water Arc Stream */}
          <path
            d="M334 194 C334 230 330 270 320 320 C310 370 295 400 285 430 L293 430 C303 400 318 370 328 320 C338 270 342 230 342 194 Z"
            fill="url(#waterFlowGrad)"
          />

          {/* Top Lever Handle */}
          <rect
            x="185"
            y="170"
            width="30"
            height="38"
            rx="4"
            fill="url(#bodyFinishGrad)"
          />
          {/* Handle Lever Flat Paddle */}
          <path
            d="M170 174 L275 156 C280 155 284 158 284 163 C284 167 280 170 275 171 L170 186 Z"
            fill="url(#bodyFinishGrad)"
          />
          <path
            d="M185 174 L270 159"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>

        {/* Feature/Context Badge */}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-token-full bg-surface-white/90 backdrop-blur-glass border border-border-subtle shadow-subtle flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted">
          <Sparkles className="w-3 h-3 text-purple-deep" />
          <span>{activeFinish.name}</span>
        </div>
      </div>

      {/* Lightweight Specs Pill (Zero arithmetic, purely descriptive) */}
      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-ink-subtle bg-white/70 backdrop-blur-glass px-3 py-1 rounded-token-full border border-border-subtle">
        <ShieldCheck className="w-3.5 h-3.5 text-accent-success" />
        <span>Solid DR Brass Core • Ceramic Disc Control</span>
      </div>
    </div>
  );
};

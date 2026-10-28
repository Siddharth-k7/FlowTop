import React, { useState, useRef } from 'react';
import { CtaConfig } from '@/types/contract';
import { getLayoutClasses } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface CtaSectionProps {
  config: CtaConfig;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ config }) => {
  const layout = getLayoutClasses(config.layout);
  const [submitted, setSubmitted] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmailInput('');
    }, 5000);
  };

  return (
    <section id="contact" ref={sectionRef} className={`${layout.section} scroll-mt-24 relative overflow-hidden`}>
      {/* Ambient background depth orbs to accentuate the frosted glass refraction */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <div
          className={`absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
            isHovered ? 'bg-purple-light/45 scale-125' : 'bg-purple-light/25 scale-100'
          }`}
        />
        <div
          className={`absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full blur-2xl transition-all duration-700 ${
            isHovered ? 'bg-purple-pale/35 scale-125' : 'bg-purple-pale/20 scale-100'
          }`}
        />
      </div>

      <div className={layout.container}>
        {/* Outer Glow Wrapper to project the blooming purple edge illumination */}
        <div className="relative group">
          {/* Glowing Purple Perimeter Aura — Intensifies dramatically on interaction */}
          <div
            className={`absolute -inset-[3px] rounded-token-xl transition-all duration-500 pointer-events-none ${
              isHovered
                ? 'opacity-100 blur-xl scale-[1.01]'
                : 'opacity-35 blur-md scale-100'
            }`}
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(155,111,196,0.95) 30%, rgba(244,238,250,0.85) 60%, rgba(175,120,225,0.95) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Interactive Frosted Light Purple Glass Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              setMousePos(null);
            }}
            className={`relative rounded-token-xl overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-white/95 via-[#F6F2FB]/90 to-white/88 p-8 sm:p-14 lg:p-20 text-ink border transition-all duration-500 ease-out ${
              isHovered
                ? '-translate-y-2.5 scale-[1.008] border-white/95 shadow-[0_36px_84px_-16px_rgba(22,18,28,0.40),0_0_110px_25px_rgba(155,111,196,0.65),inset_0_2px_3px_0_rgba(255,255,255,1),inset_0_-1px_1.5px_0_rgba(216,210,226,0.5)]'
                : 'border-white/80 shadow-[0_24px_64px_-12px_rgba(22,18,28,0.30),0_0_75px_rgba(155,111,196,0.35),inset_0_1.5px_2px_0_rgba(255,255,255,0.95),inset_0_-1px_1px_0_rgba(216,210,226,0.4)]'
            } reveal-base ${isVisible ? 'reveal-visible' : ''}`}
          >
            {/* Dynamic Cursor Spotlight that tracks across the glass */}
            {mousePos && isHovered && (
              <div
                className="pointer-events-none absolute -inset-px rounded-token-xl transition-opacity duration-300 z-10"
                style={{
                  background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.45), rgba(155, 111, 196, 0.12) 45%, transparent 80%)`,
                }}
                aria-hidden="true"
              />
            )}

            {/* Internal Prismatic Glass Sheen & Diagonal Refraction Beam */}
            <div
              className={`absolute -top-[60%] -left-[30%] w-[160%] h-[220%] bg-gradient-to-br from-white/30 via-transparent to-transparent rotate-12 pointer-events-none transition-transform duration-700 ${
                isHovered ? 'translate-x-8 translate-y-4' : 'translate-x-0 translate-y-0'
              }`}
              aria-hidden="true"
            />
            {/* Corner Light Pools */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(234, 222, 246, 0.70) 0%, rgba(255, 255, 255, 0.25) 35%, transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at bottom left, rgba(216, 195, 238, 0.50) 0%, rgba(244, 238, 250, 0.30) 40%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Real Content Layer — 100% Crisp High-Contrast Typography & Controls */}
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              {/* Architectural Frosted Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-token-full bg-purple-pale border border-purple-light/40 text-purple-deep text-xs font-semibold tracking-wider uppercase shadow-subtle">
                <Mail className="w-3.5 h-3.5 text-purple-deep" />
                <span>Architects & Project Enquiries</span>
              </div>

              {/* Headline with Substantial Typography & Crisp Ink Contrast */}
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight text-ink drop-shadow-sm">
                {config.heading}
              </h2>

              {/* Subline with Crystal-Clear Legibility */}
              <p className="text-ink-muted text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
                {config.body}
              </p>

              {/* Consultation Request Form */}
              <form onSubmit={handleEnquiry} className="pt-2 max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="email"
                    id="enquiry-email"
                    name="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your professional email"
                    required
                    aria-label="Professional email for project enquiry"
                    className="flex-1 px-4 py-3 rounded-token-md bg-white border border-border-medium text-ink placeholder:text-ink-subtle text-sm focus:outline-none focus:ring-2 focus:ring-purple-deep/20 focus:border-purple-deep transition-all shadow-subtle"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="shadow-floating whitespace-nowrap"
                  >
                    Request Contact
                  </Button>
                </div>

                {submitted && (
                  <div className="mt-3.5 p-3 rounded-token-sm bg-purple-pale/90 border border-purple-light/40 flex items-start gap-2 text-xs text-ink font-medium animate-in fade-in text-left shadow-subtle">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Demonstration Notice:</strong> Enquiry simulated for prototype review. In production, this will connect directly to the Flowtop architectural specification desk.
                    </span>
                  </div>
                )}
              </form>

              {/* Bottom Architecture Credentials Strip */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-purple-light/30 text-xs max-w-lg mx-auto">
                <div>
                  <p className="font-bold text-ink text-sm">Finishes</p>
                  <span className="text-ink-muted">Sample Swatches</span>
                </div>
                <div>
                  <p className="font-bold text-ink text-sm">Consultation</p>
                  <span className="text-ink-muted">Bespoke Specifications</span>
                </div>
                <div>
                  <p className="font-bold text-ink text-sm">Projects</p>
                  <span className="text-ink-muted">Residential & Suites</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

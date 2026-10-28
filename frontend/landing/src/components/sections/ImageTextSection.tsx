import React, { useState } from 'react';
import { ImageTextConfig } from '@/types/contract';
import { getLayoutClasses } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Sparkles, ShieldCheck, Gauge, Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ImageTextSectionProps {
  config: ImageTextConfig;
}

interface MaterialDiscipline {
  id: string;
  name: string;
  icon: React.ElementType;
  headline: string;
  narrative: string;
  imageUrl: string;
  badge: string;
  spec: { label: string; value: string };
}

const DISCIPLINES: MaterialDiscipline[] = [
  {
    id: 'dr-brass',
    name: 'Solid DR Brass',
    icon: ShieldCheck,
    headline: 'High-Density Metallurgy & Acoustic Balance',
    narrative:
      'Forged from certified dezincification-resistant brass alloy. Calibrated wall thicknesses absorb hydraulic pressure spikes and acoustic vibration, delivering silent water delivery and substantial tactile permanence.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    badge: 'Metallurgy Standard',
    spec: { label: 'Alloy Composition', value: 'High-Copper DR Brass' },
  },
  {
    id: 'chrome-polish',
    name: 'Specular Chrome',
    icon: Sparkles,
    headline: 'Multi-Stage Optical Hand Polishing',
    narrative:
      'Each fitting undergoes automated contour smoothing followed by manual hand-buffing by skilled artisans. Tri-layer nickel and chromium electrodeposition produces flawless, mirror-like specular reflections.',
    imageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1200&q=80',
    badge: 'Surface Polish',
    spec: { label: 'Finish Standard', value: 'Specular Tri-Layer Deposition' },
  },
  {
    id: 'ceramic-cartridge',
    name: 'Ceramic Core',
    icon: Gauge,
    headline: 'Diamond-Hard Ceramic Flow Control',
    narrative:
      'Internal valving relies on sintered aluminum oxide ceramic discs lapped to sub-micron optical flatness. Tested across 500,000 smooth cycles for frictionless actuation and zero drip risk.',
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    badge: 'Hydraulic Core',
    spec: { label: 'Endurance Rating', value: '500,000 Frictionless Cycles' },
  },
];

export const ImageTextSection: React.FC<ImageTextSectionProps> = ({ config }) => {
  const layout = getLayoutClasses(config.layout);
  const isImageRight = config.imageSide === 'right';
  const [activeTabId, setActiveTabId] = useState<string>('dr-brass');
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  const activeDiscipline =
    DISCIPLINES.find((d) => d.id === activeTabId) || DISCIPLINES[0];

  return (
    <section id="craftsmanship" ref={sectionRef} className={`${layout.section} scroll-mt-24`}>
      <div className={layout.container}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Content Column */}
          <div
            className={`lg:col-span-6 space-y-6 reveal-base ${
              isVisible ? 'reveal-visible' : ''
            } ${isImageRight ? 'order-1' : 'order-1 lg:order-2'}`}
          >
            <div>
              <span className="text-xs uppercase font-mono tracking-widest font-semibold text-purple-deep block">
                Engineering & Craftsmanship
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-ink tracking-tight mt-1 mb-3">
                {activeDiscipline.headline}
              </h2>
              <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
                {activeDiscipline.narrative}
              </p>
            </div>

            {/* Interactive Discipline Switcher Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {DISCIPLINES.map((d) => {
                const isActive = d.id === activeTabId;
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveTabId(d.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
                      isActive
                        ? 'bg-purple-deep text-white border-purple-deep shadow-subtle'
                        : 'bg-white text-ink-muted border-border-subtle hover:border-purple-deep/40 hover:text-ink'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{d.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Architectural Design Values — Interactive Frosted Glass Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-border-subtle">
              <div className="glass-card-interactive p-3.5 rounded-token-md flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-pale flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-purple-deep" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono font-bold tracking-wider text-ink-subtle">
                    {activeDiscipline.spec.label}
                  </h4>
                  <p className="text-xs font-semibold text-ink font-display">
                    {activeDiscipline.spec.value}
                  </p>
                </div>
              </div>

              <div className="glass-card-interactive p-3.5 rounded-token-md flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-pale flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-purple-deep" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono font-bold tracking-wider text-ink-subtle">
                    Inspection Level
                  </h4>
                  <p className="text-xs font-semibold text-ink font-display">
                    100% Optical Laser Gauge Verified
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            {config.cta && (
              <div className="pt-1">
                <Button asLink href={config.cta.href} variant="secondary" size="md">
                  {config.cta.label}
                </Button>
              </div>
            )}
          </div>

          {/* Media Column: Studio Inspection Macro View */}
          <div
            className={`lg:col-span-6 reveal-base ${
              isVisible ? 'reveal-visible delay-200' : ''
            } ${isImageRight ? 'order-2' : 'order-2 lg:order-1'}`}
          >
            <div className="relative rounded-token-lg overflow-hidden shadow-elevated border border-border-subtle bg-purple-pale/20 aspect-[4/3] group">
              <img
                key={activeDiscipline.imageUrl}
                src={activeDiscipline.imageUrl}
                alt={activeDiscipline.headline}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 glass-panel p-3 rounded-token-sm text-xs text-ink-muted flex items-center justify-between shadow-glass pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-deep animate-ping" />
                  <span className="font-semibold text-ink">{activeDiscipline.badge}</span>
                </div>
                <span className="font-mono text-[10px] text-purple-deep font-bold">Flowtop Metallurgy Studio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


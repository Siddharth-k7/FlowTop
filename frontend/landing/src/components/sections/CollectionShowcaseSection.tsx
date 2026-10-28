import React, { useState } from 'react';
import { CollectionShowcaseConfig } from '@/types/contract';
import { mockOpelCollection } from '@/mocks/homepageData';
import { getLayoutClasses } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Layers, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface CollectionShowcaseSectionProps {
  config: CollectionShowcaseConfig;
}

interface CollectionFacet {
  id: string;
  label: string;
  icon: React.ElementType;
  title: string;
  description: string;
  imageUrl: string;
  specs: { label: string; value: string }[];
}

const COLLECTION_FACETS: CollectionFacet[] = [
  {
    id: 'monobloc',
    label: 'Monobloc Architecture',
    icon: Sparkles,
    title: 'Precision Monobloc Basin Mixer',
    description:
      'Orthogonal silhouette with calibrated 0.5mm perimeter chamfers. Machined from solid dezincification-resistant brass casting for enduring acoustic balance and tactile permanence.',
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    specs: [
      { label: 'Cartridge Core', value: 'Diamond Ceramic' },
      { label: 'Acoustic Rating', value: 'Class I Silent' },
    ],
  },
  {
    id: 'concealed',
    label: 'In-Wall Concealed',
    icon: Sliders,
    title: 'Flush In-Wall Thermostatic Suite',
    description:
      'Seamlessly recessed into stone or micro-cement walls. Engineered multi-way diverter core guarantees instantaneous temperature stabilization and high-flow deluge delivery.',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
    specs: [
      { label: 'Installation', value: 'Concealed In-Wall' },
      { label: 'Safety Cutoff', value: '38°C Thermal Lock' },
    ],
  },
  {
    id: 'pvd',
    label: 'PVD Metallurgy',
    icon: ShieldCheck,
    title: 'Vapor-Deposited Architectural Finishes',
    description:
      'Physical Vapor Deposition (PVD) molecular bonding creates an impenetrable surface shield 10x harder than conventional plating—impervious to corrosion, tarnishing, and abrasive wear.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    specs: [
      { label: 'Bonding Standard', value: 'High-Vacuum PVD' },
      { label: 'Hardness Level', value: 'Rockwell C 68' },
    ],
  },
];

export const CollectionShowcaseSection: React.FC<CollectionShowcaseSectionProps> = ({ config }) => {
  const collection = mockOpelCollection;
  const layout = getLayoutClasses(config.layout);
  const [activeFacetId, setActiveFacetId] = useState<string>('monobloc');
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  const currentFacet =
    COLLECTION_FACETS.find((f) => f.id === activeFacetId) || COLLECTION_FACETS[0];

  return (
    <section id="collections" ref={sectionRef} className={`${layout.section} scroll-mt-24`}>
      <div className={layout.container}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Curated Architectural Imagery */}
          <div className={`lg:col-span-7 relative reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
            <div className="relative rounded-token-lg overflow-hidden shadow-elevated border border-border-subtle bg-purple-pale/20 aspect-[16/10] group">
              <img
                key={currentFacet.imageUrl}
                src={currentFacet.imageUrl}
                alt={currentFacet.title}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent pointer-events-none" />

              {/* Floating Architectural Badge */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white pointer-events-none">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-pale block">
                    Curated Series • {currentFacet.label}
                  </span>
                  <p className="font-display font-bold text-lg sm:text-xl text-white mt-0.5">
                    {currentFacet.title}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/25 shadow-glass">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{collection.productCount} Fixtures</span>
                </div>
              </div>
            </div>

            {/* Facet Micro Tabs below image on tablet/mobile */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {COLLECTION_FACETS.map((facet) => {
                const isActive = facet.id === activeFacetId;
                const Icon = facet.icon;
                return (
                  <button
                    key={facet.id}
                    type="button"
                    onClick={() => setActiveFacetId(facet.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border shrink-0 ${
                      isActive
                        ? 'bg-purple-deep text-white border-purple-deep shadow-subtle'
                        : 'bg-white text-ink-muted border-border-subtle hover:border-purple-deep/40 hover:text-ink'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{facet.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Editorial Narrative & Architectural Details */}
          <div
            className={`lg:col-span-5 space-y-6 reveal-base ${
              isVisible ? 'reveal-visible delay-200' : ''
            }`}
          >
            <div>
              <span className="text-xs uppercase font-mono tracking-widest font-semibold text-purple-deep block">
                Collection Spotlight • The Opel Series
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-ink tracking-tight mt-1 mb-2">
                {collection.name}
              </h2>
              <p className="text-sm font-medium text-purple-deep/90 italic mb-3">
                "{collection.tagline}"
              </p>
              <p className="text-sm text-ink-muted leading-relaxed">
                {currentFacet.description}
              </p>
            </div>

            {/* Architectural Highlights Specifications */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-border-subtle/80">
              {currentFacet.specs.map((spec, i) => (
                <div key={i} className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle block">
                    {spec.label}
                  </span>
                  <span className="text-xs font-semibold text-ink font-display block">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Design Highlights Note */}
            <div className="glass-card-interactive p-4 rounded-token-md space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-deep mt-1.5 shrink-0" />
                <p className="text-xs text-ink-muted leading-relaxed">
                  <strong className="text-ink font-semibold">Machined Bevels:</strong> Engineered 0.5mm micro-chamfers along every exterior perimeter prevent sharp edges while amplifying ambient light reflections.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-1">
              <Button asLink href="#catalogue" variant="primary" size="md">
                Explore All Opel Fixtures
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


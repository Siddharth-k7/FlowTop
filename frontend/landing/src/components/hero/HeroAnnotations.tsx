import React from 'react';

interface HeroAnnotationsProps {
  progress: number; // 0 to 1
  onChapterSelect?: (progress: number) => void;
}

interface Chapter {
  id: string;
  minProgress: number;
  maxProgress: number;
  label: string;
  badge: string;
  title: string;
  description: string;
  attributes: { label: string; value: string }[];
}

const chapters: Chapter[] = [
  {
    id: 'ch-form',
    minProgress: 0.0,
    maxProgress: 0.18,
    label: '01 / Form',
    badge: 'Architectural Form',
    title: 'Monolithic Geometry',
    description:
      'Crisp orthogonal planes and subtle chamfered transitions create a calm, sculptural presence designed to anchor contemporary bath spaces.',
    attributes: [
      { label: 'Form Factor', value: 'Monobloc Mixer' },
      { label: 'Surface', value: 'Mirror Chrome' },
    ],
  },
  {
    id: 'ch-material',
    minProgress: 0.18,
    maxProgress: 0.38,
    label: '02 / Substance',
    badge: 'Solid Brass Body',
    title: 'Substantial Materiality',
    description:
      'Engineered from heavy brass casting with balanced wall thickness, offering reassuring tactile weight and enduring corrosion resistance.',
    attributes: [
      { label: 'Construction', value: 'Machined Brass' },
      { label: 'Mounting', value: 'Deck Mounted' },
    ],
  },
  {
    id: 'ch-interior',
    minProgress: 0.38,
    maxProgress: 0.78,
    label: '03 / Internal Core',
    badge: 'Deconstructed Core',
    title: 'Component Alignment',
    description:
      'The internal ceramic disc core delivers fluid, frictionless quarter-turn control, balancing temperature and flow effortlessly.',
    attributes: [
      { label: 'Cartridge', value: 'Ceramic Core' },
      { label: 'Handle Control', value: 'Single Lever' },
    ],
  },
  {
    id: 'ch-flow',
    minProgress: 0.78,
    maxProgress: 1.0,
    label: '04 / Flow',
    badge: 'Hydrodynamics',
    title: 'Comfort Aerated Stream',
    description:
      'A concealed aerator at the spout creates a soft, splash-free column of water, bringing quiet refinement to daily handwashing rituals.',
    attributes: [
      { label: 'Stream Type', value: 'Aerated Flow' },
      { label: 'Spout Outlet', value: 'Integrated Collar' },
    ],
  },
];

export const HeroAnnotations: React.FC<HeroAnnotationsProps> = ({ progress, onChapterSelect }) => {
  const activeChapter =
    chapters.find((ch) => progress >= ch.minProgress && progress <= ch.maxProgress) ||
    chapters[0];

  return (
    <div className="flex flex-col justify-between h-full pointer-events-auto">
      {/* Chapter Indicator Bar */}
      <div className="flex items-center space-x-2 pb-3">
        {chapters.map((ch, idx) => {
          const isActive = ch.id === activeChapter.id;
          return (
            <button
              key={ch.id}
              onClick={() => onChapterSelect?.((ch.minProgress + ch.maxProgress) / 2)}
              className="group flex items-center space-x-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-sm"
              aria-label={`Jump to stage: ${ch.title}`}
            >
              <div
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-8 bg-ink'
                    : 'w-3 bg-border-subtle group-hover:bg-ink/40'
                }`}
              />
              <span
                className={`text-[10px] font-mono tracking-wider transition-colors duration-200 ${
                  isActive ? 'text-ink font-semibold' : 'text-ink-subtle'
                }`}
              >
                0{idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Editorial Content Card - Responsive: compact on mobile, rich on tablet/desktop */}
      <div className="glass-card-interactive p-3.5 sm:p-4 lg:p-5 rounded-token-md max-w-sm shadow-glass">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="glass-tag text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-purple-deep px-2 py-0.5 rounded-token-xs">
            {activeChapter.badge}
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono text-ink-subtle">{activeChapter.label}</span>
        </div>

        <h3 className="text-sm sm:text-base lg:text-lg font-display font-bold text-ink tracking-tight mb-1 sm:mb-2">
          {activeChapter.title}
        </h3>

        {/* Narrative description (hidden on tiny screens, readable on md+) */}
        <p className="hidden sm:block text-xs sm:text-sm text-ink-muted leading-relaxed mb-2.5 lg:mb-3 line-clamp-2 lg:line-clamp-none">
          {activeChapter.description}
        </p>

        {/* Design Attributes */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-2.5 border-t border-border-subtle/80">
          {activeChapter.attributes.map((attr, i) => (
            <div key={i} className="space-y-0.5">
              <span className="text-[8px] sm:text-[9px] uppercase font-semibold tracking-wider text-ink-subtle">
                {attr.label}
              </span>
              <p className="text-[11px] sm:text-xs font-display font-semibold text-purple-deep">{attr.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scrub Navigation Hint */}
      <div className="pt-2 hidden lg:flex items-center space-x-2 text-xs text-ink-subtle">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-deep animate-ping" />
        <span className="text-[10px] tracking-wide">Scroll to explore deconstructed component view</span>
      </div>
    </div>
  );
};

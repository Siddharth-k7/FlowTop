import React, { useState, useEffect } from 'react';
import { GalleryConfig } from '@/types/contract';
import { getLayoutClasses } from '@/utils/format';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Button } from '@/components/common/Button';

interface GallerySectionProps {
  config: GalleryConfig;
}

interface GalleryItem {
  id: string;
  title: string;
  location: string;
  finish: string;
  imageUrl: string;
  category: 'ensuite' | 'powder' | 'hospitality';
}

// Sample Gallery Fixtures (All verified luxury architectural bathroom spaces)
const mockGalleryItems: GalleryItem[] = [
  {
    id: 'img-1',
    title: 'The Monolith Master Ensuite',
    location: 'Bespoke Residence, Alibaug',
    finish: 'Mirror Chrome',
    category: 'ensuite',
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'img-2',
    title: 'Minimalist Travertine Powder Suite',
    location: 'Penthouse Apartment, Mumbai',
    finish: 'Matte Black',
    category: 'powder',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'img-3',
    title: 'Warm Limestone Vessel Station',
    location: 'Boutique Villa, Goa',
    finish: 'Brushed Gold',
    category: 'hospitality',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'img-4',
    title: 'Architectural Exposed Shower Chamber',
    location: 'Urban Loft, Bangalore',
    finish: 'Graphite PVD',
    category: 'ensuite',
    imageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'img-5',
    title: 'Terrazzo Monobloc Wall Installation',
    location: 'Design Studio, New Delhi',
    finish: 'Mirror Chrome',
    category: 'hospitality',
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'img-6',
    title: 'Nordic Oak & White Ceramic Basin',
    location: 'Private Sanctuary, Hyderabad',
    finish: 'Matte Black',
    category: 'powder',
    imageUrl: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1000&q=80',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Spaces' },
  { id: 'ensuite', label: 'Master Ensuites' },
  { id: 'powder', label: 'Powder Suites' },
  { id: 'hospitality', label: 'Boutique Hospitality' },
] as const;

export const GallerySection: React.FC<GallerySectionProps> = ({ config }) => {
  const layout = getLayoutClasses(config.layout);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  const filteredItems =
    activeCategory === 'all'
      ? mockGalleryItems
      : mockGalleryItems.filter((item) => item.category === activeCategory);

  const activeItem = activeItemIndex !== null ? filteredItems[activeItemIndex] : null;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeItemIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItemIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveItemIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
      } else if (e.key === 'ArrowLeft') {
        setActiveItemIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemIndex, filteredItems.length]);

  return (
    <section id="gallery" ref={sectionRef} className={`${layout.section} scroll-mt-24`}>
      <div className={layout.container}>
        {/* Section Heading & Filter Bar */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          <div className="max-w-xl">
            <span className="text-xs uppercase font-mono tracking-widest font-semibold text-purple-deep block">
              Architectural Portfolio • Spaces
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink tracking-tight mt-1">
              {config.heading}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              Selected private residences, boutique hospitality suites, and architectural collaborations featuring Flowtop bathfittings.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveItemIndex(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
                    isActive
                      ? 'bg-purple-deep text-white border-purple-deep shadow-subtle'
                      : 'bg-white text-ink-muted border-border-subtle hover:border-purple-deep/40 hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setActiveItemIndex(index)}
              className={`group relative aspect-[4/3] rounded-token-md overflow-hidden bg-purple-pale/20 border border-border-subtle cursor-pointer shadow-subtle card-hover reveal-base ${
                isVisible ? 'reveal-visible' : ''
              }`}
              style={{ transitionDelay: `${Math.min(index * 80, 450)}ms` }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveItemIndex(index);
                }
              }}
              aria-label={`View photo of ${item.title}`}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Zoom Indicator */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-subtle">
                <ZoomIn className="w-4 h-4" />
              </div>

              {/* Text Caption */}
              {config.showCaptions && (
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between text-[11px] font-mono text-purple-pale mb-1">
                    <span>{item.finish}</span>
                    <span>{item.location}</span>
                  </div>
                  <h4 className="font-display font-bold text-base leading-snug">{item.title}</h4>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeItem && activeItemIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveItemIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-surface-white rounded-token-lg overflow-hidden shadow-elevated border border-border-subtle animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] bg-ink flex items-center justify-center">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="w-full h-full object-contain"
              />
              
              {/* Close Button */}
              <Button
                variant="circle"
                size="md"
                onClick={() => setActiveItemIndex(null)}
                className="absolute top-4 right-4 bg-white/90 text-ink hover:bg-ink hover:text-white"
                aria-label="Close image lightbox"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Previous / Next Controls */}
              <Button
                variant="circle"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItemIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-ink hover:bg-ink hover:text-white"
                aria-label="Previous photograph"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button
                variant="circle"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveItemIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-ink hover:bg-ink hover:text-white"
                aria-label="Next photograph"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-5 sm:p-6 bg-surface-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-purple-deep uppercase font-semibold">
                  {activeItem.finish} • {activeItem.location}
                </span>
                <h3 className="text-lg sm:text-xl font-display font-bold text-ink mt-0.5">
                  {activeItem.title}
                </h3>
              </div>
              <span className="text-xs text-ink-muted">
                Specification: Flowtop Monobloc Series ({activeItemIndex + 1} of {filteredItems.length})
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

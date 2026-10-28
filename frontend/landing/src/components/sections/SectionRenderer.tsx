import React from 'react';
import { Section } from '@/types/contract';
import { HeroSection } from '@/components/hero/HeroSection';
import { Hero3DSection } from '@/components/hero-3d';
import { CinematicHeroSection } from '@/components/hero/CinematicHeroSection';
import { ProductCarouselSection } from './ProductCarouselSection';
import { CollectionShowcaseSection } from './CollectionShowcaseSection';
import { ImageTextSection } from './ImageTextSection';
import { GallerySection } from './GallerySection';
import { CtaSection } from './CtaSection';

interface SectionRendererProps {
  sections: Section[];
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({ sections }) => {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isHero3dEnabled = searchParams?.get('hero3d') === 'true';
  const isCinematicEnabled = searchParams?.get('hero') === 'cinematic';

  // 1. Filter visible sections and sort by position
  const activeSections = [...sections]
    .filter((sec) => sec.visible !== false)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <main className="w-full flex flex-col min-w-[360px] relative">
      {activeSections.map((section, index) => {
        // Section isolation: Hero is z-10 overflow-clip.
        // Subsequent sections are z-20 bg-surface-white with clean relative stacking,
        // guaranteeing that the hero cannot leak or paint over following sections.
        const isHero = section.type === 'hero';
        const wrapperClasses = isHero
          ? 'relative z-10 w-full overflow-clip'
          : 'relative z-20 w-full bg-surface-white shadow-[0_-1px_0_rgba(234,230,240,0.8)]';

        return (
          <div key={section.id || index} className={wrapperClasses}>
            {(() => {
              switch (section.type) {
                case 'hero':
                  if (isHero3dEnabled) {
                    return <Hero3DSection config={section.config} />;
                  }
                  if (isCinematicEnabled) {
                    return <CinematicHeroSection config={section.config} />;
                  }
                  return <HeroSection config={section.config} />;

                case 'product_carousel':
                  return <ProductCarouselSection config={section.config} />;

                case 'collection_showcase':
                  return <CollectionShowcaseSection config={section.config} />;

                case 'image_text':
                  return <ImageTextSection config={section.config} />;

                case 'gallery':
                  return <GallerySection config={section.config} />;

                case 'cta':
                  return <CtaSection config={section.config} />;

                default:
                  console.warn(
                    `[SectionRenderer] Unrecognized section type encountered: ${section.type}`
                  );
                  return null;
              }
            })()}
          </div>
        );
      })}
    </main>
  );
};

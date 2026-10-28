'use client';

import type { ReactNode } from 'react';
import type { Section, SectionDataMap } from './types';
import {
  normalizeHeroSectionConfig,
  normalizeProductCarouselSectionConfig,
  normalizeCollectionShowcaseSectionConfig,
  normalizeImageTextSectionConfig,
  normalizeGallerySectionConfig,
  normalizeCtaSectionConfig,
} from './normalize';
import { HeroSection } from './HeroSection';
import { ProductCarouselSection } from './ProductCarouselSection';
import { CollectionShowcaseSection } from './CollectionShowcaseSection';
import { ImageTextSection } from './ImageTextSection';
import { GallerySection } from './GallerySection';
import { CtaSection } from './CtaSection';

export interface SectionRendererProps {
  sections?: Section[] | null;
  data?: SectionDataMap;
  highlightProductId?: string;
  className?: string;
}

/**
 * SectionRenderer Component
 *
 * Requirements:
 * - Props: sections, data (SectionDataMap), highlightProductId?.
 * - Skip any section with visible false. Sort nothing: render in the order sent.
 * - One exhaustive typed switch on type. The default branch logs a warning with
 *   the section id and type, and renders nothing. `never` checking ensures a
 *   new type added to the union fails the build.
 * - Run each config through its normalizer first. A null result skips the
 *   section and logs. One bad section never breaks the page.
 * - Pass isFirst to the first visible section only.
 * - Zero sections renders an empty fragment.
 */
export function SectionRenderer({
  sections,
  data = {},
  highlightProductId,
  className = '',
}: SectionRendererProps) {
  if (!sections || sections.length === 0) {
    return <></>;
  }

  let hasRenderedFirst = false;
  const elements: ReactNode[] = [];

  for (const section of sections) {
    // Skip any section with visible false
    if (!section || section.visible === false) {
      continue;
    }

    const sectionData = data[section.id];

    switch (section.type) {
      case 'hero': {
        const config = normalizeHeroSectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: hero) due to invalid configuration.`);
          break;
        }

        const isFirst = !hasRenderedFirst;
        hasRenderedFirst = true;

        elements.push(
          <HeroSection
            key={section.id}
            config={config}
            isFirst={isFirst}
          />
        );
        break;
      }

      case 'product_carousel': {
        const config = normalizeProductCarouselSectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: product_carousel) due to invalid configuration.`);
          break;
        }

        hasRenderedFirst = true;

        elements.push(
          <ProductCarouselSection
            key={section.id}
            config={config}
            products={sectionData?.products || []}
            highlightProductId={highlightProductId}
          />
        );
        break;
      }

      case 'collection_showcase': {
        const config = normalizeCollectionShowcaseSectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: collection_showcase) due to invalid configuration.`);
          break;
        }

        hasRenderedFirst = true;

        elements.push(
          <CollectionShowcaseSection
            key={section.id}
            config={config}
            collection={sectionData?.collection || null}
            products={sectionData?.products || []}
          />
        );
        break;
      }

      case 'image_text': {
        const config = normalizeImageTextSectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: image_text) due to invalid configuration.`);
          break;
        }

        hasRenderedFirst = true;

        elements.push(
          <ImageTextSection
            key={section.id}
            config={config}
          />
        );
        break;
      }

      case 'gallery': {
        const config = normalizeGallerySectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: gallery) due to invalid configuration.`);
          break;
        }

        hasRenderedFirst = true;

        elements.push(
          <GallerySection
            key={section.id}
            config={config}
            images={sectionData?.images || []}
          />
        );
        break;
      }

      case 'cta': {
        const config = normalizeCtaSectionConfig(section.config);
        if (!config) {
          console.warn(`[SectionRenderer] Skipped section "${section.id}" (type: cta) due to invalid configuration.`);
          break;
        }

        hasRenderedFirst = true;

        elements.push(
          <CtaSection
            key={section.id}
            config={config}
          />
        );
        break;
      }

      default: {
        // Compile-time exhaustiveness check: if Section union gains a new type, this line fails typecheck
        const exhaustiveCheck: never = section;
        const unhandledType = (exhaustiveCheck as { type?: string })?.type || (section as { type?: string })?.type || 'unknown';
        const unhandledId = (exhaustiveCheck as { id?: string })?.id || (section as { id?: string })?.id || 'unknown';
        console.warn(`[SectionRenderer] Unknown section type "${unhandledType}" (id: "${unhandledId}") skipped.`);
        break;
      }
    }
  }

  if (elements.length === 0) {
    return <></>;
  }

  return <div className={`flex flex-col w-full ${className}`}>{elements}</div>;
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, '..');

// Import TypeScript modules via jiti
const jiti = require('jiti')(path.join(uiRoot, 'index.js'));
const {
  normalizeLayout,
  normalizeHeroConfig,
  normalizeProductCarouselConfig,
  normalizeCollectionShowcaseConfig,
  normalizeImageTextConfig,
  normalizeGalleryConfig,
  normalizeCtaConfig,
  normalizeSection,
} = jiti(path.join(uiRoot, 'src/sections/normalize.ts'));

const {
  minimalHeroConfig,
  fullHeroConfig,
  rawHeroWithUnknownEnum,
  minimalProductCarouselConfig,
  rawProductCarouselWithUnknownEnum,
  fullCollectionShowcaseConfig,
  rawCollectionShowcaseWithUnknownEnum,
  fullImageTextConfig,
  rawImageTextWithUnknownEnum,
  fullGalleryConfig,
  rawGalleryWithUnknownEnum,
  fullCtaConfig,
  rawCtaWithUnknownEnum,
} = jiti(path.join(uiRoot, 'src/sections/fixtures.ts'));

describe('Flowtop Section Normalizers', () => {
  // ─── 1. Shared Layout Block ────────────────────────────────────────────────
  describe('normalizeLayout', () => {
    it('returns default layout when input is empty or null', () => {
      const result = normalizeLayout(null);
      assert.deepEqual(result, {
        background: 'white',
        spacingTop: 'medium',
        spacingBottom: 'medium',
        width: 'contained',
        align: 'left',
      });
    });

    it('falls back to defaults for unknown enum values', () => {
      const result = normalizeLayout({
        background: 'unknown_bg',
        spacingTop: 'extreme',
        spacingBottom: 'tiny',
        width: 'screen_infinite',
        align: 'diagonal',
      });
      assert.deepEqual(result, {
        background: 'white',
        spacingTop: 'medium',
        spacingBottom: 'medium',
        width: 'contained',
        align: 'left',
      });
    });

    it('ignores unknown extra keys', () => {
      const result = normalizeLayout({
        background: 'deep',
        extraKey: 'should_be_stripped',
        randomNum: 1234,
      });
      assert.equal(result.background, 'deep');
      assert.equal(result.extraKey, undefined);
    });
  });

  // ─── 2. Hero Section ───────────────────────────────────────────────────────
  describe('normalizeHeroConfig', () => {
    it('returns null when required headline is missing', () => {
      assert.equal(normalizeHeroConfig({ desktopImageId: 'med-01' }), null);
      assert.equal(normalizeHeroConfig({ headline: '', desktopImageId: 'med-01' }), null);
      assert.equal(normalizeHeroConfig({ headline: '   ', desktopImageId: 'med-01' }), null);
    });

    it('returns null when mediaType is image but desktopImageId is missing', () => {
      assert.equal(normalizeHeroConfig({ headline: 'Valid Headline', mediaType: 'image' }), null);
      assert.equal(normalizeHeroConfig({ headline: 'Valid Headline', mediaType: 'image', desktopImageId: '' }), null);
    });

    it('returns null when mediaType is video but videoUrl is missing', () => {
      assert.equal(normalizeHeroConfig({ headline: 'Valid Headline', mediaType: 'video' }), null);
      assert.equal(normalizeHeroConfig({ headline: 'Valid Headline', mediaType: 'video', videoUrl: '' }), null);
    });

    it('normalizes full valid hero config', () => {
      const result = normalizeHeroConfig(fullHeroConfig);
      assert.ok(result);
      assert.equal(result.headline, 'The Aura Series');
      assert.equal(result.overlay, 'strong');
      assert.equal(result.textPosition, 'center');
      assert.equal(result.ctas.length, 2);
    });

    it('falls back to defaults for unknown enum values in hero', () => {
      const result = normalizeHeroConfig(rawHeroWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.mediaType, 'image'); // Fallback to 'image'
      assert.equal(result.overlay, 'medium'); // Fallback to 'medium'
      assert.equal(result.textPosition, 'bottom-left'); // Fallback to 'bottom-left'
      assert.equal(result.unknownExtraField, undefined); // Ignored
    });

    it('drops invalid CTA items and empty strings count as absent', () => {
      const result = normalizeHeroConfig({
        headline: 'Headline',
        desktopImageId: 'med-01',
        subheading: '   ', // Empty string -> null
        ctas: [
          { label: 'Valid', href: '/products', style: 'primary' },
          { label: '', href: '/invalid' }, // missing label -> dropped
          { label: 'No Href' }, // missing href -> dropped
          'not_an_object', // dropped
        ],
      });
      assert.ok(result);
      assert.equal(result.subheading, null);
      assert.equal(result.ctas.length, 1);
      assert.equal(result.ctas[0].label, 'Valid');
    });
  });

  // ─── 3. Product Carousel ───────────────────────────────────────────────────
  describe('normalizeProductCarouselConfig', () => {
    it('returns null when heading is missing', () => {
      assert.equal(normalizeProductCarouselConfig({ source: 'placement' }), null);
      assert.equal(normalizeProductCarouselConfig({ heading: '' }), null);
    });

    it('normalizes minimal product carousel with default count 8', () => {
      const result = normalizeProductCarouselConfig(minimalProductCarouselConfig);
      assert.ok(result);
      assert.equal(result.heading, 'Curated Bath Brassware');
      assert.equal(result.count, 8);
      assert.equal(result.cardStyle, 'standard');
      assert.equal(result.placementLocation, 'featured');
    });

    it('falls back for unknown enum values and invalid counts', () => {
      const result = normalizeProductCarouselConfig(rawProductCarouselWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.source, 'placement'); // Fallback
      assert.equal(result.cardStyle, 'standard'); // Fallback
      assert.equal(result.count, 8); // Fallback for 'not_a_number'
      assert.equal(result.extraKey, undefined);
    });

    it('drops invalid productIds and parses rule object', () => {
      const result = normalizeProductCarouselConfig({
        heading: 'New Products',
        source: 'rule',
        rule: { type: 'newest', categoryId: 'cat-01' },
        productIds: ['prod-01', '', null, 123],
      });
      assert.ok(result);
      assert.equal(result.source, 'rule');
      assert.deepEqual(result.rule, { type: 'newest', categoryId: 'cat-01' });
      assert.deepEqual(result.productIds, ['prod-01']);
    });
  });

  // ─── 4. Collection Showcase ────────────────────────────────────────────────
  describe('normalizeCollectionShowcaseConfig', () => {
    it('returns null when collectionId is missing', () => {
      assert.equal(normalizeCollectionShowcaseConfig({ variant: 'split' }), null);
      assert.equal(normalizeCollectionShowcaseConfig({ collectionId: '' }), null);
    });

    it('normalizes full collection showcase', () => {
      const result = normalizeCollectionShowcaseConfig(fullCollectionShowcaseConfig);
      assert.ok(result);
      assert.equal(result.collectionId, 'col-cascade');
      assert.equal(result.variant, 'stacked');
      assert.equal(result.productIds.length, 3);
    });

    it('falls back to split for unknown variant and drops invalid productIds', () => {
      const result = normalizeCollectionShowcaseConfig(rawCollectionShowcaseWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.collectionId, 'col-neo');
      assert.equal(result.variant, 'split');
      assert.deepEqual(result.productIds, ['prod-neo-01']);
    });
  });

  // ─── 5. Image Text ─────────────────────────────────────────────────────────
  describe('normalizeImageTextConfig', () => {
    it('returns null when heading, body, or imageId is missing', () => {
      assert.equal(normalizeImageTextConfig({ body: '<p>Hi</p>', imageId: 'med-01' }), null);
      assert.equal(normalizeImageTextConfig({ heading: 'Hi', imageId: 'med-01' }), null);
      assert.equal(normalizeImageTextConfig({ heading: 'Hi', body: '<p>Hi</p>' }), null);
      assert.equal(normalizeImageTextConfig({ heading: 'Hi', body: '', imageId: 'med-01' }), null);
    });

    it('normalizes full image text config', () => {
      const result = normalizeImageTextConfig(fullImageTextConfig);
      assert.ok(result);
      assert.equal(result.heading, 'Sedal Ceramic Tolerances');
      assert.equal(result.imageSide, 'right');
      assert.equal(result.ratio, '60-40');
      assert.equal(result.mobileOrder, 'text-first');
      assert.equal(result.cta?.label, 'Explore Engineering');
    });

    it('falls back to defaults for unknown enums', () => {
      const result = normalizeImageTextConfig(rawImageTextWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.imageSide, 'left');
      assert.equal(result.ratio, '50-50');
      assert.equal(result.mobileOrder, 'image-first');
    });
  });

  // ─── 6. Gallery ────────────────────────────────────────────────────────────
  describe('normalizeGalleryConfig', () => {
    it('returns null when imageIds is empty or missing', () => {
      assert.equal(normalizeGalleryConfig({ heading: 'Gallery' }), null);
      assert.equal(normalizeGalleryConfig({ imageIds: [] }), null);
      assert.equal(normalizeGalleryConfig({ imageIds: ['', null] }), null);
    });

    it('normalizes full gallery config', () => {
      const result = normalizeGalleryConfig(fullGalleryConfig);
      assert.ok(result);
      assert.equal(result.columns, 4);
      assert.equal(result.variant, 'masonry');
      assert.equal(result.imageIds.length, 4);
    });

    it('falls back to defaults for unknown variant and columns', () => {
      const result = normalizeGalleryConfig(rawGalleryWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.variant, 'grid');
      assert.equal(result.columns, 3);
      assert.equal(result.showCaptions, true);
    });
  });

  // ─── 7. CTA ────────────────────────────────────────────────────────────────
  describe('normalizeCtaConfig', () => {
    it('returns null when heading is missing', () => {
      assert.equal(normalizeCtaConfig({ body: 'Some body' }), null);
      assert.equal(normalizeCtaConfig({ heading: '   ' }), null);
    });

    it('normalizes full CTA download config', () => {
      const result = normalizeCtaConfig(fullCtaConfig);
      assert.ok(result);
      assert.equal(result.mode, 'download');
      assert.equal(result.documentId, 'doc-architectural-binder-2026');
    });

    it('falls back to button mode for unknown mode and empty documentId becomes null', () => {
      const result = normalizeCtaConfig(rawCtaWithUnknownEnum);
      assert.ok(result);
      assert.equal(result.mode, 'button');
      assert.equal(result.documentId, null);
    });
  });

  // ─── 8. Master normalizeSection ────────────────────────────────────────────
  describe('normalizeSection', () => {
    it('returns null for missing id, type, or unknown type', () => {
      assert.equal(normalizeSection(null), null);
      assert.equal(normalizeSection({ type: 'hero' }), null);
      assert.equal(normalizeSection({ id: 'sec-01', type: 'unsupported_section_type' }), null);
    });

    it('returns null if section config fails required field validation', () => {
      const invalidHero = {
        id: 'sec-01',
        type: 'hero',
        position: 0,
        visible: true,
        config: { mediaType: 'image' }, // Missing headline & desktopImageId
      };
      assert.equal(normalizeSection(invalidHero), null);
    });

    it('normalizes valid section returning full discriminated union', () => {
      const validHero = {
        id: 'sec-hero-01',
        type: 'hero',
        position: 2,
        visible: true,
        config: minimalHeroConfig,
      };
      const result = normalizeSection(validHero);
      assert.ok(result);
      assert.equal(result.id, 'sec-hero-01');
      assert.equal(result.type, 'hero');
      assert.equal(result.position, 2);
      assert.equal(result.visible, true);
      assert.equal(result.config.headline, 'Elemental Architecture');
    });
  });
});

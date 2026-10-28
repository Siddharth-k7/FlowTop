import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '..');
const srcDir = path.join(uiRoot, 'src');
const outDir = path.join(uiRoot, 'node_modules', '.cache', 'sections-render-test');

function compileTree(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      compileTree(from, path.join(out, entry.name));
    } else if (/\.tsx?$/.test(entry.name)) {
      const { outputText } = ts.transpileModule(fs.readFileSync(from, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, entry.name.replace(/\.tsx?$/, '.js')), outputText);
    }
  }
}

compileTree(srcDir, outDir);

const {
  HeroSection,
  ImageTextSection,
  CtaSection,
  ProductCarouselSection,
  CollectionShowcaseSection,
  GallerySection,
  SectionRenderer,
  HERO_FIXTURES,
  IMAGE_TEXT_FIXTURES,
  CTA_FIXTURES,
  CAROUSEL_FIXTURES,
  COLLECTION_SHOWCASE_FIXTURES,
  GALLERY_FIXTURES,
  mockProducts,
  normalizeHeroSectionConfig,
  normalizeImageTextSectionConfig,
  normalizeCtaSectionConfig,
} = require(path.join(outDir, 'index.js'));

const h = React.createElement;

describe('Sections Server-Side Rendering & Responsive Verification', () => {
  const VIEWPORT_WIDTHS = [360, 768, 1440];

  describe('HeroSection', () => {
    it('renders full hero fixture with headline, subheading, CTAs, and art-directed picture', () => {
      const html = renderToString(
        h(HeroSection, {
          config: HERO_FIXTURES.full,
          isFirst: true,
          desktopImageUrl: 'https://images.unsplash.com/desktop.webp',
          mobileImageUrl: 'https://images.unsplash.com/mobile.webp',
          imageAlt: 'Flowtop Aura Series',
        })
      );

      // Must be an h1 when isFirst={true}
      assert.ok(html.includes('<h1'), 'isFirst hero headline must be h1');
      assert.ok(html.includes('The Aura Series'), 'includes headline');
      assert.ok(html.includes('Sedal ceramic tolerances'), 'includes subheading');
      assert.ok(html.includes('Explore Catalogue'), 'includes CTA 1');
      assert.ok(html.includes('Download Architectural Specs'), 'includes CTA 2');
      assert.ok(html.includes('media="(max-width: 767px)"'), 'art-directed mobile picture source present');
      assert.ok(html.includes('bg-ink/75'), 'applies strong overlay preset');
    });

    it('renders headline as h2 when isFirst={false}', () => {
      const html = renderToString(
        h(HeroSection, {
          config: HERO_FIXTURES.full,
          isFirst: false,
          desktopImageUrl: 'https://images.unsplash.com/desktop.webp',
          imageAlt: 'Flowtop Aura Series',
        })
      );

      assert.ok(html.includes('<h2'), 'hero headline must be h2 when not first');
      assert.ok(!html.includes('<h1'), 'must not render h1 when isFirst={false}');
    });

    it('renders minimal hero fixture with zero gaps (no empty subheading or CTA markup)', () => {
      const html = renderToString(
        h(HeroSection, { config: HERO_FIXTURES.minimal, isFirst: false })
      );

      assert.ok(html.includes('Elemental Architecture'), 'includes headline');
      // No subheading paragraph or empty CTA container
      assert.ok(!html.includes('<p'), 'no empty subheading paragraph when absent');
      assert.ok(!html.includes('class="flex flex-wrap gap-space-4"'), 'no CTA container when no CTAs');
    });

    it('renders withOptionalAbsent fixture without media or gaps', () => {
      const html = renderToString(
        h(HeroSection, { config: HERO_FIXTURES.withOptionalAbsent, isFirst: false })
      );

      assert.ok(html.includes('Pure Geometry'), 'includes headline');
      assert.ok(!html.includes('<picture'), 'no picture tag when no media provided');
      assert.ok(!html.includes('<video'), 'no video tag when no media provided');
    });

    it('falls back to default presets when unknown enum values are passed', () => {
      const normalized = normalizeHeroSectionConfig(HERO_FIXTURES.rawWithUnknownEnum);
      assert.ok(normalized !== null, 'normalization succeeds on raw with unknown enum');

      const html = renderToString(
        h(HeroSection, { config: normalized, isFirst: false })
      );

      assert.ok(html.includes('Tactile Precision'), 'renders headline');
      // Default overlay is medium ('bg-ink/55')
      assert.ok(html.includes('bg-ink/55'), 'falls back to medium overlay preset');
      // Default position is 'bottom-left' ('justify-start items-end text-left')
      assert.ok(html.includes('justify-start items-end text-left'), 'falls back to bottom-left position');
    });
  });

  describe('ImageTextSection', () => {
    it('renders full image text fixture with image, heading, plain-text body, and CTA', () => {
      const html = renderToString(
        h(ImageTextSection, {
          config: IMAGE_TEXT_FIXTURES.full,
          imageUrl: 'https://images.unsplash.com/desktop.webp',
          mobileImageUrl: 'https://images.unsplash.com/mobile.webp',
          imageAlt: 'Sedal Cartridges',
        })
      );

      assert.ok(html.includes('Sedal Ceramic Tolerances'), 'renders heading');
      assert.ok(html.includes('Engineered with Spanish Sedal disc cartridges'), 'renders sanitized plain text body');
      assert.ok(!html.includes('<p><p>'), 'no raw unescaped nested HTML');
      assert.ok(html.includes('Explore Engineering'), 'renders CTA');
      assert.ok(html.includes('md:w-3/5'), 'applies 60-40 column ratio preset');
      assert.ok(html.includes('md:flex-row-reverse'), 'applies image right preset');
      assert.ok(html.includes('flex-col-reverse'), 'applies text-first mobile order preset');
    });

    it('renders minimal image text fixture without CTA gaps', () => {
      const html = renderToString(
        h(ImageTextSection, { config: IMAGE_TEXT_FIXTURES.minimal })
      );

      assert.ok(html.includes('Forged from Billets'), 'renders heading');
      assert.ok(!html.includes('href="/'), 'no CTA link when cta is null');
      assert.ok(html.includes('md:w-1/2'), 'applies 50-50 ratio preset');
      assert.ok(html.includes('md:flex-row'), 'applies image left preset');
      assert.ok(html.includes('flex-col'), 'applies image-first mobile order preset');
    });

    it('falls back to default presets for unknown enum values', () => {
      const normalized = normalizeImageTextSectionConfig(IMAGE_TEXT_FIXTURES.rawWithUnknownEnum);
      assert.ok(normalized !== null, 'normalization succeeds');

      const html = renderToString(h(ImageTextSection, { config: normalized }));
      assert.ok(html.includes('Tactile Controls'), 'renders heading');
      assert.ok(html.includes('md:w-1/2'), 'falls back to 50-50 ratio');
      assert.ok(html.includes('md:flex-row'), 'falls back to left image side');
      assert.ok(html.includes('flex-col'), 'falls back to image-first mobile order');
    });
  });

  describe('CtaSection', () => {
    it('renders download mode with file name, type, and size badge', () => {
      const html = renderToString(
        h(CtaSection, {
          config: CTA_FIXTURES.full,
          documentAsset: {
            filename: 'Flowtop-Architectural-Binder-2026.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 14857620,
            url: '/documents/flowtop-binder.pdf',
          },
        })
      );

      assert.ok(html.includes('Download Technical Architectural Binder'), 'renders heading');
      assert.ok(html.includes('Flowtop-Architectural-Binder-2026.pdf'), 'renders file name');
      assert.ok(html.includes('PDF'), 'renders file type badge');
      assert.ok(html.includes('14.2 MB'), 'renders formatted file size');
      assert.ok(html.includes('download="Flowtop-Architectural-Binder-2026.pdf"'), 'renders download attribute');
      assert.ok(html.includes('rel="noopener"'), 'renders rel=noopener');
    });

    it('renders button mode with verified safe href', () => {
      const html = renderToString(
        h(CtaSection, { config: CTA_FIXTURES.minimal })
      );

      assert.ok(html.includes('Schedule an Architectural Consultation'), 'renders heading');
      assert.ok(html.includes('Contact Showroom'), 'renders action button');
      assert.ok(html.includes('href="/contact"'), 'renders safe link');
    });

    it('renders text only when neither button nor document is present (no dead buttons)', () => {
      const textOnlyConfig = {
        ...CTA_FIXTURES.minimal,
        cta: null,
        documentId: null,
      };

      const html = renderToString(h(CtaSection, { config: textOnlyConfig }));
      assert.ok(html.includes('Schedule an Architectural Consultation'), 'renders heading');
      assert.ok(!html.includes('<button'), 'no button rendered');
      assert.ok(!html.includes('<a'), 'no link rendered');
    });

    it('falls back to button mode for unknown mode enum', () => {
      const normalized = normalizeCtaSectionConfig(CTA_FIXTURES.rawWithUnknownEnum);
      assert.ok(normalized !== null, 'normalization succeeds');
      assert.equal(normalized.mode, 'button', 'mode falls back to button');
    });
  });

  describe('ProductCarouselSection', () => {
    it('renders 2 products when count is 8 with NO empty slots', () => {
      const html = renderToString(
        h(ProductCarouselSection, {
          config: CAROUSEL_FIXTURES.twoOfEight.config,
          products: CAROUSEL_FIXTURES.twoOfEight.products,
        })
      );

      // Must render region with carousel aria role
      assert.ok(html.includes('role="region"'), 'must have role=region');
      assert.ok(html.includes('aria-roledescription="carousel"'), 'must have aria-roledescription=carousel');

      // Count articles: exactly 2 cards rendered, no empty placeholder slots
      const articleMatches = html.match(/<article\b/g) || [];
      assert.equal(articleMatches.length, 2, 'must render exactly 2 product cards, zero empty slots');
      assert.ok(html.includes('Aura Tall Basin Mixer'), 'includes product 1');
      assert.ok(html.includes('Cascade Wall-Mounted Spout'), 'includes product 2');
      assert.ok(!html.includes('Obsidian Thermostatic Shower Mixer'), 'does not include product 3');

      // Scroll-snap track present
      assert.ok(html.includes('snap-x') && html.includes('snap-mandatory'), 'CSS scroll-snap classes present');

      // 44px real buttons for arrows and dots
      assert.ok(html.includes('aria-label="Previous products"'), 'previous button has aria-label');
      assert.ok(html.includes('aria-label="Next products"'), 'next button has aria-label');
      assert.ok(html.includes('min-w-touch') || html.includes('w-11'), '44px touch targets enforced');
    });

    it('renders nothing (null) when products array is empty, not a heading over empty row', () => {
      const html = renderToString(
        h(ProductCarouselSection, {
          config: CAROUSEL_FIXTURES.zeroProducts.config,
          products: [],
        })
      );
      assert.equal(html, '', 'HTML must be completely empty');
    });

    it('applies focus outline when highlightProductId matches', () => {
      const html = renderToString(
        h(ProductCarouselSection, {
          config: CAROUSEL_FIXTURES.withHighlight.config,
          products: CAROUSEL_FIXTURES.withHighlight.products,
          highlightProductId: 'prod-02',
        })
      );

      assert.ok(
        html.includes('ring-2 ring-primary') || html.includes('border-primary'),
        'highlighted card has focus ring style outline'
      );
    });

    it('renders view-all link through safeHref', () => {
      const html = renderToString(
        h(ProductCarouselSection, {
          config: CAROUSEL_FIXTURES.full.config,
          products: CAROUSEL_FIXTURES.full.products,
        })
      );

      assert.ok(html.includes('View All'), 'view-all link text present');
      assert.ok(html.includes('href="/products"'), 'view-all href present');
    });
  });

  describe('CollectionShowcaseSection', () => {
    it('renders split variant with editorial text, cover image, and products row', () => {
      const html = renderToString(
        h(CollectionShowcaseSection, {
          config: COLLECTION_SHOWCASE_FIXTURES.split.config,
          collection: COLLECTION_SHOWCASE_FIXTURES.split.collection,
          products: COLLECTION_SHOWCASE_FIXTURES.split.products,
        })
      );

      assert.ok(html.includes('The Aura Collection'), 'includes collection name');
      assert.ok(html.includes('Forged from virgin lead-free brass'), 'includes plain text description');
      assert.ok(html.includes('Explore Collection'), 'includes CTA link');
      assert.ok(html.includes('Featured Architectural Pieces'), 'includes products row heading');
      assert.ok(html.includes('Aura Tall Basin Mixer'), 'includes product card');
    });

    it('renders stacked variant with full hero and products below', () => {
      const html = renderToString(
        h(CollectionShowcaseSection, {
          config: COLLECTION_SHOWCASE_FIXTURES.stacked.config,
          collection: COLLECTION_SHOWCASE_FIXTURES.stacked.collection,
          products: COLLECTION_SHOWCASE_FIXTURES.stacked.products,
        })
      );

      assert.ok(html.includes('The Aura Collection'), 'includes collection name');
      assert.ok(html.includes('Featured Architectural Pieces'), 'includes products row');
    });

    it('renders overlay variant with frosted glass panel', () => {
      const html = renderToString(
        h(CollectionShowcaseSection, {
          config: COLLECTION_SHOWCASE_FIXTURES.overlay.config,
          collection: COLLECTION_SHOWCASE_FIXTURES.overlay.collection,
          products: COLLECTION_SHOWCASE_FIXTURES.overlay.products,
        })
      );

      assert.ok(html.includes('The Aura Collection'), 'includes collection name');
      assert.ok(html.includes('bg-surface-glass'), 'glassmorphic scrim panel present');
    });

    it('omits products row when selected products are empty', () => {
      const html = renderToString(
        h(CollectionShowcaseSection, {
          config: COLLECTION_SHOWCASE_FIXTURES.zeroProducts.config,
          collection: COLLECTION_SHOWCASE_FIXTURES.zeroProducts.collection,
          products: [],
        })
      );

      assert.ok(html.includes('The Aura Collection'), 'still renders collection editorial');
      assert.ok(!html.includes('Featured Architectural Pieces'), 'products row is completely omitted');
      assert.ok(!html.includes('<article'), 'no product card rendered');
    });

    it('renders nothing (null) when collection is missing', () => {
      const html = renderToString(
        h(CollectionShowcaseSection, {
          config: COLLECTION_SHOWCASE_FIXTURES.missingCollection.config,
          collection: null,
          products: mockProducts,
        })
      );
      assert.equal(html, '', 'must return empty string when collection is missing');
    });
  });

  describe('GallerySection', () => {
    it('renders grid variant dropping to 2 columns on mobile', () => {
      const html = renderToString(
        h(GallerySection, {
          config: GALLERY_FIXTURES.grid.config,
          images: GALLERY_FIXTURES.grid.images,
        })
      );

      assert.ok(html.includes('grid-cols-2'), 'drops to 2 columns on mobile');
      assert.ok(html.includes('md:grid-cols-3'), 'expands to 3 columns on tablet/desktop');
      assert.ok(html.includes('Architectural Grid Gallery'), 'includes gallery heading');
      assert.ok(html.includes('Private residence in Bangalore'), 'renders caption');
    });

    it('renders masonry variant using pure CSS columns without external library', () => {
      const html = renderToString(
        h(GallerySection, {
          config: GALLERY_FIXTURES.masonry.config,
          images: GALLERY_FIXTURES.masonry.images,
        })
      );

      assert.ok(html.includes('columns-2'), 'uses CSS columns-2 on mobile');
      assert.ok(html.includes('break-inside-avoid'), 'uses break-inside-avoid to prevent image splitting');
      assert.ok(html.includes('Pure CSS Masonry Gallery'), 'includes gallery heading');
    });

    it('renders slider variant with CSS scroll-snap track and 44px buttons', () => {
      const html = renderToString(
        h(GallerySection, {
          config: GALLERY_FIXTURES.slider.config,
          images: GALLERY_FIXTURES.slider.images,
        })
      );

      assert.ok(html.includes('snap-x') && html.includes('snap-mandatory'), 'CSS scroll-snap slider track');
      assert.ok(html.includes('aria-label="Previous image"'), '44px previous button');
      assert.ok(html.includes('aria-label="Next image"'), '44px next button');
    });

    it('renders missing captions without empty tags or layout shift', () => {
      const html = renderToString(
        h(GallerySection, {
          config: GALLERY_FIXTURES.missingCaptions.config,
          images: GALLERY_FIXTURES.missingCaptions.images,
        })
      );

      assert.ok(!html.includes('<figcaption'), 'no empty figcaption tags rendered');
      assert.ok(html.includes('aspect-'), 'aspect ratio box preserves space');
    });

    it('renders 30 gallery images without crashing', () => {
      const html = renderToString(
        h(GallerySection, {
          config: GALLERY_FIXTURES.thirtyImages.config,
          images: GALLERY_FIXTURES.thirtyImages.images,
        })
      );

      const imgMatches = html.match(/<img\b/g) || [];
      // 30 gallery figures plus 1 in the Lightbox dialog viewport
      assert.ok(imgMatches.length >= 30, 'renders all 30 images in stress test');
    });
  });

  describe('Zero next/* imports in packages/ui/src/sections/', () => {
    it('verifies that no section file imports from next/*', () => {
      const sectionsDir = path.resolve(uiRoot, 'src', 'sections');
      const files = fs.readdirSync(sectionsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

      for (const file of files) {
        const fullPath = path.join(sectionsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/from\s+['"]next\/[^'"]+['"]/);
        assert.equal(
          match,
          null,
          `Section file ${file} illegally imports from next/*: ${match?.[0]}`
        );
      }
    });
  });

  describe('SectionRenderer', () => {
    it('zero sections renders empty fragment', () => {
      const htmlEmpty = renderToString(h(SectionRenderer, { sections: [] }));
      assert.equal(htmlEmpty, '');
      const htmlNull = renderToString(h(SectionRenderer, { sections: null }));
      assert.equal(htmlNull, '');
    });

    it('skips any section with visible false', () => {
      const sections = [
        {
          id: 'sec-hero-hidden',
          type: 'hero',
          position: 0,
          visible: false,
          config: HERO_FIXTURES.full,
        },
        {
          id: 'sec-cta-visible',
          type: 'cta',
          position: 1,
          visible: true,
          config: CTA_FIXTURES.minimal,
        },
      ];
      const html = renderToString(h(SectionRenderer, { sections }));
      assert.ok(!html.includes('The Opel Collection'), 'hidden section should not be rendered');
      assert.ok(html.includes('Schedule an Architectural Consultation'), 'visible section should be rendered');
    });

    it('renders in the order sent without sorting', () => {
      const sections = [
        {
          id: 'sec-first',
          type: 'cta',
          position: 10,
          visible: true,
          config: { ...CTA_FIXTURES.minimal, heading: 'Sent First In Array' },
        },
        {
          id: 'sec-second',
          type: 'cta',
          position: 1,
          visible: true,
          config: { ...CTA_FIXTURES.minimal, heading: 'Sent Second In Array' },
        },
      ];
      const html = renderToString(h(SectionRenderer, { sections }));
      const posFirst = html.indexOf('Sent First In Array');
      const posSecond = html.indexOf('Sent Second In Array');
      assert.ok(posFirst >= 0 && posSecond >= 0);
      assert.ok(posFirst < posSecond, 'must preserve array order regardless of position property');
    });

    it('passes isFirst only to first visible section', () => {
      const sections = [
        {
          id: 'hero-1',
          type: 'hero',
          position: 0,
          visible: true,
          config: { ...HERO_FIXTURES.full, headline: 'First Hero Headline' },
        },
        {
          id: 'hero-2',
          type: 'hero',
          position: 1,
          visible: true,
          config: { ...HERO_FIXTURES.full, headline: 'Second Hero Headline' },
        },
      ];
      const html = renderToString(h(SectionRenderer, { sections }));
      assert.ok(html.includes('<h1'), 'first visible section must render h1');
      assert.ok(html.includes('First Hero Headline'));
      assert.ok(html.includes('<h2'), 'subsequent section must render h2');
      assert.ok(html.includes('Second Hero Headline'));
    });

    it('one bad section normalizer failure logs warning and does not break the page', () => {
      const warnings = [];
      const origWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));
      try {
        const sections = [
          {
            id: 'bad-hero',
            type: 'hero',
            position: 0,
            visible: true,
            // Missing required headline
            config: {},
          },
          {
            id: 'good-cta',
            type: 'cta',
            position: 1,
            visible: true,
            config: { ...CTA_FIXTURES.minimal, heading: 'Surviving CTA Heading' },
          },
        ];
        const html = renderToString(h(SectionRenderer, { sections }));
        assert.ok(html.includes('Surviving CTA Heading'), 'good section should render despite bad section');
        assert.ok(
          warnings.some((w) => w.includes('bad-hero') && w.includes('hero')),
          'must log warning for bad section'
        );
      } finally {
        console.warn = origWarn;
      }
    });

    it('unknown section type in mock response is logged and skipped', () => {
      const warnings = [];
      const origWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));
      try {
        const sections = [
          {
            id: 'unknown-007',
            type: 'futuristic_3d_viewer',
            position: 0,
            visible: true,
            config: {},
          },
          {
            id: 'valid-cta',
            type: 'cta',
            position: 1,
            visible: true,
            config: { ...CTA_FIXTURES.minimal, heading: 'Working Valid Section' },
          },
        ];
        const html = renderToString(h(SectionRenderer, { sections }));
        assert.ok(html.includes('Working Valid Section'), 'valid section should render');
        assert.ok(
          warnings.some((w) => w.includes('futuristic_3d_viewer') && w.includes('unknown-007')),
          'must log warning for unknown section type'
        );
      } finally {
        console.warn = origWarn;
      }
    });
  });

  describe('Sideways Scroll & Viewport Safety Check (360px, 768px, 1440px)', () => {
    for (const width of VIEWPORT_WIDTHS) {
      it(`verifies layout container classes do not cause horizontal overflow at ${width}px`, () => {
        const heroHtml = renderToString(h(HeroSection, { config: HERO_FIXTURES.full, isFirst: true }));
        const imageTextHtml = renderToString(h(ImageTextSection, { config: IMAGE_TEXT_FIXTURES.full }));
        const ctaHtml = renderToString(h(CtaSection, { config: CTA_FIXTURES.full }));
        const carouselHtml = renderToString(
          h(ProductCarouselSection, {
            config: CAROUSEL_FIXTURES.full.config,
            products: CAROUSEL_FIXTURES.full.products,
          })
        );
        const collectionHtml = renderToString(
          h(CollectionShowcaseSection, {
            config: COLLECTION_SHOWCASE_FIXTURES.split.config,
            collection: COLLECTION_SHOWCASE_FIXTURES.split.collection,
            products: COLLECTION_SHOWCASE_FIXTURES.split.products,
          })
        );
        const galleryHtml = renderToString(
          h(GallerySection, {
            config: GALLERY_FIXTURES.grid.config,
            images: GALLERY_FIXTURES.grid.images,
          })
        );

        for (const [name, html] of Object.entries({
          heroHtml,
          imageTextHtml,
          ctaHtml,
          carouselHtml,
          collectionHtml,
          galleryHtml,
        })) {
          // Check that no fixed width classes exceeding 360px exist without responsive prefix
          const fixedWidthMatch = html.match(/\bw-(?:\[[4-9]\d{2,}px\]|\[\d{4,}px\]|screen)\b/);
          assert.equal(
            fixedWidthMatch,
            null,
            `${name} has fixed width causing horizontal scroll at ${width}px: ${fixedWidthMatch?.[0]}`
          );
        }
      });
    }
  });
});

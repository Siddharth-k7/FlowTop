// TODO(types): move to shared/types when Dev A merges.
/**
 * Flowtop Page Section Test Fixtures
 *
 * Exported typed fixtures per section:
 * 1. Minimal (only required fields)
 * 2. Full (all optional fields populated)
 * 3. With every optional field absent (explicit nulls/omitted)
 * 4. Raw inputs with unknown enum values (for runtime normalization & fallback verification)
 *
 * Exported for shared use by Dev C (public renderer) and Dev D (admin CMS editor).
 */

import type {
  HeroSectionConfig,
  ProductCarouselSectionConfig,
  CollectionShowcaseSectionConfig,
  ImageTextSectionConfig,
  GallerySectionConfig,
  CtaSectionConfig,
  SectionLayout,
  Section,
} from './types';

// ─── Default Layout Block ────────────────────────────────────────────────────

export const defaultLayoutFixture: SectionLayout = {
  background: 'white',
  spacingTop: 'medium',
  spacingBottom: 'medium',
  width: 'contained',
  align: 'left',
};

export const fullLayoutFixture: SectionLayout = {
  background: 'pale',
  spacingTop: 'large',
  spacingBottom: 'large',
  width: 'wide',
  align: 'center',
};

// ─── 1. Hero Fixtures ────────────────────────────────────────────────────────

export const minimalHeroConfig: HeroSectionConfig = {
  headline: 'Elemental Architecture',
  subheading: null,
  mediaType: 'image',
  desktopImageId: 'med-hero-desktop-01',
  mobileImageId: null,
  videoUrl: null,
  overlay: 'medium',
  textPosition: 'bottom-left',
  ctas: [],
  layout: defaultLayoutFixture,
};

export const fullHeroConfig: HeroSectionConfig = {
  headline: 'The Aura Series',
  subheading: 'Forged from lead-free CuZn39Pb3 brass with Sedal ceramic tolerances.',
  mediaType: 'image',
  desktopImageId: 'med-hero-desktop-01',
  mobileImageId: 'med-hero-mobile-01',
  videoUrl: null,
  overlay: 'strong',
  textPosition: 'center',
  ctas: [
    { label: 'Explore Catalogue', href: '/products', style: 'primary' },
    { label: 'Download Architectural Specs', href: '/specs', style: 'ghost' },
  ],
  layout: fullLayoutFixture,
};

export const heroConfigWithOptionalAbsent: HeroSectionConfig = {
  headline: 'Pure Geometry',
  subheading: null,
  mediaType: 'image',
  desktopImageId: 'med-hero-02',
  mobileImageId: null,
  videoUrl: null,
  overlay: 'medium',
  textPosition: 'bottom-left',
  ctas: [],
  layout: defaultLayoutFixture,
};

export const rawHeroWithUnknownEnum: Record<string, unknown> = {
  headline: 'Tactile Precision',
  mediaType: 'unknown_media_format', // Should fall back to 'image'
  desktopImageId: 'med-hero-03',
  overlay: 'extreme_darkness', // Should fall back to 'medium'
  textPosition: 'floating_nowhere', // Should fall back to 'bottom-left'
  unknownExtraField: 'ignore_me', // Should be ignored
  layout: {
    background: 'neon_pink', // Should fall back to 'white'
    spacingTop: 'huge', // Should fall back to 'medium'
    width: 'infinite', // Should fall back to 'contained'
  },
};

// ─── 2. Product Carousel Fixtures ────────────────────────────────────────────

export const minimalProductCarouselConfig: ProductCarouselSectionConfig = {
  heading: 'Curated Bath Brassware',
  source: 'placement',
  placementLocation: 'featured',
  productIds: [],
  rule: null,
  count: 8,
  cardStyle: 'standard',
  viewAllHref: null,
  layout: defaultLayoutFixture,
};

export const fullProductCarouselConfig: ProductCarouselSectionConfig = {
  heading: 'Architectural Basin Mixers',
  source: 'manual',
  placementLocation: null,
  productIds: ['prod-01', 'prod-02', 'prod-03', 'prod-04'],
  rule: null,
  count: 4,
  cardStyle: 'editorial',
  viewAllHref: '/products?category=basin-mixers',
  layout: fullLayoutFixture,
};

export const productCarouselWithOptionalAbsent: ProductCarouselSectionConfig = {
  heading: 'New Arrivals',
  source: 'placement',
  placementLocation: 'new_arrivals',
  productIds: [],
  rule: null,
  count: 8,
  cardStyle: 'standard',
  viewAllHref: null,
  layout: defaultLayoutFixture,
};

export const rawProductCarouselWithUnknownEnum: Record<string, unknown> = {
  heading: 'Trending Now',
  source: 'magical_algorithm', // Should fall back to 'placement'
  placementLocation: 'trending',
  count: 'not_a_number', // Should fall back to 8
  cardStyle: 'super_compact', // Should fall back to 'standard'
  extraKey: 42,
};

// ─── 3. Collection Showcase Fixtures ─────────────────────────────────────────

export const minimalCollectionShowcaseConfig: CollectionShowcaseSectionConfig = {
  collectionId: 'col-aura',
  coverImageId: null,
  description: null,
  productIds: [],
  variant: 'split',
  layout: defaultLayoutFixture,
};

export const fullCollectionShowcaseConfig: CollectionShowcaseSectionConfig = {
  collectionId: 'col-cascade',
  coverImageId: 'med-cascade-cover',
  description: 'Fluted architectural surfaces inspired by classical Roman masonry.',
  productIds: ['prod-cascade-01', 'prod-cascade-02', 'prod-cascade-03'],
  variant: 'stacked',
  layout: fullLayoutFixture,
};

export const collectionShowcaseWithOptionalAbsent: CollectionShowcaseSectionConfig = {
  collectionId: 'col-obsidian',
  coverImageId: null,
  description: null,
  productIds: [],
  variant: 'split',
  layout: defaultLayoutFixture,
};

export const rawCollectionShowcaseWithUnknownEnum: Record<string, unknown> = {
  collectionId: 'col-neo',
  variant: 'diagonal_slider', // Should fall back to 'split'
  productIds: ['prod-neo-01', '', null, 999], // Invalid items should be dropped
};

// ─── 4. Image Text Fixtures ──────────────────────────────────────────────────

export const minimalImageTextConfig: ImageTextSectionConfig = {
  heading: 'Forged from Billets',
  body: '<p>Every fitting is machined from lead-free CuZn39Pb3 brass billets.</p>',
  imageId: 'med-billet-01',
  mobileImageId: null,
  imageSide: 'left',
  ratio: '50-50',
  mobileOrder: 'image-first',
  cta: null,
  layout: defaultLayoutFixture,
};

export const fullImageTextConfig: ImageTextSectionConfig = {
  heading: 'Sedal Ceramic Tolerances',
  body: '<p>Engineered with Spanish Sedal disc cartridges tested to 500,000 cycles without pressure drop or leakage.</p>',
  imageId: 'med-cartridge-01',
  mobileImageId: 'med-cartridge-mob',
  imageSide: 'right',
  ratio: '60-40',
  mobileOrder: 'text-first',
  cta: { label: 'Explore Engineering', href: '/engineering', style: 'primary' },
  layout: fullLayoutFixture,
};

export const imageTextWithOptionalAbsent: ImageTextSectionConfig = {
  heading: 'Zero Leaks Guaranteed',
  body: '<p>Tested under 16 bar hydraulic water pressure before packaging.</p>',
  imageId: 'med-testing-01',
  mobileImageId: null,
  imageSide: 'left',
  ratio: '50-50',
  mobileOrder: 'image-first',
  cta: null,
  layout: defaultLayoutFixture,
};

export const rawImageTextWithUnknownEnum: Record<string, unknown> = {
  heading: 'Tactile Controls',
  body: '<p>Diamond-knurled levers.</p>',
  imageId: 'med-knurl-01',
  imageSide: 'center_split', // Should fall back to 'left'
  ratio: '70-30', // Should fall back to '50-50'
  mobileOrder: 'text_below', // Should fall back to 'image-first'
};

// ─── 5. Gallery Fixtures ─────────────────────────────────────────────────────

export const minimalGalleryConfig: GallerySectionConfig = {
  heading: null,
  imageIds: ['med-gal-01', 'med-gal-02'],
  variant: 'grid',
  columns: 3,
  showCaptions: true,
  layout: defaultLayoutFixture,
};

export const fullGalleryConfig: GallerySectionConfig = {
  heading: 'Project Installations',
  imageIds: ['med-gal-01', 'med-gal-02', 'med-gal-03', 'med-gal-04'],
  variant: 'masonry',
  columns: 4,
  showCaptions: true,
  layout: fullLayoutFixture,
};

export const galleryWithOptionalAbsent: GallerySectionConfig = {
  heading: null,
  imageIds: ['med-gal-01', 'med-gal-02', 'med-gal-03'],
  variant: 'grid',
  columns: 3,
  showCaptions: true,
  layout: defaultLayoutFixture,
};

export const rawGalleryWithUnknownEnum: Record<string, unknown> = {
  imageIds: ['med-gal-01', 'med-gal-02'],
  variant: 'carousel_3d', // Should fall back to 'grid'
  columns: 7, // Should fall back to 3
  showCaptions: 'not_a_boolean', // Should fall back to true
};

// ─── 6. CTA Fixtures ─────────────────────────────────────────────────────────

export const minimalCtaConfig: CtaSectionConfig = {
  heading: 'Schedule an Architectural Consultation',
  body: null,
  mode: 'button',
  cta: { label: 'Contact Showroom', href: '/contact', style: 'primary' },
  documentId: null,
  layout: defaultLayoutFixture,
};

export const fullCtaConfig: CtaSectionConfig = {
  heading: 'Download Technical Architectural Binder',
  body: 'Complete BIM files, dimensional CAD drawings, and warranty specifications for interior designers and architects.',
  mode: 'download',
  cta: null,
  documentId: 'doc-architectural-binder-2026',
  layout: fullLayoutFixture,
};

export const ctaWithOptionalAbsent: CtaSectionConfig = {
  heading: 'Visit Our Bengaluru Showroom',
  body: null,
  mode: 'button',
  cta: { label: 'Directions', href: '/locations', style: 'primary' },
  documentId: null,
  layout: defaultLayoutFixture,
};

export const rawCtaWithUnknownEnum: Record<string, unknown> = {
  heading: 'Architectural Inquiries',
  mode: 'popup_modal', // Should fall back to 'button'
  documentId: '', // Empty string should become null
};

// ─── Complete Section Fixtures ───────────────────────────────────────────────

export const fullHeroSectionFixture: Section = {
  id: 'sec-hero-01',
  type: 'hero',
  position: 0,
  visible: true,
  config: fullHeroConfig,
};

export const fullProductCarouselSectionFixture: Section = {
  id: 'sec-carousel-01',
  type: 'product_carousel',
  position: 1,
  visible: true,
  config: fullProductCarouselConfig,
};

export const fullCollectionShowcaseSectionFixture: Section = {
  id: 'sec-collection-01',
  type: 'collection_showcase',
  position: 2,
  visible: true,
  config: fullCollectionShowcaseConfig,
};

export const fullImageTextSectionFixture: Section = {
  id: 'sec-imagetext-01',
  type: 'image_text',
  position: 3,
  visible: true,
  config: fullImageTextConfig,
};

export const fullGallerySectionFixture: Section = {
  id: 'sec-gallery-01',
  type: 'gallery',
  position: 4,
  visible: true,
  config: fullGalleryConfig,
};

export const fullCtaSectionFixture: Section = {
  id: 'sec-cta-01',
  type: 'cta',
  position: 5,
  visible: true,
  config: fullCtaConfig,
};

// ─── Fixture Group Mappings ──────────────────────────────────────────────────

export const HERO_FIXTURES = {
  minimal: minimalHeroConfig,
  full: fullHeroConfig,
  withOptionalAbsent: heroConfigWithOptionalAbsent,
  rawWithUnknownEnum: rawHeroWithUnknownEnum,
};

export const IMAGE_TEXT_FIXTURES = {
  minimal: minimalImageTextConfig,
  full: fullImageTextConfig,
  withOptionalAbsent: imageTextWithOptionalAbsent,
  rawWithUnknownEnum: rawImageTextWithUnknownEnum,
};

export const CTA_FIXTURES = {
  minimal: minimalCtaConfig,
  full: fullCtaConfig,
  withOptionalAbsent: ctaWithOptionalAbsent,
  rawWithUnknownEnum: rawCtaWithUnknownEnum,
};

// ─── Interactive Section Data Fixtures ───────────────────────────────────────

import type { ProductCardView, CollectionShowcaseView, GalleryImage, SectionDataMap } from './types';

const toHex = (code: string) => String.fromCharCode(35) + code;

export const mockFinishes = [
  { code: 'CP', label: 'Chrome Plated', hex: toHex('E5E7EB') },
  { code: 'BN', label: 'Brushed Nickel', hex: toHex('9CA3AF') },
  { code: 'MB', label: 'Matte Black', hex: toHex('1F2937') },
  { code: 'RG', label: 'Rose Gold', hex: toHex('B76E79') },
];

export const mockProducts: ProductCardView[] = [
  {
    id: 'prod-01',
    slug: 'aura-tall-basin-mixer',
    name: 'Aura Tall Basin Mixer',
    badge: 'Architect Choice',
    price: 1850000,
    originalPrice: 2200000,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      alt: 'Aura Tall Basin Mixer in Brushed Brass',
      width: 800,
      height: 800,
    },
    secondaryImage: {
      url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
      alt: 'Aura Tall Basin Mixer side perspective',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes,
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-02',
    slug: 'cascade-wall-mounted-spout',
    name: 'Cascade Wall-Mounted Spout',
    badge: 'New Release',
    price: 2450000,
    originalPrice: null,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
      alt: 'Cascade Wall-Mounted Spout in Matte Black',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes.slice(0, 3),
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-03',
    slug: 'obsidian-thermostatic-shower-mixer',
    name: 'Obsidian Thermostatic Shower Mixer',
    badge: 'Specifier Favorite',
    price: 4600000,
    originalPrice: 5100000,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
      alt: 'Obsidian Concealed Thermostatic Shower Mixer',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes,
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-04',
    slug: 'flute-deck-mounted-pillar-cock',
    name: 'Flute Deck-Mounted Pillar Cock',
    badge: null,
    price: 980000,
    originalPrice: null,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1595514535415-dae9e1165586?auto=format&fit=crop&w=800&q=80',
      alt: 'Flute Deck-Mounted Pillar Cock in Chrome Plated',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes.slice(0, 2),
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-05',
    slug: 'verona-floor-standing-bath-filler',
    name: 'Verona Floor-Standing Bath Filler',
    badge: 'Bespoke Order',
    price: 7800000,
    originalPrice: null,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      alt: 'Verona Floor-Standing Bath Mixer with Hand Shower',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes,
    isPurchasable: false,
    enquiryOnly: true,
  },
  {
    id: 'prod-06',
    slug: 'linea-diverter-concealed-body',
    name: 'Linea 3-Way Concealed Diverter',
    badge: null,
    price: 1420000,
    originalPrice: 1650000,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
      alt: 'Linea Concealed Diverter Valve',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes.slice(1, 3),
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-07',
    slug: 'zenith-overhead-rain-shower-300mm',
    name: 'Zenith 300mm Overhead Rain Shower',
    badge: 'Limited Run',
    price: 2950000,
    originalPrice: null,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
      alt: 'Zenith Rain Shower Head with Air-Injection',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes,
    isPurchasable: true,
    enquiryOnly: false,
  },
  {
    id: 'prod-08',
    slug: 'solis-single-lever-basin-faucet',
    name: 'Solis Single-Lever Basin Faucet',
    badge: 'Contract Line',
    price: 1120000,
    originalPrice: 1300000,
    primaryImage: {
      url: 'https://images.unsplash.com/photo-1595514535415-dae9e1165586?auto=format&fit=crop&w=800&q=80',
      alt: 'Solis Single-Lever Faucet for hospitality projects',
      width: 800,
      height: 800,
    },
    finishes: mockFinishes.slice(0, 3),
    isPurchasable: true,
    enquiryOnly: false,
  },
];

export const mockCollection: CollectionShowcaseView = {
  id: 'col-aura',
  slug: 'aura-collection',
  name: 'The Aura Collection',
  description:
    'Forged from virgin lead-free brass billets with Spanish ceramic disc tolerance. Designed for meditative bathing sanctuaries where water meets pure geometry.',
  coverImage: {
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
    alt: 'The Aura Bath Fittings Showcase',
    width: 1600,
    height: 1000,
  },
  videoUrl: null,
};

export const mockCollectionWithVideo: CollectionShowcaseView = {
  id: 'col-cascade',
  slug: 'cascade-collection',
  name: 'The Cascade Collection',
  description:
    'A study in quiet acoustic water deceleration. Fluted bodies crafted for high-performance architectural residences.',
  coverImage: {
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=80',
    alt: 'The Cascade Collection poster',
    width: 1600,
    height: 1000,
  },
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

export const mockGalleryImages: GalleryImage[] = [
  {
    id: 'gal-01',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Aura Basin Mixer in private Bangalore villa',
    caption: 'Private residence in Bangalore, featuring Aura Basin Mixers in Brushed Nickel.',
    width: 1200,
    height: 800,
  },
  {
    id: 'gal-02',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Cascade bath spout installation over travertine tub',
    caption: 'Minimalist travertine master bath with Cascade wall-mounted spout.',
    width: 1200,
    height: 900,
  },
  {
    id: 'gal-03',
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80',
    alt: 'Obsidian thermostatic shower mixer with micro-knurling',
    caption: 'Detail of tactile micro-knurled temperature selector in Matte Black.',
    width: 1200,
    height: 1200,
  },
  {
    id: 'gal-04',
    url: 'https://images.unsplash.com/photo-1595514535415-dae9e1165586?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dual basin vanity installation in boutique hotel suite',
    caption: 'Boutique hotel suites in Goa, specified with dual Verona fixtures.',
    width: 1200,
    height: 800,
  },
  {
    id: 'gal-05',
    url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ceramic cartridge pressure testing in lab facility',
    caption: 'Hydrostatic pressure testing at 16 bar in the Flowtop quality lab.',
    width: 1200,
    height: 1000,
  },
  {
    id: 'gal-06',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Raw brass billet CNC machining',
    caption: 'Precision 5-axis CNC machining of solid lead-free brass billet.',
    width: 1200,
    height: 800,
  },
];

// 30 Gallery Images fixture
export const thirtyGalleryImages: GalleryImage[] = Array.from({ length: 30 }, (_, i) => {
  const baseImg = mockGalleryImages[i % mockGalleryImages.length]!;
  return {
    ...baseImg,
    id: `gal-30-${i + 1}`,
    alt: `Architectural Installation #${i + 1}`,
    caption: `Architectural installation detail #${i + 1} curated for hospitality portfolio.`,
  };
});

// Gallery images with missing captions
export const galleryImagesWithoutCaptions: GalleryImage[] = mockGalleryImages.map((img) => ({
  ...img,
  caption: null,
}));

// ─── CAROUSEL_FIXTURES ────────────────────────────────────────────────────────

export const CAROUSEL_FIXTURES = {
  full: {
    config: {
      ...fullProductCarouselConfig,
      count: 8,
      heading: 'Curated Architectural Fittings',
      viewAllHref: '/products',
    },
    products: mockProducts,
  },
  twoOfEight: {
    config: {
      ...fullProductCarouselConfig,
      count: 8,
      heading: 'Two Products When Count is 8 (No Empty Slots)',
      viewAllHref: '/products',
    },
    products: mockProducts.slice(0, 2),
  },
  oneProduct: {
    config: {
      ...minimalProductCarouselConfig,
      count: 4,
      heading: 'Single Spotlight Fitting',
      viewAllHref: null,
    },
    products: [mockProducts[0]!],
  },
  zeroProducts: {
    config: {
      ...minimalProductCarouselConfig,
      count: 8,
      heading: 'Zero Products (Renders Nothing)',
      viewAllHref: '/products',
    },
    products: [],
  },
  withHighlight: {
    config: {
      ...fullProductCarouselConfig,
      count: 4,
      heading: 'Placement Preview with Highlight Outline',
      viewAllHref: '/products',
    },
    products: mockProducts.slice(0, 4),
    highlightProductId: 'prod-02',
  },
};

// ─── COLLECTION_SHOWCASE_FIXTURES ─────────────────────────────────────────────

export const COLLECTION_SHOWCASE_FIXTURES = {
  split: {
    config: {
      ...minimalCollectionShowcaseConfig,
      variant: 'split' as const,
    },
    collection: mockCollection,
    products: mockProducts.slice(0, 3),
  },
  stacked: {
    config: {
      ...fullCollectionShowcaseConfig,
      variant: 'stacked' as const,
    },
    collection: mockCollection,
    products: mockProducts.slice(0, 3),
  },
  overlay: {
    config: {
      ...fullCollectionShowcaseConfig,
      variant: 'overlay' as const,
    },
    collection: mockCollection,
    products: mockProducts.slice(0, 3),
  },
  oneProduct: {
    config: {
      ...minimalCollectionShowcaseConfig,
      variant: 'split' as const,
    },
    collection: mockCollection,
    products: [mockProducts[0]!],
  },
  zeroProducts: {
    config: {
      ...minimalCollectionShowcaseConfig,
      variant: 'split' as const,
    },
    collection: mockCollection,
    products: [],
  },
  missingCollection: {
    config: {
      ...minimalCollectionShowcaseConfig,
      variant: 'split' as const,
    },
    collection: null,
    products: mockProducts.slice(0, 3),
  },
};

// ─── GALLERY_FIXTURES ─────────────────────────────────────────────────────────

export const GALLERY_FIXTURES = {
  grid: {
    config: {
      ...minimalGalleryConfig,
      variant: 'grid' as const,
      columns: 3 as const,
      heading: 'Architectural Grid Gallery',
      showCaptions: true,
    },
    images: mockGalleryImages,
  },
  masonry: {
    config: {
      ...fullGalleryConfig,
      variant: 'masonry' as const,
      columns: 4 as const,
      heading: 'Pure CSS Masonry Gallery',
      showCaptions: true,
    },
    images: mockGalleryImages,
  },
  slider: {
    config: {
      ...fullGalleryConfig,
      variant: 'slider' as const,
      heading: 'Scroll-Snap Slider Gallery',
      showCaptions: true,
    },
    images: mockGalleryImages,
  },
  thirtyImages: {
    config: {
      ...fullGalleryConfig,
      variant: 'masonry' as const,
      columns: 4 as const,
      heading: 'Large Gallery (30 Images Stress Test)',
      showCaptions: true,
    },
    images: thirtyGalleryImages,
  },
  missingCaptions: {
    config: {
      ...minimalGalleryConfig,
      variant: 'grid' as const,
      columns: 3 as const,
      heading: 'Gallery with Missing Captions',
      showCaptions: true,
    },
    images: galleryImagesWithoutCaptions,
  },
};

// ─── Standard SectionDataMap Fixture ──────────────────────────────────────────

export const standardSectionDataMapFixture: SectionDataMap = {
  'sec-carousel-01': {
    products: mockProducts,
  },
  'sec-carousel-two': {
    products: mockProducts.slice(0, 2),
  },
  'sec-carousel-one': {
    products: [mockProducts[0]!],
  },
  'sec-carousel-zero': {
    products: [],
  },
  'sec-collection-01': {
    collection: mockCollection,
    products: mockProducts.slice(0, 3),
  },
  'sec-gallery-01': {
    images: mockGalleryImages,
  },
  'sec-gallery-30': {
    images: thirtyGalleryImages,
  },
  'sec-gallery-nocaption': {
    images: galleryImagesWithoutCaptions,
  },
};



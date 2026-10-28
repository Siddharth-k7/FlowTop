import { Section, ProductCard, CollectionItem } from '@/types/contract';

/**
 * Sample Demonstration Data
 * Note: Product names, finishes, collections, and pricing are development fixtures
 * for layout verification and must be confirmed against Flowtop product catalogues.
 * TODO: Swap for real API when GET /products lands
 */
export const mockProducts: ProductCard[] = [
  {
    id: 'prod-001',
    sku: 'FLW-OPL-BM01',
    name: 'Opel Monobloc Basin Mixer',
    slug: 'opel-monobloc-basin-mixer',
    categoryName: 'Basin Mixers',
    collectionName: 'Opel Collection',
    basePricePaise: 540000, // Sample price: ₹5,400.00
    finishNames: ['Mirror Chrome', 'Matte Black', 'Brushed Gold'],
    coverImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    badge: 'Signature',
    specSummary: 'Architectural Monobloc • Ceramic Disc Control',
  },
  {
    id: 'prod-002',
    sku: 'FLW-OPL-TB02',
    name: 'Opel Tall Boy Basin Mixer',
    slug: 'opel-tall-boy-basin-mixer',
    categoryName: 'Basin Mixers',
    collectionName: 'Opel Collection',
    basePricePaise: 720000, // Sample price: ₹7,200.00
    finishNames: ['Mirror Chrome', 'Matte Black', 'Brushed Bronze'],
    coverImageUrl: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80',
    badge: 'Vessel Series',
    specSummary: 'Elevated Spout Clearance • Countertop Mounting',
  },
  {
    id: 'prod-003',
    sku: 'FLW-VEC-PC01',
    name: 'Vectra Architectural Pillar Cock',
    slug: 'vectra-architectural-pillar-cock',
    categoryName: 'Pillar Cocks',
    collectionName: 'Vectra Collection',
    basePricePaise: 295000, // Sample price: ₹2,950.00
    finishNames: ['Mirror Chrome', 'Graphite'],
    coverImageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
    specSummary: 'Quarter-Turn Mechanism • Machined Brass Handle',
  },
  {
    id: 'prod-004',
    sku: 'FLW-AUR-KM01',
    name: 'Aura Swivel Kitchen Mixer',
    slug: 'aura-swivel-kitchen-mixer',
    categoryName: 'Kitchen Faucets',
    collectionName: 'Aura Collection',
    basePricePaise: 680000, // Sample price: ₹6,800.00
    finishNames: ['Mirror Chrome', 'Matte Black', 'Brushed Stainless'],
    coverImageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    badge: 'Kitchen',
    specSummary: 'High-Arc Swivel Spout • Dual-Flow Aerator',
  },
  {
    id: 'prod-005',
    sku: 'FLW-OPL-DIV01',
    name: 'Opel Concealed Shower Mixer',
    slug: 'opel-concealed-diverter',
    categoryName: 'Shower Mixers',
    collectionName: 'Opel Collection',
    basePricePaise: 890000, // Sample price: ₹8,900.00
    finishNames: ['Mirror Chrome', 'Matte Black', 'Brushed Gold'],
    coverImageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
    specSummary: 'Concealed Installation • Multi-Way Diverter Plate',
  },
  {
    id: 'prod-006',
    sku: 'FLW-MIN-BC01',
    name: 'Minimalist Wall Bib Cock with Flange',
    slug: 'minimalist-wall-bib-cock',
    categoryName: 'Bib Cocks',
    collectionName: 'Minimal Collection',
    basePricePaise: 215000, // Sample price: ₹2,150.00
    finishNames: ['Mirror Chrome'],
    coverImageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
    specSummary: 'Wall-Mount Fitting • Integrated Escutcheon Flange',
  },
];

// Sample Collection Fixture (Replaceable sample imagery representing architectural bath environments)
// TODO: Swap for real API when GET /collections/:slug lands with approved Flowtop photography
export const mockOpelCollection: CollectionItem = {
  id: 'col-opel-01',
  name: 'The Opel Collection',
  slug: 'opel-collection',
  tagline: 'Sculptural purity and architectural restraint',
  description: 'Designed with clean geometric planes, understated transitions, and refined finishes, the Opel collection brings quiet sophistication to modern residential and hospitality bathrooms.',
  // Replaced chef in kitchen with verified architectural luxury bathroom suite:
  heroImageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
  productCount: 14,
};

// Contracted Homepage Sections
// TODO: Swap for real API when GET /pages/:slug lands
export const mockHomepageSections: Section[] = [
  // 1. Contract Section: Hero
  {
    id: 'sec-hero-01',
    type: 'hero',
    position: 1,
    visible: true,
    config: {
      headline: 'Architectural Bathfittings Crafted for Modern Spaces',
      subheading: 'Experience the balance of pure geometry, substantial solid brass construction, and effortless water control.',
      mediaType: 'image',
      desktopImageId: 'media-hero-desktop',
      mobileImageId: 'media-hero-mobile',
      videoUrl: null,
      overlay: 'light',
      textPosition: 'bottom-left',
      ctas: [
        { label: 'Explore The Opel Range', href: '#catalogue', style: 'primary' },
        { label: 'View Collections', href: '#collections', style: 'secondary' },
      ],
      layout: {
        background: 'white',
        spacingTop: 'none',
        spacingBottom: 'none',
        width: 'full',
        align: 'left',
      },
    },
  },

  // 2. Contract Section: Product Carousel
  {
    id: 'sec-carousel-02',
    type: 'product_carousel',
    position: 2,
    visible: true,
    config: {
      heading: 'Curated Bath Fixtures',
      source: 'placement',
      placementLocation: 'homepage_featured',
      productIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005', 'prod-006'],
      count: 6,
      cardStyle: 'standard',
      viewAllHref: '#catalogue',
      layout: {
        background: 'white',
        spacingTop: 'large',
        spacingBottom: 'medium',
        width: 'contained',
        align: 'left',
      },
    },
  },

  // 3. Contract Section: Collection Showcase
  {
    id: 'sec-collection-03',
    type: 'collection_showcase',
    position: 3,
    visible: true,
    config: {
      collectionId: 'col-opel-01',
      coverImageId: 'media-opel-cover',
      description: 'Defined by crisp right-angle planes and subtle chamfered corners, the Opel series pairs naturally with minimalist vanities, stone surfaces, and bespoke architecture.',
      productIds: ['prod-001', 'prod-002', 'prod-005'],
      variant: 'split',
      layout: {
        background: 'pale',
        spacingTop: 'large',
        spacingBottom: 'large',
        width: 'contained',
        align: 'left',
      },
    },
  },

  // 4. Contract Section: Image Text
  {
    id: 'sec-imgtext-04',
    type: 'image_text',
    position: 4,
    visible: true,
    config: {
      heading: 'Thoughtful Design & Enduring Craft',
      body: '<p>Every Flowtop fitting is developed with an emphasis on architectural proportion, tactile weight, and durable surface craftsmanship.</p><p class="mt-4">From precision machining to multi-step polishing, our processes focus on delivering quiet visual harmony and dependable everyday performance.</p>',
      imageId: 'media-craft-01',
      mobileImageId: 'media-craft-mobile',
      imageSide: 'right',
      ratio: '50-50',
      mobileOrder: 'image-first',
      cta: {
        label: 'Discover Our Philosophy',
        href: '#craftsmanship',
      },
      layout: {
        background: 'white',
        spacingTop: 'large',
        spacingBottom: 'large',
        width: 'contained',
        align: 'left',
      },
    },
  },

  // 5. Contract Section: Gallery
  {
    id: 'sec-gallery-05',
    type: 'gallery',
    position: 5,
    visible: true,
    config: {
      heading: 'In Context: Spaces & Installations',
      imageIds: ['img-1', 'img-2', 'img-3', 'img-4'],
      variant: 'grid',
      columns: 3,
      showCaptions: true,
      layout: {
        background: 'white',
        spacingTop: 'medium',
        spacingBottom: 'large',
        width: 'wide',
        align: 'left',
      },
    },
  },

  // 6. Contract Section: CTA
  {
    id: 'sec-cta-06',
    type: 'cta',
    position: 6,
    visible: true,
    config: {
      heading: 'Collaborate on Your Next Project',
      body: 'Whether you are specifying for private residences or boutique commercial developments, our team is available to assist with finish samples, dimensions, and product selection.',
      mode: 'button',
      cta: {
        label: 'Get in Touch with Flowtop',
        href: '#contact',
      },
      documentId: null,
      layout: {
        background: 'deep',
        spacingTop: 'large',
        spacingBottom: 'large',
        width: 'contained',
        align: 'center',
      },
    },
  },
];

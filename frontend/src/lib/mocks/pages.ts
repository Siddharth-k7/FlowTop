// TODO(mock): replace on swap day
import type { PageResponse, SingleResponse } from '../types-pending';

export const mockPages: Record<string, PageResponse> = {
  '': {
    id: 'page-home-001',
    title: 'Flowtop Homepage',
    slug: '',
    status: 'published',
    seo: {
      title: 'Premium Bathfittings for Modern Indian Homes | Flowtop',
      description: 'Explore Flowtop premium bathfittings, designed in India for beautiful everyday rituals.',
      canonical: 'https://flowtop.in',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-hero-01',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'The art of everyday water',
          subheading: 'Premium bathfittings designed for considered Indian homes.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: 'med-hero-bath-mobile',
          videoUrl: null,
          overlay: 'medium',
          textPosition: 'bottom-left',
          ctas: [
            { label: 'Explore collections', href: '/collections', style: 'primary' },
            { label: 'View products', href: '/products', style: 'secondary' },
          ],
          layout: {
            background: 'deep',
            spacingTop: 'none',
            spacingBottom: 'large',
            width: 'full',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-carousel-01',
        type: 'product_carousel',
        position: 1,
        visible: true,
        config: {
          heading: 'Featured products',
          source: 'placement',
          placementLocation: 'featured',
          productIds: [],
          rule: null,
          count: 8,
          cardStyle: 'standard',
          viewAllHref: '/products',
          layout: {
            background: 'white',
            spacingTop: 'large',
            spacingBottom: 'medium',
            width: 'contained',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-collection-01',
        type: 'collection_showcase',
        position: 2,
        visible: true,
        config: {
          collectionId: 'opel',
          coverImageId: null,
          description: 'Quiet geometry for modern spaces.',
          productIds: [],
          variant: 'split',
          layout: {
            background: 'pale',
            spacingTop: 'medium',
            spacingBottom: 'medium',
            width: 'wide',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-imagetext-01',
        type: 'image_text',
        position: 3,
        visible: true,
        config: {
          heading: 'Made for the Indian ritual',
          body: '<p>Thoughtful proportions, dependable cartridges and finishes that age beautifully.</p>',
          imageId: 'med-editorial-bath',
          mobileImageId: null,
          imageSide: 'right',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Why Flowtop', href: '/about' },
          layout: {
            background: 'white',
            spacingTop: 'medium',
            spacingBottom: 'medium',
            width: 'contained',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-cta-01',
        type: 'cta',
        position: 4,
        visible: true,
        config: {
          heading: 'Find your finish',
          body: 'Build a bathroom with a point of view.',
          mode: 'button',
          cta: { label: 'View all products', href: '/products' },
          documentId: null,
          layout: {
            background: 'black',
            spacingTop: 'large',
            spacingBottom: 'large',
            width: 'contained',
            align: 'center',
          },
        },
      },
    ],
  },
  'opel-launch': {
    id: 'page-opel-launch',
    title: 'Opel Collection Launch',
    slug: 'opel-launch',
    status: 'published',
    seo: {
      title: 'The Opel Collection Launch | Flowtop',
      description: 'Discover the new Opel Collection. Architectural precision and understated elegance.',
      canonical: 'https://flowtop.in/opel-launch',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-opel-hero',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'The Opel Collection',
          subheading: 'Architectural precision meets considered proportion.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: null,
          videoUrl: null,
          overlay: 'medium',
          textPosition: 'center',
          ctas: [{ label: 'Explore Opel', href: '/collections/opel', style: 'primary' }],
          layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'center' },
        },
      },
      {
        id: 'sec-opel-carousel',
        type: 'product_carousel',
        position: 1,
        visible: true,
        config: {
          heading: 'Collection highlights',
          source: 'placement',
          placementLocation: 'featured',
          productIds: [],
          rule: null,
          count: 4,
          cardStyle: 'standard',
          viewAllHref: '/collections/opel',
          layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-opel-cta',
        type: 'cta',
        position: 2,
        visible: true,
        config: {
          heading: 'Experience the collection',
          body: 'Visit an authorized showroom to touch and experience Flowtop brassware.',
          mode: 'button',
          cta: { label: 'Locate a showroom', href: '/locations' },
          documentId: null,
          layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' },
        },
      },
    ],
  },
};

export function getMockPage(slug: string): SingleResponse<PageResponse> | null {
  const page = mockPages[slug];
  if (!page) {
    return null;
  }
  return { data: page };
}

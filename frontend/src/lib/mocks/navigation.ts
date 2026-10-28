// TODO(mock): replace on swap day
/**
 * Mock navigation fixture for Flowtop public site.
 */

import type { NavigationResponse } from '../types-pending';

export const mockNavigationData: NavigationResponse = {
  header: [
    {
      id: 'nav-products',
      label: 'Products',
      items: [
        {
          id: 'prod-basin-mixers',
          label: 'Basin Mixers',
          href: '/products?category=basin-mixers',
          description: 'Deck-mounted and tall architectural basin brassware.',
        },
        {
          id: 'prod-shower-systems',
          label: 'Shower Systems',
          href: '/products?category=shower-systems',
          description: 'Thermostatic cascades, overhead rain, and hand showers.',
        },
        {
          id: 'prod-bath-spouts',
          label: 'Bath Spouts & Fillers',
          href: '/products?category=bath-spouts',
          description: 'Wall-mounted aerated spouts and floorstanding fillers.',
        },
        {
          id: 'prod-diverters',
          label: 'Concealed Diverters',
          href: '/products?category=diverters',
          description: 'High-flow multi-outlet thermostatic control bodies.',
        },
        {
          id: 'prod-kitchen',
          label: 'Kitchen Faucets',
          href: '/products?category=kitchen-faucets',
          description: 'Pull-out spray mixers in enduring PVD finishes.',
        },
        {
          id: 'prod-accessories',
          label: 'Accessories & Hardware',
          href: '/products?category=accessories',
          description: 'Complementary towel rails, robe hooks, and paper holders.',
        },
      ],
    },
    {
      id: 'nav-collections',
      label: 'Collections',
      items: [
        {
          id: 'col-aura',
          label: 'Aura Series',
          href: '/collections/aura',
          description: 'Minimalist cylindrical silhouettes with knurled detailing.',
          badge: 'Signature',
        },
        {
          id: 'col-cascade',
          label: 'Cascade Luxe',
          href: '/collections/cascade',
          description: 'Ribbed architectural surfaces inspired by classical fluting.',
        },
        {
          id: 'col-obsidian',
          label: 'Obsidian Noir',
          href: '/collections/obsidian',
          description: 'Deep matte black PVD with brass underlying accents.',
          badge: 'New',
        },
        {
          id: 'col-neo',
          label: 'Neo Architectural',
          href: '/collections/neo',
          description: 'Geometric planar precision engineered for modern spaces.',
        },
      ],
    },
    {
      id: 'nav-trade',
      label: 'Specifiers & Trade',
      href: '/trade',
    },
    {
      id: 'nav-journal',
      label: 'Journal',
      href: '/journal',
    },
    {
      id: 'nav-about',
      label: 'About',
      href: '/about',
    },
  ],
  footer: {
    columns: [
      {
        id: 'footer-col-collections',
        title: 'Collections',
        links: [
          { id: 'f-col-1', label: 'Aura Series', href: '/collections/aura' },
          { id: 'f-col-2', label: 'Cascade Luxe', href: '/collections/cascade' },
          { id: 'f-col-3', label: 'Obsidian Noir', href: '/collections/obsidian' },
          { id: 'f-col-4', label: 'Neo Architectural', href: '/collections/neo' },
          { id: 'f-col-5', label: 'All Collections', href: '/collections' },
        ],
      },
      {
        id: 'footer-col-fittings',
        title: 'Fittings & Hardware',
        links: [
          { id: 'f-fit-1', label: 'Basin Mixers', href: '/products?category=basin-mixers' },
          { id: 'f-fit-2', label: 'Overhead Showers', href: '/products?category=shower-systems' },
          { id: 'f-fit-3', label: 'Bath Spouts', href: '/products?category=bath-spouts' },
          { id: 'f-fit-4', label: 'Concealed Diverters', href: '/products?category=diverters' },
          { id: 'f-fit-5', label: 'Kitchen Brassware', href: '/products?category=kitchen-faucets' },
        ],
      },
      {
        id: 'footer-col-trade',
        title: 'Specifiers & Architects',
        links: [
          { id: 'f-tr-1', label: 'Trade Partner Portal', href: '/trade' },
          { id: 'f-tr-2', label: 'BIM & CAD File Library', href: '/trade/downloads' },
          { id: 'f-tr-3', label: 'Technical Specifications', href: '/trade/specs' },
          { id: 'f-tr-4', label: 'Commercial Project Enquiry', href: '/contact?type=dealer' },
        ],
      },
      {
        id: 'footer-col-company',
        title: 'Flowtop',
        links: [
          { id: 'f-co-1', label: 'About Flowtop', href: '/about' },
          { id: 'f-co-2', label: 'Manufacturing & Engineering', href: '/manufacturing' },
          { id: 'f-co-3', label: 'Quality & Testing', href: '/quality' },
          { id: 'f-co-4', label: 'Customer Care & Support', href: '/support' },
          { id: 'f-co-5', label: 'Design Journal', href: '/journal' },
          { id: 'f-co-6', label: 'Contact Us', href: '/contact' },
        ],
      },
    ],
    socialLinks: [
      {
        id: 'soc-instagram',
        platform: 'instagram',
        url: 'https://instagram.com/flowtop_official',
        label: 'Flowtop on Instagram',
      },
      {
        id: 'soc-linkedin',
        platform: 'linkedin',
        url: 'https://linkedin.com/company/flowtop',
        label: 'Flowtop on LinkedIn',
      },
      {
        id: 'soc-pinterest',
        platform: 'pinterest',
        url: 'https://pinterest.com/flowtopfittings',
        label: 'Flowtop on Pinterest',
      },
      {
        id: 'soc-youtube',
        platform: 'youtube',
        url: 'https://youtube.com/@flowtop',
        label: 'Flowtop on YouTube',
      },
    ],
    legalNotice: '© 2026 Flowtop Bathfittings Pvt. Ltd. All rights reserved. Precision architectural brassware.',
  },
};

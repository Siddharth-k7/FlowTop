// TODO(mock): replace on swap day
import type { Category } from '../types-pending';

export const mockCategories = [
  {
    id: 'cat-basin-mixers',
    name: 'Basin Mixers',
    slug: 'basin-mixers',
    description: 'Deck-mounted and tall architectural basin brassware with ceramic disc cartridges.',
    productCount: 10,
  },
  {
    id: 'cat-shower-systems',
    name: 'Shower Systems',
    slug: 'shower-systems',
    description: 'Thermostatic cascades, ceiling rainfall showers, and precision multi-jet hand pieces.',
    productCount: 8,
  },
  {
    id: 'cat-bath-spouts',
    name: 'Bath Spouts & Fillers',
    slug: 'bath-spouts',
    description: 'Wall-mounted aerated spouts, floorstanding bathtub fillers, and concealed divert valves.',
    productCount: 6,
  },
  {
    id: 'cat-diverters',
    name: 'Concealed Diverters',
    slug: 'diverters',
    description: 'High-flow 2-way and 3-way thermostatic control valves with solid forged brass trim plates.',
    productCount: 6,
  },
  {
    id: 'cat-kitchen-faucets',
    name: 'Kitchen Faucets',
    slug: 'kitchen-faucets',
    description: 'Dual-flow pull-out culinary mixers engineered for high durability in stainless and PVD brass.',
    productCount: 5,
  },
  {
    id: 'cat-accessories',
    name: 'Accessories & Hardware',
    slug: 'accessories',
    description: 'Minimalist solid brass towel rails, toilet roll holders, robe hooks, and drain waste couplings.',
    productCount: 5,
  },
  {
    id: 'cat-bidets',
    name: 'Bidets & Hand Showers',
    slug: 'bidets',
    description: 'Floor-standing and wall-hung architectural bidets with integrated spray controls.',
    productCount: 0,
  },
] satisfies Category[];

// TODO(mock): replace on swap day
import type { Collection } from '../types-pending';

export const mockCollections = [
  {
    id: 'col-aura',
    name: 'Aura Series',
    slug: 'aura',
    tagline: 'Minimalist cylindrical silhouettes with diamond-knurled tactile detail.',
    description: 'Forged from lead-free architectural brass, Aura represents the purest reduction of cylindrical form, complemented by tactile diamond knurling.',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
    featured: true,
    productCount: 12,
  },
  {
    id: 'col-cascade',
    name: 'Cascade Luxe',
    slug: 'cascade',
    tagline: 'Fluted architectural surfaces inspired by classical Roman aqueduct fluting.',
    description: 'A tribute to classical masonry architecture, Cascade Luxe pairs fluted tactile levers with whisper-quiet laminar water delivery.',
    heroImage: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1600&q=80',
    featured: true,
    productCount: 10,
  },
  {
    id: 'col-obsidian',
    name: 'Obsidian Noir',
    slug: 'obsidian',
    tagline: 'Deep matte obsidian finish with underlying warm brushed brass accents.',
    description: 'Dual-baked PVD surface bonding creates an ultra-durable, velvety obsidian finish that resists fingerprint marks and water droplet stains.',
    heroImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=80',
    featured: true,
    productCount: 8,
  },
  {
    id: 'col-neo',
    name: 'Neo Architectural',
    slug: 'neo',
    tagline: 'Geometric planar precision engineered for uncompromising modernist interiors.',
    description: 'Crisp 90-degree planar angles machined with sub-millimeter CNC accuracy from solid extruded brass billets.',
    heroImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1600&q=80',
    featured: false,
    productCount: 10,
  },
] satisfies Collection[];

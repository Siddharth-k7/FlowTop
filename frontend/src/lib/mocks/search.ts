// TODO(mock): replace on swap day
import type {
  SiteSearchResults,
  SearchProductItem,
  SearchCollectionItem,
  SearchArticleItem,
} from '../types-pending';

export interface SearchSourceData {
  products?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    primaryImage?: string;
    categorySlug?: string;
  }[];
  collections?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    heroImage?: string;
  }[];
  articles?: {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    readTimeMinutes?: number;
  }[];
}

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Aura Tall Basin Mixer',
    slug: 'aura-tall-basin-mixer',
    sku: 'FT-AUR-BM-01',
    price: 1450000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'basin-mixers',
  },
  {
    id: 'prod-02',
    name: 'Aura Standard Basin Mixer',
    slug: 'aura-standard-basin-mixer',
    sku: 'FT-AUR-BM-02',
    price: 1180000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'basin-mixers',
  },
  {
    id: 'prod-04',
    name: 'Cascade Deck Mount Mixer',
    slug: 'cascade-deck-mount-mixer',
    sku: 'FT-CAS-BM-01',
    price: 1620000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'basin-mixers',
  },
  {
    id: 'prod-11',
    name: 'Obsidian Thermostatic Shower Column',
    slug: 'obsidian-thermostatic-shower-column',
    sku: 'FT-OBS-SH-01',
    price: 4850000,
    salePrice: 4290000,
    primaryImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'shower-systems',
  },
  {
    id: 'prod-21',
    name: 'Aura Floor-Mounted Bath Spout',
    slug: 'aura-floor-mounted-bath-spout',
    sku: 'FT-AUR-BS-01',
    price: 3200000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'bath-spouts',
  },
  {
    id: 'prod-36',
    name: 'Aura Single Towel Rail 600mm',
    slug: 'aura-single-towel-rail-600mm',
    sku: 'FT-AUR-TR-01',
    price: 520000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    categorySlug: 'accessories',
  },
];

const DEFAULT_COLLECTIONS = [
  {
    id: 'col-aura',
    name: 'Aura Series',
    slug: 'aura',
    description: 'Minimalist cylindrical silhouettes with diamond-knurled tactile detail.',
  },
  {
    id: 'col-cascade',
    name: 'Cascade Luxe',
    slug: 'cascade',
    description: 'Fluted architectural surfaces inspired by classical Roman aqueduct masonry.',
  },
  {
    id: 'col-obsidian',
    name: 'Obsidian Noir',
    slug: 'obsidian',
    description: 'Deep matte obsidian finish with underlying warm brushed brass accents.',
  },
  {
    id: 'col-neo',
    name: 'Neo Architectural',
    slug: 'neo',
    description: 'Clean geometric lines crafted for contemporary minimalist master suites.',
  },
];

const DEFAULT_ARTICLES = [
  {
    id: 'art-01',
    title: 'How to Choose the Right Basin Mixer for Your Bathroom',
    slug: 'how-to-choose-a-basin-mixer',
    category: 'Guides',
    excerpt: 'Height, reach, water pressure and finish selection for architectural washbasins.',
    readTimeMinutes: 4,
  },
  {
    id: 'art-02',
    title: 'The Quiet Luxury of Matte Black in Contemporary Indian Bathrooms',
    slug: 'the-quiet-luxury-of-matte-black',
    category: 'Design',
    excerpt: 'How tactile PVD finishes transform everyday spaces into intentional rituals.',
    readTimeMinutes: 5,
  },
  {
    id: 'art-03',
    title: 'Inside the Opel Collection: Engineering Meets Organic Form',
    slug: 'inside-the-opel-collection',
    category: 'Craft',
    excerpt: 'Two years of micro-precision development behind the flagship Opel brassware.',
    readTimeMinutes: 6,
  },
  {
    id: 'art-04',
    title: 'Caring for PVD-Coated Brassware in Hard Water Regions',
    slug: 'caring-for-pvd-brassware-hard-water',
    category: 'Guides',
    excerpt: 'Simple maintenance rituals that preserve lustre for generations.',
    readTimeMinutes: 3,
  },
];

export function searchMockSite(
  query: string,
  source?: SearchSourceData
): SiteSearchResults {
  const cleanQ = query.trim().toLowerCase();

  if (!cleanQ || cleanQ.length < 2) {
    return { products: [], collections: [], articles: [] };
  }

  const productsPool = source?.products || DEFAULT_PRODUCTS;
  const collectionsPool = source?.collections || DEFAULT_COLLECTIONS;
  const articlesPool = source?.articles || DEFAULT_ARTICLES;

  // 1. Products search
  const matchedProducts: SearchProductItem[] = productsPool
    .filter((p) => {
      return (
        p.name.toLowerCase().includes(cleanQ) ||
        p.sku.toLowerCase().includes(cleanQ) ||
        (p.categorySlug && p.categorySlug.toLowerCase().includes(cleanQ))
      );
    })
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice || null,
      imageUrl: p.primaryImage,
      categoryName: p.categorySlug ? p.categorySlug.replace('-', ' ') : undefined,
    }));

  // 2. Collections search
  const matchedCollections: SearchCollectionItem[] = collectionsPool
    .filter((c) => {
      return (
        c.name.toLowerCase().includes(cleanQ) ||
        c.slug.toLowerCase().includes(cleanQ) ||
        (c.description && c.description.toLowerCase().includes(cleanQ))
      );
    })
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      heroImage: 'heroImage' in c ? (c as { heroImage?: string }).heroImage : undefined,
    }));

  // 3. Articles search
  const matchedArticles: SearchArticleItem[] = articlesPool
    .filter((a) => {
      return (
        a.title.toLowerCase().includes(cleanQ) ||
        a.slug.toLowerCase().includes(cleanQ) ||
        a.category.toLowerCase().includes(cleanQ) ||
        a.excerpt.toLowerCase().includes(cleanQ)
      );
    })
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt,
      readTimeMinutes: a.readTimeMinutes,
    }));

  return {
    products: matchedProducts,
    collections: matchedCollections,
    articles: matchedArticles,
  };
}

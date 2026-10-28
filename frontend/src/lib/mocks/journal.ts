// TODO(mock): replace on swap day
import type { JournalArticleDetail, ProductCard } from '../types-pending';
const sampleProducts: ProductCard[] = [
  {
    id: 'prod-01',
    name: 'Aura Tall Basin Mixer',
    slug: 'aura-tall-basin-mixer',
    sku: 'FT-AUR-BM-01',
    price: 1450000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'basin-mixers',
    collectionSlug: 'aura',
    isAvailable: true,
    availabilityMessage: 'In stock, ships in 2-3 business days',
    finishes: ['chrome', 'brushed-gold', 'matte-black', 'rose-gold'],
  },
  {
    id: 'prod-02',
    name: 'Aura Standard Basin Mixer',
    slug: 'aura-standard-basin-mixer',
    sku: 'FT-AUR-BM-02',
    price: 1150000,
    salePrice: null,
    primaryImage: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'basin-mixers',
    collectionSlug: 'aura',
    isAvailable: true,
    availabilityMessage: 'In stock, ships in 2-3 business days',
    finishes: ['chrome', 'brushed-gold', 'matte-black', 'rose-gold'],
  },
  {
    id: 'prod-03',
    name: 'Aura Wall-Mounted Basin Mixer',
    slug: 'aura-wall-mounted-basin-mixer',
    sku: 'FT-AUR-BM-03',
    price: 1850000,
    salePrice: 1650000,
    primaryImage: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'basin-mixers',
    collectionSlug: 'aura',
    isAvailable: true,
    availabilityMessage: 'In stock, ships in 2-3 business days',
    finishes: ['chrome', 'brushed-gold', 'matte-black', 'rose-gold'],
  },
];

export const mockJournalArticles: JournalArticleDetail[] = [
  {
    id: 'art-01',
    title: 'How to choose a basin mixer',
    slug: 'how-to-choose-a-basin-mixer',
    excerpt: 'A considered guide to height, reach, and finish for modern bathroom basins.',
    coverImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    category: 'Buying Guide',
    publishedAt: '2026-10-05T08:00:00Z',
    readTimeMinutes: 5,
    author: 'Karan Mehta, Architectural Advisor',
    contentHtml: `<p>The right basin mixer balances proportion, performance and the way you use the room. Start with the basin, then choose a spout that lands the water cleanly without splash.</p>
<h2>Consider the basin height and deck clearance</h2>
<p>Countertop vessel basins require a tall mixer or a wall-mounted spout to ensure adequate hand clearance. For recessed undermount basins, a standard deck-mounted mixer delivers a compact and integrated architectural profile.</p>
<blockquote>A faucet should feel effortless underhand: hydraulic balance means the lever rotates with smooth resistance and water emerges aerated and calm.</blockquote>
<h2>Finish coherence across brassware</h2>
<p>When selecting finishes like brushed gold or matte obsidian, inspect sample swatches under both daylight and warm 2700K vanity illumination to verify consistent tone across spouts, mixers, and bottle traps.</p>`,
    relatedProducts: sampleProducts,
  },
  {
    id: 'art-02',
    title: 'The quiet luxury of matte black',
    slug: 'the-quiet-luxury-of-matte-black',
    excerpt: 'Why matte black continues to shape contemporary bathrooms through tactile restraint.',
    coverImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
    category: 'Materials',
    publishedAt: '2026-10-04T10:30:00Z',
    readTimeMinutes: 4,
    author: 'Radhika Sen, Architectural Director',
    contentHtml: `<p>Matte black gives a bathroom visual weight without adding noise. Pair it with pale stone, warm timber or a single contrasting metal for a composed result.</p>
<h2>Physical Vapour Deposition vs powder coat</h2>
<p>Standard powder-coated fittings chip and wear around edges within two years. Flowtop uses multi-stage PVD molecular bonding over lead-free brass ingots, guaranteeing lifelong resistance to hard water scaling and alkaline soaps.</p>
<blockquote>Restraint is not the absence of design; it is the refusal to add visual clutter to quiet morning rituals.</blockquote>`,
    relatedProducts: sampleProducts.slice(0, 2),
  },
  {
    id: 'art-03',
    title: 'Inside the Opel collection',
    slug: 'inside-the-opel-collection',
    excerpt: 'A closer look at modern restraint and pure cylindrical transitions.',
    coverImage: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    category: 'Collections',
    publishedAt: '2026-10-03T09:15:00Z',
    readTimeMinutes: 6,
    author: 'Vikram Joshi, Head of Industrial Design',
    contentHtml: `<p>Opel began with a simple question: how little can a fitting say while still feeling complete? The answer is in its precise transitions and calm cylindrical forms.</p>
<h2>Machined from solid brass billet</h2>
<p>Rather than hollow thin-walled casting, every Opel mixer body is CNC-milled from forged brass ingots. This gives each control handle its distinctive physical heft and vibration-free fluid flow.</p>`,
    relatedProducts: sampleProducts,
  },
  {
    id: 'art-04',
    title: 'Five details that make a kitchen faucet better',
    slug: 'five-details-that-make-a-kitchen-faucet-better',
    excerpt: 'Small engineering choices that change everyday kitchen comfort and durability.',
    coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    category: 'Ideas',
    publishedAt: '2026-10-02T11:00:00Z',
    readTimeMinutes: 4,
    author: 'Karan Mehta, Architectural Advisor',
    contentHtml: `<p>A useful kitchen faucet turns around the sink, reaches the centre of the bowl and responds smoothly. Look for a reliable cartridge, sensible aeration and a finish that is easy to live with.</p>
<h2>Smooth swivel radius and spout reach</h2>
<p>A swivel spout with dual self-lubricating PTFE rings prevents play and wobbling over years of heavy daily use, landing water precisely over the sink drain.</p>`,
    relatedProducts: [],
  },
  {
    id: 'art-05',
    title: 'Designing a hotel bathroom that lasts',
    slug: 'designing-a-hotel-bathroom-that-lasts',
    excerpt: 'Performance and visual consistency for hospitality and commercial projects.',
    coverImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    category: 'Projects',
    publishedAt: '2026-10-01T14:00:00Z',
    readTimeMinutes: 7,
    author: 'Radhika Sen, Architectural Director',
    contentHtml: `<p>Hospitality bathrooms need fittings that look considered on day one and remain serviceable for years. Standardised cartridges and a clear finish family make maintenance simpler.</p>
<h2>Standardised modular cartridges</h2>
<p>When an entire hotel wing relies on the same ceramic disc cartridge specification, engineering maintenance teams can conduct scheduled servicing without ordering bespoke components.</p>`,
    relatedProducts: sampleProducts.slice(1, 3),
  },
  {
    id: 'art-06',
    title: 'Water, ritual and the Indian home',
    slug: 'water-ritual-and-the-indian-home',
    excerpt: 'The bathroom as a daily pause and architectural sanctuary.',
    coverImage: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80',
    category: 'Journal',
    publishedAt: '2026-09-28T16:00:00Z',
    readTimeMinutes: 5,
    author: 'Vikram Joshi, Head of Industrial Design',
    contentHtml: `<p>The most useful rooms are not always the loudest. Good bathfittings make the daily ritual feel effortless through touch, temperature and proportion.</p>
<h2>Tactile resonance of knurled brass</h2>
<p>Diamond-knurled dials offer immediate grip even with soapy wet hands, transforming water control into an intuitive tactile pleasure.</p>`,
    relatedProducts: sampleProducts,
  },
];

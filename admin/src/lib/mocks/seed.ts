import type { AdminProduct, Category, NavNode, Page, Placement, PublishStatus, SettingItem, Specification, Variant } from '@flowtop/types';
import type { Doc } from '@/lib/doc';

// TODO: swap for real API. Realistic Flowtop data so screens do not look like "Test Product 1".
// Everything typed from @flowtop/types is the real response shape: a field the API lacks does not compile here.
const at = (d: number) => `2026-10-${String(d).padStart(2, '0')}T04:30:00Z`;
const CATEGORIES: Record<string, { name: string; slug: string }> = {
  c1: { name: 'Basin Mixers', slug: 'basin-mixers' }, c2: { name: 'Wall Mixers', slug: 'wall-mixers' },
  c3: { name: 'Showers', slug: 'showers' }, c4: { name: 'Bib Cocks', slug: 'bib-cocks' },
};

export const seedVariants: Record<string, Variant[]> = {
  p1: [
    { id: 'v1', name: 'Chrome', skuSuffix: 'CH', price: 450000, swatchHex: '#C0C0C0', image: null, isAvailable: true, isDefault: true },
    { id: 'v2', name: 'Matte Black', skuSuffix: 'MB', price: 470000, swatchHex: '#1A1A1A', image: null, isAvailable: true, isDefault: false },
  ],
};
const spec = (id: string, group: string, name: string, value: string, unit: string | null, position: number): Specification => ({ id, group, name, value, unit, type: 'text', position });
export const seedSpecs: Record<string, Specification[]> = {
  p1: [spec('s1', 'Technical', 'Material', 'Brass', null, 1), spec('s2', 'Technical', 'Flow Rate', '5.7', 'LPM', 2)],
  p3: [spec('s3', 'Technical', 'Diameter', '300', 'mm', 1)],
};

const prod = (id: string, name: string, sku: string, price: number, cat: string, status: PublishStatus, extra: Partial<AdminProduct> = {}): AdminProduct => ({
  id, name, sku, slug: name.toLowerCase().replace(/\s+/g, '-'), categoryId: cat, shortDescription: `${name} in solid brass with a ceramic cartridge.`, fullDescription: '',
  price, salePrice: null, taxClass: 'standard', isPurchasable: true, isAvailable: true, availabilityMessage: 'Ships in 3 working days',
  isFeatured: false, isNewArrival: false, isBestseller: false, status, publishedAt: status === 'published' ? at(12) : null,
  seoTitle: '', seoDescription: '', seoCanonical: null, seoShareImageId: null, modelUrl: null, videoUrl: null, createdAt: at(1), updatedAt: at(12),
  category: { id: cat, ...CATEGORIES[cat] as { name: string; slug: string } },
  _count: { specifications: seedSpecs[id]?.length ?? 0, media: 1, variants: seedVariants[id]?.length ?? 0, placements: 0 },
  ...extra,
});

const category = (id: string, position: number): Category => ({
  id, name: CATEGORIES[id]?.name ?? id, slug: CATEGORIES[id]?.slug ?? id, description: null, parentId: null, image: null, position, status: 'published',
  seo: { title: '', description: '', canonical: null, shareImage: null }, children: [],
});
const seedCategories: Category[] = Object.keys(CATEGORIES).map((id, i) => category(id, i + 1));

export const seedProducts: AdminProduct[] = [
  prod('p1', 'Opel Basin Mixer', 'FT-OBM-001', 450000, 'c1', 'published', { salePrice: 399000 }),
  prod('p2', 'Opel Wall Mixer', 'FT-OWM-002', 620000, 'c2', 'published'),
  prod('p3', 'Rain Shower Head 300', 'FT-RSH-300', 890000, 'c3', 'published'),
  prod('p4', 'Aria Single Lever Mixer', 'FT-ASL-004', 380000, 'c1', 'draft', { _count: { specifications: 0, media: 0, variants: 0, placements: 0 } }),
  prod('p5', 'Concealed Diverter Kit', 'FT-CDK-005', 215000, 'c2', 'draft'),
  prod('p6', 'Heritage Bib Cock', 'FT-HBC-006', 145000, 'c4', 'archived'),
];

const layout = (background: string, width: string, spacing: string) => ({ background, spacingTop: spacing, spacingBottom: spacing, width, align: 'left' });
export const seedPages: Page[] = [
  { id: 'pg1', title: 'Homepage', slug: '', status: 'published', seo: { title: 'Flowtop Bathfittings', description: '', canonical: null, shareImage: null }, sections: [
    { id: 'sec1', type: 'hero', position: 1, visible: true, config: { headline: 'Crafted for water', subheading: 'Premium bathfittings from India', mediaType: 'image', desktopImageId: 'm4', mobileImageId: 'm4', overlay: 'medium', textPosition: 'bottom-left', ctas: [{ label: 'Explore', href: '/products', style: 'primary' }], layout: layout('black', 'full', 'none') } },
    { id: 'sec2', type: 'product_carousel', position: 2, visible: true, config: { heading: 'Featured Products', source: 'placement', placementLocation: 'featured', count: 8, cardStyle: 'standard', viewAllHref: '/products', layout: layout('white', 'contained', 'medium') } },
  ] },
  { id: 'pg2', title: 'Opel Launch', slug: 'opel-launch', status: 'draft', seo: { title: '', description: '', canonical: null, shareImage: null }, sections: [] },
];

export const seed: Record<string, Doc[]> = {
  categories: seedCategories.map((c) => ({ ...c })),
  collections: [
    { id: 'col1', name: 'Opel', slug: 'opel', story: '<p>Soft curves, hard-wearing finishes.</p>', heroMediaId: 'm1', productIds: ['p1', 'p2'], status: 'published' },
    { id: 'col2', name: 'Heritage', slug: 'heritage', story: '', heroMediaId: null, productIds: ['p6'], status: 'draft' },
  ],
  journal: [
    { id: 'j1', title: 'Choosing a finish that lasts', slug: 'choosing-a-finish', category: 'Guides', excerpt: 'PVD, chrome or matte: what holds up in Indian water.', body: '<p>…</p>', heroImageId: 'm4', status: 'published' },
    { id: 'j2', title: 'Inside the Rajkot foundry', slug: 'inside-the-foundry', category: 'Stories', excerpt: '', body: '', heroImageId: null, status: 'draft' },
  ],
  orders: [
    { id: 'o1', reference: 'FT-2026-00042', customerName: 'Meera Kulkarni', customerEmail: 'meera@example.com', customerPhone: '+919811100001', paymentStatus: 'paid', status: 'received', total: 399000, createdAt: at(28),
      delivery: { line1: '12 Lake View Road', line2: null, city: 'Pune', state: 'MH', pin: '411001', landmark: null, notes: null },
      items: [{ id: 'i1', name: 'Opel Basin Mixer', sku: 'FT-OBM-001-CH', finish: 'Chrome', quantity: 1, unitPrice: 399000, lineTotal: 399000 }], timeline: [{ at: at(28), status: 'received', note: 'Order placed', by: 'System' }] },
    { id: 'o2', reference: 'FT-2026-00041', customerName: 'Arjun Shetty', email: 'arjun@example.com', phone: '+919811100002', address: '8 MG Road, Mangaluru 575001', paymentStatus: 'paid', status: 'shipped', total: 1250000, createdAt: at(26),
      items: [{ name: 'Rain Shower Head 300', sku: 'FT-RSH-300', finish: 'Chrome', qty: 1, unitPrice: 890000 }, { name: 'Opel Wall Mixer', sku: 'FT-OWM-002', finish: 'Chrome', qty: 1, unitPrice: 360000 }],
      timeline: [{ at: at(26), status: 'new', note: 'Order placed', by: 'System' }, { at: at(27), status: 'shipped', note: 'Handed to courier', by: 'Asha Rao' }] },
    { id: 'o3', reference: 'FT-2026-00040', customerName: 'Divya Rao', email: 'divya@example.com', phone: '+919811100003', address: '4 Church St, Bengaluru 560001', paymentStatus: 'pending', status: 'new', total: 215000, createdAt: at(25),
      items: [{ name: 'Concealed Diverter Kit', sku: 'FT-CDK-005', finish: 'Chrome', qty: 1, unitPrice: 215000 }], timeline: [{ at: at(25), status: 'new', note: 'Order placed', by: 'System' }] },
  ],
  submissions: [
    { id: 's2', reference: 'CT-2026-0042', type: 'contact', name: 'Rahul Mehta', email: 'rahul@example.com', phone: '', city: 'Surat', message: 'Do you ship to Surat?', status: 'new', emailSent: false, createdAt: at(27) },
    { id: 's3', reference: 'DL-2026-0003', type: 'dealer', name: 'Kiran Traders', email: 'kiran@example.com', phone: '+919811100005', city: 'Hubballi', firmName: 'Kiran Traders', message: 'Showroom 1,200 sq ft, interested in franchise.', status: 'handled', emailSent: true, createdAt: at(20) },
  ],
};

export const seedPlacements: Placement[] = [
  { id: 'pl1', productId: 'p1', locationType: 'homepage_section', locationId: 'featured', locationName: 'Homepage: Featured Products', position: 1, label: 'New', enabled: true },
  { id: 'pl2', productId: 'p3', locationType: 'homepage_section', locationId: 'featured', locationName: 'Homepage: Featured Products', position: 2, label: '', enabled: true },
  { id: 'pl3', productId: 'p2', locationType: 'homepage_section', locationId: 'featured', locationName: 'Homepage: Featured Products', position: 3, label: '', enabled: true },
  { id: 'pl4', productId: 'p1', locationType: 'category', locationId: 'c1', locationName: 'Category: Basin Mixers', position: 1, label: '', enabled: true },
  { id: 'pl5', productId: 'p1', locationType: 'collection', locationId: 'col1', locationName: 'Collection: Opel', position: 1, label: '', enabled: true },
];

export const seedNav: NavNode[] = [
  { id: 'n1', label: 'Products', linkType: 'external', destination: 'https://flowtop.example/products', openInNewTab: false, children: [] },
  { id: 'n3', label: 'Collections', linkType: 'external', destination: 'https://flowtop.example/collections', openInNewTab: false, children: [] },
  { id: 'n4', label: 'Journal', linkType: 'external', destination: 'https://flowtop.example/journal', openInNewTab: false, children: [] },
];

/** Same keys, order and descriptions as backend/src/settings/setting-definitions.ts. __tests__/mock-shapes.test.ts fails if they drift. */
const setting = (key: string, value: unknown, description: string, isPublic: boolean): SettingItem => ({ key, value, description, public: isPublic, updatedBy: null, updatedAt: null });
export const seedSettings: SettingItem[] = [
  setting('email.senderName', 'Flowtop', 'The name customers see as the sender of every email', false),
  setting('email.senderAddress', null, 'The address every email is sent from. Must be on the verified sending domain.', false),
  setting('email.recipients.orders', [], 'Who is notified of every new online order', false),
  setting('email.recipients.contact', [], 'Who receives contact form enquiries', false),
  setting('email.recipients.dealer', [], 'Who receives dealer enquiries', false),
  setting('whatsapp.number', null, 'The WhatsApp number every button on the website opens. Empty hides WhatsApp.', true),
  setting('whatsapp.generalTemplate', "Hi, I'd like to know more about Flowtop products.", 'The message pre-filled by the site-wide WhatsApp button', true),
  setting('whatsapp.productTemplate', "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}", 'The message pre-filled on a product page', true),
];

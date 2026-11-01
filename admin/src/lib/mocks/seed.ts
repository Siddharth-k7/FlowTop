import type { Doc, NavNode, Page, Placement, Product } from '@/types/cms';

// TODO: swap for real API. Realistic Flowtop data so screens do not look like "Test Product 1".
const at = (d: number) => `2026-10-${String(d).padStart(2, '0')}T04:30:00Z`;
const prod = (id: string, name: string, sku: string, price: number, cat: string, status: Product['status'] = 'published', extra: Partial<Product> = {}): Product => ({
  id, name, slug: name.toLowerCase().replace(/\s+/g, '-'), sku, status, shortDescription: `${name} in solid brass with a ceramic cartridge.`,
  fullDescription: '', price, salePrice: null, isPurchasable: true, isAvailable: true, availabilityMessage: 'Ships in 3 working days',
  categoryId: cat, collectionIds: [], variants: [], specs: [], galleryIds: ['m1'], documentIds: [], seoTitle: '', seoDescription: '',
  seoCanonical: '', shareImageId: '', relatedIds: [], compatibleIds: [], beforeYouBuy: [], fitChecks: [], updatedAt: at(12), ...extra,
});
const spec = (i: string, group: string, name: string, value: string, unit = '') => ({ id: i, group, name, value, unit });

export const seed: Record<string, Doc[]> = {
  products: [
    prod('p1', 'Opel Basin Mixer', 'FT-OBM-001', 450000, 'c1', 'published', {
      salePrice: 399000, collectionIds: ['col1'], galleryIds: ['m1', 'm2'], documentIds: ['m6'], relatedIds: ['p2'], compatibleIds: ['p5'],
      beforeYouBuy: ['Check the basin has a single 35mm tap hole', 'Minimum 1 bar water pressure'], fitChecks: ['Spout reach: 120 mm', 'Hole spacing: single hole'],
      variants: [
        { id: 'v1', name: 'Chrome', skuSuffix: 'CH', price: 450000, swatchHex: '#C0C0C0', imageId: 'm1', isAvailable: true, isDefault: true },
        { id: 'v2', name: 'Matte Black', skuSuffix: 'MB', price: 470000, swatchHex: '#1A1A1A', imageId: 'm2', isAvailable: true, isDefault: false },
      ],
      specs: [spec('s1', 'Technical', 'Material', 'Brass'), spec('s2', 'Technical', 'Flow Rate', '5.7', 'LPM')],
    }),
    prod('p2', 'Opel Wall Mixer', 'FT-OWM-002', 620000, 'c2', 'published', { collectionIds: ['col1'], galleryIds: ['m5'] }),
    prod('p3', 'Rain Shower Head 300', 'FT-RSH-300', 890000, 'c3', 'published', { galleryIds: ['m3'], specs: [spec('s3', 'Technical', 'Diameter', '300', 'mm')] }),
    prod('p4', 'Aria Single Lever Mixer', 'FT-ASL-004', 380000, 'c1', 'draft', { galleryIds: [] }),
    prod('p5', 'Concealed Diverter Kit', 'FT-CDK-005', 215000, 'c2', 'draft', { galleryIds: ['m5'] }),
    prod('p6', 'Heritage Bib Cock', 'FT-HBC-006', 145000, 'c4', 'archived', { galleryIds: ['m4'] }),
  ],
  categories: [
    { id: 'c1', name: 'Basin Mixers', slug: 'basin-mixers', description: '' },
    { id: 'c2', name: 'Wall Mixers', slug: 'wall-mixers', description: '' },
    { id: 'c3', name: 'Showers', slug: 'showers', description: '' },
    { id: 'c4', name: 'Bib Cocks', slug: 'bib-cocks', description: '' },
  ],
  collections: [
    { id: 'col1', name: 'Opel', slug: 'opel', story: '<p>Soft curves, hard-wearing finishes.</p>', heroImageId: 'm1', productIds: ['p1', 'p2'], status: 'published' },
    { id: 'col2', name: 'Heritage', slug: 'heritage', story: '', heroImageId: '', productIds: ['p6'], status: 'draft' },
  ],
  pages: [
    { id: 'pg1', title: 'Homepage', slug: '', status: 'published', isCampaign: false, seoTitle: 'Flowtop Bathfittings', seoDescription: '', updatedAt: at(12), sections: [
      { id: 'sec1', type: 'hero', visible: true, config: { headline: 'Crafted for water', subheading: 'Premium bathfittings from India', mediaType: 'image', desktopImageId: 'm4', mobileImageId: 'm4', overlay: 'medium', textPosition: 'bottom-left', ctas: [{ label: 'Explore', href: '/products', style: 'primary' }], layout: { background: 'black', spacingTop: 'none', spacingBottom: 'none', width: 'full', align: 'left' } } },
      { id: 'sec2', type: 'product_carousel', visible: true, config: { heading: 'Featured Products', source: 'placement', placementLocation: 'featured', count: 8, cardStyle: 'standard', viewAllHref: '/products', layout: { background: 'white', spacingTop: 'medium', spacingBottom: 'medium', width: 'contained', align: 'left' } } },
    ] },
    { id: 'pg2', title: 'Opel Launch', slug: 'opel-launch', status: 'draft', isCampaign: true, seoTitle: '', seoDescription: '', updatedAt: at(10), sections: [] },
  ] satisfies Page[],
  journal: [
    { id: 'j1', title: 'Choosing a finish that lasts', slug: 'choosing-a-finish', category: 'Guides', excerpt: 'PVD, chrome or matte: what holds up in Indian water.', body: '<p>…</p>', coverImageId: 'm4', status: 'published' },
    { id: 'j2', title: 'Inside the Rajkot foundry', slug: 'inside-the-foundry', category: 'Stories', excerpt: '', body: '', coverImageId: '', status: 'draft' },
  ],
  orders: [
    { id: 'o1', reference: 'FT-2026-00042', customerName: 'Meera Kulkarni', email: 'meera@example.com', phone: '+919811100001', address: '12 Lake View Road, Pune 411001', paymentStatus: 'paid', status: 'new', total: 399000, createdAt: at(28),
      items: [{ name: 'Opel Basin Mixer', sku: 'FT-OBM-001-CH', finish: 'Chrome', qty: 1, unitPrice: 399000 }], timeline: [{ at: at(28), status: 'new', note: 'Order placed', by: 'System' }] },
    { id: 'o2', reference: 'FT-2026-00041', customerName: 'Arjun Shetty', email: 'arjun@example.com', phone: '+919811100002', address: '8 MG Road, Mangaluru 575001', paymentStatus: 'paid', status: 'shipped', total: 1250000, createdAt: at(26),
      items: [{ name: 'Rain Shower Head 300', sku: 'FT-RSH-300', finish: 'Chrome', qty: 1, unitPrice: 890000 }, { name: 'Opel Wall Mixer', sku: 'FT-OWM-002', finish: 'Chrome', qty: 1, unitPrice: 360000 }],
      timeline: [{ at: at(26), status: 'new', note: 'Order placed', by: 'System' }, { at: at(27), status: 'shipped', note: 'Handed to courier', by: 'Asha Rao' }] },
    { id: 'o3', reference: 'FT-2026-00040', customerName: 'Divya Rao', email: 'divya@example.com', phone: '+919811100003', address: '4 Church St, Bengaluru 560001', paymentStatus: 'pending', status: 'new', total: 215000, createdAt: at(25),
      items: [{ name: 'Concealed Diverter Kit', sku: 'FT-CDK-005', finish: 'Chrome', qty: 1, unitPrice: 215000 }], timeline: [{ at: at(25), status: 'new', note: 'Order placed', by: 'System' }] },
  ],
  submissions: [
    { id: 's1', reference: 'PA-2026-0012', type: 'purchase_assistance', name: 'Sneha Iyer', email: 'sneha@example.com', phone: '+919811100004', city: 'Chennai', message: 'Where can I see the Opel range near Adyar?', fittingInterest: 'Basin', status: 'new', emailSent: true, createdAt: at(29) },
    { id: 's2', reference: 'CT-2026-0042', type: 'contact', name: 'Rahul Mehta', email: 'rahul@example.com', phone: '', city: 'Surat', message: 'Do you ship to Surat?', fittingInterest: '', status: 'new', emailSent: false, createdAt: at(27) },
    { id: 's3', reference: 'DL-2026-0003', type: 'dealer_application', name: 'Kiran Traders', email: 'kiran@example.com', phone: '+919811100005', city: 'Hubballi', message: 'Showroom 1,200 sq ft, interested in franchise.', fittingInterest: '', status: 'handled', emailSent: true, createdAt: at(20) },
  ],
  resources: [
    { id: 'r1', title: 'Opel Installation Manual', category: 'Manuals', fileId: 'm6', productIds: ['p1'], description: '' },
    { id: 'r2', title: 'Product Catalogue 2026', category: 'Brochures', fileId: 'm6', productIds: [], description: '' },
    { id: 'r3', title: 'Opel CAD drawings', category: 'CAD / BIM', fileId: 'm6', productIds: ['p1', 'p2'], description: '' },
  ],
  inspiration: [
    { id: 'i1', title: 'Quiet luxury powder room', styleTags: ['Minimal', 'Matte black'], imageId: 'm4', hotspots: [{ productId: 'p1', x: 42, y: 55 }], status: 'draft' },
  ],
  exhibitions: [
    { id: 'x1', title: 'Index Mumbai 2027', startDate: '2027-01-14', endDate: '2027-01-17', venue: 'Bombay Exhibition Centre', hall: 'Hall 2', booth: 'B-14', coverImageId: 'm4', productIds: ['p1', 'p3'], status: 'draft' },
  ],
  faqs: [
    { id: 'f1', question: 'How do I care for a matte black finish?', answer: 'Wipe with a soft damp cloth. Avoid abrasive cleaners.', category: 'Care', productIds: [] },
    { id: 'f2', question: 'What is the warranty period?', answer: 'Flowtop products carry a 5 year warranty on the body.', category: 'Warranty', productIds: [] },
    { id: 'f3', question: 'Do you offer installation?', answer: 'Contact us on WhatsApp and we will connect you with a certified plumber.', category: 'Installation', productIds: [] },
  ],
  synonyms: [
    { id: 'sy1', term: 'faucet', mapsTo: 'mixer', featured: false },
    { id: 'sy2', term: 'tap', mapsTo: 'mixer', featured: true },
  ],
  'style-rules': [
    { id: 'st1', question: 'Where will it be fitted?', answerLabel: 'Basin', attributeKey: 'fitting_space', attributeValue: 'basin', weight: 3, order: 1 },
    { id: 'st2', question: 'What look do you like?', answerLabel: 'Modern and minimal', attributeKey: 'style', attributeValue: 'minimal', weight: 2, order: 2 },
  ],
  'finish-care': [
    { id: 'fc1', finish: 'Matte Black', story: 'A powder-coated finish with a soft, low-sheen look.', patina: 'Does not patina; may show fingerprints.', dos: ['Wipe with a soft damp cloth', 'Dry after cleaning'], donts: ['Use abrasive pads', 'Use bleach'], macroImageId: 'm2' },
    { id: 'fc2', finish: 'PVD Gold', story: 'Vacuum-deposited gold with a hard-wearing surface.', patina: 'Stays bright for years.', dos: ['Mild soap and water'], donts: ['Acidic descalers'], macroImageId: '' },
  ],
  attributes: [
    { id: 'at1', name: 'Spout Height', key: 'spout_height', type: 'number', filterable: true, unit: 'mm' },
    { id: 'at2', name: 'Mounting Type', key: 'mounting_type', type: 'choice', filterable: true, unit: '' },
    { id: 'at3', name: 'Handle Count', key: 'handles', type: 'number', filterable: false, unit: '' },
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
  { id: 'n1', label: 'Products', href: '/products', children: [{ id: 'n2', label: 'Basin Mixers', href: '/categories/basin-mixers', children: [] }] },
  { id: 'n3', label: 'Collections', href: '/collections', children: [] },
  { id: 'n4', label: 'Journal', href: '/journal', children: [] },
];

export const seedSettings: Record<string, string> = {
  emailFrom: 'orders@flowtop.in', orderRecipients: 'orders@flowtop.in', contactRecipients: 'hello@flowtop.in',
  purchaseAssistanceRecipients: 'sales@flowtop.in', dealerRecipients: 'dealers@flowtop.in',
  whatsappNumber: '+919876543210', whatsappGeneral: "Hi, I'd like to know more about Flowtop products.",
  whatsappProduct: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
};

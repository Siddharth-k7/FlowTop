import type { PrismaClient } from '../src/generated/prisma/client';

type SeedClient = PrismaClient;

const categories = [
  ['Basin Mixers', 'basin-mixers'],
  ['Pillar Cocks', 'pillar-cocks'],
  ['Bib Cocks', 'bib-cocks'],
  ['Shower Mixers', 'shower-mixers'],
  ['Kitchen Faucets', 'kitchen-faucets'],
  ['Accessories', 'accessories'],
] as const;

const collections = [
  {
    name: 'Opel', slug: 'opel', story: 'Opel is shaped by modern restraint: clean cylinders, quiet joins and proportions that let the room breathe. Every piece is made to feel considered without demanding attention.\n\nThe collection brings a calm, architectural rhythm to contemporary bathrooms. Chrome, matte black and brushed finishes make it easy to build a complete scheme with one precise visual language.',
  },
  {
    name: 'Aria', slug: 'aria', story: 'Aria takes its cue from classical Indian interiors, where detail and balance create a sense of permanence. Soft curves, generous handles and warm metallic notes make each fitting feel like part of the architecture.\n\nDesigned for homes that value ceremony as much as function, Aria pairs familiar forms with modern ceramic cartridges and dependable performance. The result is timeless rather than nostalgic.',
  },
  {
    name: 'Lumen', slug: 'lumen', story: 'Lumen is an industrial study in useful beauty. Strong silhouettes, exposed geometry and tactile finishes bring workshop character into the bathroom without sacrificing comfort.\n\nIts pieces are direct, durable and easy to specify across residential and hospitality projects. Brushed nickel and matte black let the construction become part of the room’s material story.',
  },
] as const;

const productNames = [
  ['Opel Basin Mixer', 'basin-mixers', 'OBM'], ['Opel Tall Basin Mixer', 'basin-mixers', 'OTB'], ['Opel Wall Basin Mixer', 'basin-mixers', 'OWB'],
  ['Aria Basin Mixer', 'basin-mixers', 'ABM'], ['Aria Tall Basin Mixer', 'basin-mixers', 'ATB'], ['Lumen Basin Mixer', 'basin-mixers', 'LBM'],
  ['Opel Pillar Cock Pair', 'pillar-cocks', 'OPC'], ['Aria Pillar Cock Pair', 'pillar-cocks', 'APC'], ['Lumen Pillar Cock Pair', 'pillar-cocks', 'LPC'],
  ['Opel Single Lever Pillar Cock', 'pillar-cocks', 'OSP'], ['Aria Swan Neck Pillar Cock', 'pillar-cocks', 'ASP'], ['Lumen Utility Pillar Cock', 'pillar-cocks', 'LUP'],
  ['Aria Wall Mounted Bib Cock', 'bib-cocks', 'AWB'], ['Opel Bib Cock', 'bib-cocks', 'OBC'], ['Lumen Long Body Bib Cock', 'bib-cocks', 'LLB'],
  ['Aria Angular Bib Cock', 'bib-cocks', 'AAB'], ['Opel Garden Bib Cock', 'bib-cocks', 'OGB'], ['Lumen Bib Cock with Flange', 'bib-cocks', 'LBF'],
  ['Opel Thermostatic Shower Mixer', 'shower-mixers', 'OTS'], ['Aria Exposed Shower Mixer', 'shower-mixers', 'AES'], ['Lumen Concealed Shower Mixer', 'shower-mixers', 'LCS'],
  ['Opel Diverter Shower Mixer', 'shower-mixers', 'ODM'], ['Aria Rain Shower Mixer', 'shower-mixers', 'ARS'], ['Lumen Hand Shower Mixer', 'shower-mixers', 'LHS'],
  ['Opel Kitchen Sink Mixer', 'kitchen-faucets', 'OKS'], ['Aria Kitchen Sink Mixer', 'kitchen-faucets', 'AKS'], ['Lumen Pull Out Sink Mixer', 'kitchen-faucets', 'LPS'],
  ['Opel Flexible Kitchen Faucet', 'kitchen-faucets', 'OKF'], ['Aria Swivel Kitchen Faucet', 'kitchen-faucets', 'ASK'], ['Lumen High Arc Faucet', 'kitchen-faucets', 'LHA'],
  ['Opel Robe Hook', 'accessories', 'ORH'], ['Aria Towel Ring', 'accessories', 'ATR'], ['Lumen Single Towel Bar', 'accessories', 'LST'],
  ['Opel Toilet Paper Holder', 'accessories', 'OTH'], ['Aria Shelf with Towel Bar', 'accessories', 'AST'], ['Lumen Glass Shelf', 'accessories', 'LGS'],
  ['Opel Floor Mounted Tub Filler', 'accessories', 'OFT'], ['Aria Hand Shower Set', 'accessories', 'AHS'], ['Lumen Health Faucet Set', 'accessories', 'LHF'],
  ['Opel Pop-Up Waste', 'accessories', 'OPW'],
] as const;

const finishes = [
  { name: 'Chrome', swatchHex: '#C0C0C0' },
  { name: 'Matte Black', swatchHex: '#1A1A1A' },
  { name: 'Rose Gold', swatchHex: '#B76E79' },
  { name: 'Brushed Nickel', swatchHex: '#A8A9AD' },
] as const;

const specTemplates = [
  ['Material', 'Brass', null, 'text'], ['Finish', 'Chrome', null, 'choice'], ['Installation Type', 'Deck Mounted', null, 'choice'],
  ['Dimensions', '165 x 48 x 145', 'mm', 'text'], ['Weight', '1.8', 'kg', 'number'], ['Cartridge', '35 mm ceramic', null, 'text'],
  ['Flow Rate', '5.7', 'LPM', 'number'], ['Warranty', '10', 'years', 'number'], ['Spout Reach', '120', 'mm', 'number'],
] as const;

function productStatus(index: number): 'archived' | 'draft' | 'published' {
  if (index < 3) return 'archived';
  if (index < 8) return 'draft';
  return 'published';
}

function productPrice(index: number): number {
  return 200000 + ((index * 83000) % 1300001);
}

function productSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function productSpecs(index: number): Array<{ group: string; name: string; value: string; unit: string | null; type: 'text' | 'number' | 'boolean' | 'choice'; position: number }> {
  const count = index === 9 || index === 24 || index === 37 ? 0 : 6 + (index % 5);
  return specTemplates.slice(0, count).map(([name, value, unit, type], position) => ({
    group: position < 4 ? 'Technical' : 'Performance', name, value: position === 1 ? finishes[index % finishes.length].name : value, unit, type, position,
  }));
}

function productVariants(index: number): Array<{ name: string; skuSuffix: string; priceOverride: number | null; swatchHex: string; isAvailable: boolean; isDefault: boolean; position: number }> {
  const count = 2 + (index % 3);
  return finishes.slice(0, count).map((finish, position) => ({
    name: finish.name, skuSuffix: finish.name.split(' ').map((part) => part[0]).join(''),
    priceOverride: position === 0 ? null : productPrice(index) + position * 15000,
    swatchHex: finish.swatchHex, isAvailable: !(index === 14 && position === 2), isDefault: position === 0, position,
  }));
}

export async function seedContent(prisma: SeedClient, log: (line: string) => void = () => {}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const categoryRows = new Map<string, string>();
    for (const [position, [name, slug]] of categories.entries()) {
      const category = await tx.category.upsert({
        where: { slug },
        create: { name, slug, description: `${name} designed for refined Indian bathrooms.`, position, status: 'published', seoTitle: `${name} | Flowtop`, seoDescription: `Explore Flowtop ${name.toLowerCase()} with dependable performance and premium finishes.` },
        update: { name, position, status: 'published' },
      });
      categoryRows.set(slug, category.id);
    }

    const collectionRows = new Map<string, string>();
    for (const [position, collection] of collections.entries()) {
      const row = await tx.collection.upsert({
        where: { slug: collection.slug },
        create: { ...collection, position, status: 'published', seoTitle: `${collection.name} Collection | Flowtop`, seoDescription: `Discover the ${collection.name} bathfittings collection by Flowtop.` },
        update: { ...collection, position, status: 'published' },
      });
      collectionRows.set(collection.slug, row.id);
    }

    const productRows: Array<{ id: string; index: number }> = [];
    for (const [index, [name, categorySlug, code]] of productNames.entries()) {
      const sku = `FT-${code}-${String(index + 1).padStart(3, '0')}`;
      const status = productStatus(index);
      const product = await tx.product.upsert({
        where: { sku },
        create: { name, sku, slug: productSlug(name), categoryId: categoryRows.get(categorySlug), shortDescription: `${name} with a balanced silhouette and smooth everyday control.`, fullDescription: `<p>${name} brings Flowtop precision to a considered bathroom scheme.</p>`, price: productPrice(index), salePrice: index % 7 === 0 ? productPrice(index) - 25000 : null, isPurchasable: ![4, 11, 19, 27, 34].includes(index), isAvailable: index !== 31, availabilityMessage: index === 31 ? 'Available on request' : 'Ships in 3 working days', isFeatured: index % 6 === 0, isNewArrival: index % 5 === 0, isBestseller: index % 7 === 0, status, publishedAt: status === 'published' ? new Date('2026-10-01T00:00:00Z') : null, seoTitle: `${name} | Flowtop`, seoDescription: `Shop the ${name} from Flowtop premium bathfittings.`, seoCanonical: null },
        update: { name, categoryId: categoryRows.get(categorySlug), status, isPurchasable: ![4, 11, 19, 27, 34].includes(index), isAvailable: index !== 31, publishedAt: status === 'published' ? new Date('2026-10-01T00:00:00Z') : null },
      });
      productRows.push({ id: product.id, index });
      await tx.variant.deleteMany({ where: { productId: product.id } });
      await tx.variant.createMany({ data: productVariants(index).map((variant) => ({ ...variant, productId: product.id })) });
      await tx.specification.deleteMany({ where: { productId: product.id } });
      const specs = productSpecs(index);
      if (specs.length) await tx.specification.createMany({ data: specs.map((spec) => ({ ...spec, productId: product.id })) });
    }

    for (const [collectionIndex, collection] of collections.entries()) {
      const collectionId = collectionRows.get(collection.slug);
      if (!collectionId) continue;
      await tx.collectionProduct.deleteMany({ where: { collectionId } });
      const selected = productRows.filter(({ index }) => index % collections.length === collectionIndex).slice(0, 8);
      await tx.collectionProduct.createMany({ data: selected.map(({ id }, position) => ({ collectionId, productId: id, position })) });
    }

    const homepage = await tx.page.upsert({ where: { slug: '' }, create: { title: 'Flowtop Homepage', slug: '', template: 'default', status: 'published', publishedAt: new Date('2026-10-01T00:00:00Z'), seoTitle: 'Premium Bathfittings for Modern Indian Homes | Flowtop', seoDescription: 'Explore Flowtop premium bathfittings, designed in India for beautiful everyday rituals.' }, update: { title: 'Flowtop Homepage', status: 'published', publishedAt: new Date('2026-10-01T00:00:00Z') } });
    await tx.section.deleteMany({ where: { pageId: homepage.id } });
    await tx.section.createMany({ data: [
      { pageId: homepage.id, type: 'hero', position: 0, visible: true, config: { headline: 'The art of everyday water', subheading: 'Premium bathfittings designed for considered Indian homes.', mediaType: 'image', desktopImageId: null, mobileImageId: null, videoUrl: null, overlay: 'medium', textPosition: 'bottom-left', ctas: [{ label: 'Explore collections', href: '/collections', style: 'primary' }], layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'left' } } },
      { pageId: homepage.id, type: 'product_carousel', position: 1, visible: true, config: { heading: 'Featured products', source: 'placement', placementLocation: 'featured', productIds: [], rule: null, count: 8, cardStyle: 'standard', viewAllHref: '/products', layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' } } },
      { pageId: homepage.id, type: 'collection_showcase', position: 2, visible: true, config: { collectionId: collectionRows.get('opel'), coverImageId: null, description: 'Quiet geometry for modern spaces.', productIds: [], variant: 'split', layout: { background: 'pale', spacingTop: 'medium', spacingBottom: 'medium', width: 'wide', align: 'left' } } },
      { pageId: homepage.id, type: 'image_text', position: 3, visible: true, config: { heading: 'Made for the Indian ritual', body: '<p>Thoughtful proportions, dependable cartridges and finishes that age beautifully.</p>', imageId: null, mobileImageId: null, imageSide: 'right', ratio: '50-50', mobileOrder: 'image-first', cta: { label: 'Why Flowtop', href: '/about' }, layout: { background: 'white', spacingTop: 'medium', spacingBottom: 'medium', width: 'contained', align: 'left' } } },
      { pageId: homepage.id, type: 'cta', position: 4, visible: true, config: { heading: 'Find your finish', body: 'Build a bathroom with a point of view.', mode: 'button', cta: { label: 'View all products', href: '/products' }, documentId: null, layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' } } },
    ] });

    await tx.navigationItem.deleteMany({});
    const headerItems = [
      { label: 'Products', linkType: 'external' as const, destination: '/products', position: 0 },
      { label: 'Collections', linkType: 'external' as const, destination: '/collections', position: 1 },
      { label: 'Journal', linkType: 'external' as const, destination: '/journal', position: 2 },
    ];
    for (const item of headerItems) await tx.navigationItem.create({ data: { ...item, menu: 'header' } });
    await tx.navigationItem.createMany({ data: [
      { menu: 'footer', label: 'About Flowtop', linkType: 'external', destination: '/about', position: 0 },
      { menu: 'footer', label: 'Contact', linkType: 'external', destination: '/contact', position: 1 },
      { menu: 'footer', label: 'Instagram', linkType: 'external', destination: 'https://instagram.com/flowtop', openInNewTab: true, position: 2 },
    ] });

    const articles = [
      ['How to choose a basin mixer', 'Buying Guide', 'A considered guide to height, reach and finish.', 'The right basin mixer balances proportion, performance and the way you use the room. Start with the basin, then choose a spout that lands the water cleanly without splash.'],
      ['The quiet luxury of matte black', 'Materials', 'Why matte black continues to shape contemporary bathrooms.', 'Matte black gives a bathroom visual weight without adding noise. Pair it with pale stone, warm timber or a single contrasting metal for a composed result.'],
      ['Inside the Opel collection', 'Collections', 'A closer look at modern restraint.', 'Opel began with a simple question: how little can a fitting say while still feeling complete? The answer is in its precise transitions and calm cylindrical forms.'],
      ['Five details that make a kitchen faucet better', 'Ideas', 'Small choices that change everyday comfort.', 'A useful kitchen faucet turns around the sink, reaches the centre of the bowl and responds smoothly. Look for a reliable cartridge, sensible aeration and a finish that is easy to live with.'],
      ['Designing a hotel bathroom that lasts', 'Projects', 'Performance and visual consistency for hospitality.', 'Hospitality bathrooms need fittings that look considered on day one and remain serviceable for years. Standardised cartridges and a clear finish family make maintenance simpler.'],
      ['Water, ritual and the Indian home', 'Journal', 'The bathroom as a daily pause.', 'The most useful rooms are not always the loudest. Good bathfittings make the daily ritual feel effortless through touch, temperature and proportion.'],
    ] as const;
    for (const [index, [title, category, excerpt, body]] of articles.entries()) {
      const article = await tx.journalArticle.upsert({ where: { slug: productSlug(title) }, create: { title, slug: productSlug(title), category, excerpt, body: `<p>${body}</p>`, status: index < 5 ? 'published' : 'draft', publishedAt: index < 5 ? new Date('2026-10-05T00:00:00Z') : null, seoTitle: `${title} | Flowtop`, seoDescription: excerpt }, update: { title, category, excerpt, body, status: index < 5 ? 'published' : 'draft', publishedAt: index < 5 ? new Date('2026-10-05T00:00:00Z') : null } });
      const related = productRows.filter(({ index: productIndex }) => productIndex % 6 === index).slice(0, 3);
      await tx.articleProduct.deleteMany({ where: { articleId: article.id } });
      if (related.length) await tx.articleProduct.createMany({ data: related.map(({ id }, position) => ({ articleId: article.id, productId: id, position })) });
    }
    log(`content seed: ${categoryRows.size} categories, ${collectionRows.size} collections, ${productRows.length} products, ${articles.length} journal articles, 5 homepage sections`);
  });
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, PublishStatus as PrismaPublishStatus, SpecificationType as PrismaSpecificationType } from '../generated/prisma/client';
import type {
  Category as PrismaCategory,
  Collection as PrismaCollection,
  MediaAsset as PrismaMediaAsset,
  Product as PrismaProduct,
  ProductDocument as PrismaProductDocument,
  Specification as PrismaSpecification,
  Variant as PrismaVariant,
} from '../generated/prisma/client';
import type {
  Category,
  Collection,
  CollectionDetail,
  Finish,
  GalleryImage,
  ImageRef,
  MediaAsset,
  ProductCard,
  ProductDetail,
  ProductDocument,
  PublishStatus,
  Seo,
  Specification,
  SpecificationGroup,
  SpecificationItem,
  SpecificationType,
  Variant,
} from '../../../shared/types/src/index';

/**
 * Guards the product catalogue types in shared/types against the two things
 * they are written from: docs/03-api-contract.md (field names and shapes) and
 * prisma/schema.prisma (value types, nullability, enums).
 *
 * Same approach as src/auth/shared-types.drift.spec.ts: shared/types is
 * type-only, so each shape is mirrored here as a value, the mirror is locked
 * to the type at compile time, and runtime assertions compare the mirror to
 * the truth. Tests may import shared/: they are not part of the Docker image.
 *
 * Four things fail this file:
 *   1. A shared field whose type or nullability differs from its Prisma column.
 *   2. A shared shape whose keys differ from the contract's JSON example.
 *   3. A Prisma column that is neither exposed by a shared type nor listed in
 *      NOT_EXPOSED with a reason. Adding a column forces a decision.
 *   4. An enum value added or removed on one side only.
 */

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** A value with exactly the keys of T, recursively. Arrays hold one element, nullable parts are unwrapped. */
type Shape<T> = T extends readonly (infer U)[] ? [Shape<NonNullable<U>>] : T extends object ? { [K in keyof T]-?: Shape<NonNullable<T[K]>> } : true;

// ─── 1. Value types and nullability against Prisma ─────────────────────────

type _productCardScalars = Expect<
  Equal<
    Pick<ProductCard, 'id' | 'name' | 'slug' | 'sku' | 'price' | 'salePrice' | 'isPurchasable' | 'isAvailable'>,
    Pick<PrismaProduct, 'id' | 'name' | 'slug' | 'sku' | 'price' | 'salePrice' | 'isPurchasable' | 'isAvailable'>
  >
>;
type _productDetailScalars = Expect<
  Equal<
    Pick<
      ProductDetail,
      'id' | 'name' | 'slug' | 'sku' | 'shortDescription' | 'fullDescription' | 'price' | 'salePrice' | 'isPurchasable' | 'isAvailable' | 'availabilityMessage'
    >,
    Pick<
      PrismaProduct,
      'id' | 'name' | 'slug' | 'sku' | 'shortDescription' | 'fullDescription' | 'price' | 'salePrice' | 'isPurchasable' | 'isAvailable' | 'availabilityMessage'
    >
  >
>;
type _variantScalars = Expect<
  Equal<
    Pick<Variant, 'id' | 'name' | 'skuSuffix' | 'swatchHex' | 'isAvailable' | 'isDefault'>,
    Pick<PrismaVariant, 'id' | 'name' | 'skuSuffix' | 'swatchHex' | 'isAvailable' | 'isDefault'>
  >
>;
/** The resolved price is a number even though the column it comes from can be null. */
type _variantPrice = Expect<Equal<Variant['price'], NonNullable<PrismaVariant['priceOverride']>>>;
type _finishScalars = Expect<Equal<Pick<Finish, 'id' | 'name' | 'swatchHex'>, Pick<PrismaVariant, 'id' | 'name' | 'swatchHex'>>>;
type _specificationScalars = Expect<
  Equal<
    Pick<Specification, 'id' | 'group' | 'name' | 'value' | 'unit' | 'type' | 'position'>,
    Pick<PrismaSpecification, 'id' | 'group' | 'name' | 'value' | 'unit' | 'type' | 'position'>
  >
>;
type _specificationItemScalars = Expect<Equal<SpecificationItem, Pick<PrismaSpecification, 'name' | 'value' | 'unit'>>>;
type _specificationGroupKey = Expect<Equal<SpecificationGroup['group'], PrismaSpecification['group']>>;
type _categoryScalars = Expect<
  Equal<
    Pick<Category, 'id' | 'name' | 'slug' | 'description' | 'parentId' | 'position' | 'status'>,
    Pick<PrismaCategory, 'id' | 'name' | 'slug' | 'description' | 'parentId' | 'position' | 'status'>
  >
>;
type _categoryChildren = Expect<Equal<Category['children'], Category[]>>;
type _collectionScalars = Expect<
  Equal<
    Pick<Collection, 'id' | 'name' | 'slug' | 'description' | 'story' | 'position' | 'status'>,
    Pick<PrismaCollection, 'id' | 'name' | 'slug' | 'description' | 'story' | 'position' | 'status'>
  >
>;
type _collectionDetailProducts = Expect<Equal<CollectionDetail['products'], ProductCard[]>>;
type _documentScalars = Expect<Equal<Pick<ProductDocument, 'name'>, Pick<PrismaProductDocument, 'name'>>>;
type _documentSize = Expect<Equal<ProductDocument['sizeBytes'], PrismaMediaAsset['sizeBytes']>>;
type _imageRef = Expect<Equal<ImageRef['alt'], PrismaMediaAsset['altText']>>;
type _galleryImage = Expect<Equal<Pick<GalleryImage, 'width' | 'height'>, Pick<PrismaMediaAsset, 'width' | 'height'>>>;
/** ImageRef and GalleryImage are cut from the shared MediaAsset, so they cannot name a field it lacks. */
type _imageFromMediaAsset = Expect<
  Equal<[ImageRef, GalleryImage], [Pick<MediaAsset, 'id' | 'url' | 'alt'>, Pick<MediaAsset, 'id' | 'url' | 'alt' | 'width' | 'height'>]>
>;
type _seoCanonical = Expect<Equal<Seo['canonical'], PrismaProduct['seoCanonical']>>;
type _seoTitle = Expect<Equal<Seo['title'], PrismaProduct['seoTitle']>>;
type _seoDescription = Expect<Equal<Seo['description'], PrismaProduct['seoDescription']>>;
type _publishStatus = Expect<Equal<PublishStatus, PrismaPublishStatus>>;
type _specificationType = Expect<Equal<SpecificationType, PrismaSpecificationType>>;
/** Product, Category and Collection share one status enum. */
type _statusSharedByAll = Expect<Equal<[PrismaProduct['status'], PrismaCategory['status'], PrismaCollection['status']], [PublishStatus, PublishStatus, PublishStatus]>>;

const typeChecks: [
  _productCardScalars,
  _productDetailScalars,
  _variantScalars,
  _variantPrice,
  _finishScalars,
  _specificationScalars,
  _specificationItemScalars,
  _specificationGroupKey,
  _categoryScalars,
  _categoryChildren,
  _collectionScalars,
  _collectionDetailProducts,
  _documentScalars,
  _documentSize,
  _imageRef,
  _galleryImage,
  _imageFromMediaAsset,
  _seoCanonical,
  _seoTitle,
  _seoDescription,
  _publishStatus,
  _specificationType,
  _statusSharedByAll,
] = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

// ─── 2. Keys against the contract ──────────────────────────────────────────
// Each mirror is typed Shape<T>, so a key added to or removed from the shared
// type fails to compile here until the mirror matches.

const IMAGE_REF: Shape<ImageRef> = { id: true, url: true, alt: true };
const FINISH: Shape<Finish> = { id: true, name: true, swatchHex: true };
const CATEGORY_REF: Shape<ProductCard['category']> = { id: true, name: true, slug: true };
const SEO: Shape<Seo> = { title: true, description: true, canonical: true, shareImage: { url: true } };

const PRODUCT_CARD: Shape<ProductCard> = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  salePrice: true,
  isPurchasable: true,
  isAvailable: true,
  primaryImage: IMAGE_REF,
  hoverImage: IMAGE_REF,
  finishes: [FINISH],
  badge: true,
  category: CATEGORY_REF,
};

const VARIANT: Shape<Variant> = {
  id: true,
  name: true,
  skuSuffix: true,
  price: true,
  swatchHex: true,
  image: IMAGE_REF,
  isAvailable: true,
  isDefault: true,
};

const SPECIFICATION_GROUP: Shape<SpecificationGroup> = { group: true, items: [{ name: true, value: true, unit: true }] };

const PRODUCT_DOCUMENT: Shape<ProductDocument> = { id: true, name: true, url: true, sizeBytes: true };

const PRODUCT_DETAIL: Shape<ProductDetail> = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  shortDescription: true,
  fullDescription: true,
  price: true,
  salePrice: true,
  isPurchasable: true,
  isAvailable: true,
  availabilityMessage: true,
  category: CATEGORY_REF,
  collections: [{ id: true, name: true, slug: true }],
  variants: [VARIANT],
  specifications: [SPECIFICATION_GROUP],
  gallery: [{ id: true, url: true, alt: true, width: true, height: true }],
  documents: [PRODUCT_DOCUMENT],
  seo: SEO,
};

/** The contract defines no JSON for these three. Their shape comes from the schema, and is pinned by section 3. */
const SPECIFICATION: Shape<Specification> = { id: true, group: true, name: true, value: true, unit: true, type: true, position: true };
const CATEGORY: Shape<Omit<Category, 'children'>> = {
  id: true,
  name: true,
  slug: true,
  description: true,
  parentId: true,
  image: IMAGE_REF,
  position: true,
  status: true,
  seo: SEO,
};
const COLLECTION: Shape<Collection> = {
  id: true,
  name: true,
  slug: true,
  description: true,
  story: true,
  image: IMAGE_REF,
  heroImage: IMAGE_REF,
  position: true,
  status: true,
  seo: SEO,
};

const contractDoc = readFileSync(join(__dirname, '..', '..', '..', 'docs', '03-api-contract.md'), 'utf8').replace(/\r\n/g, '\n');

/** The first ```json block after the bold heading, parsed. */
function contractExample(heading: string): unknown {
  const start = contractDoc.indexOf(`**${heading}**`);
  if (start === -1) {
    throw new Error(`docs/03-api-contract.md has no "**${heading}**" heading`);
  }
  const open = contractDoc.indexOf('```json\n', start);
  const body = contractDoc.slice(open + '```json\n'.length, contractDoc.indexOf('\n```', open));
  return JSON.parse(body) as unknown;
}

/** Reduces a JSON example to its keys: arrays to their first element, every leaf to true. */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [shapeOf(value[0])];
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shapeOf(inner)]));
  }
  return true;
}

// ─── 3. Prisma columns ─────────────────────────────────────────────────────
// Every column is either exposed (the value is where the shared type carries it)
// or not exposed (the value is why). A new column fails until someone decides.

const EXPOSED = {
  Product: {
    id: 'ProductDetail.id',
    name: 'ProductDetail.name',
    sku: 'ProductDetail.sku',
    slug: 'ProductDetail.slug',
    categoryId: 'ProductDetail.category',
    shortDescription: 'ProductDetail.shortDescription',
    fullDescription: 'ProductDetail.fullDescription',
    price: 'ProductDetail.price',
    salePrice: 'ProductDetail.salePrice',
    isPurchasable: 'ProductDetail.isPurchasable',
    isAvailable: 'ProductDetail.isAvailable',
    availabilityMessage: 'ProductDetail.availabilityMessage',
    seoTitle: 'ProductDetail.seo.title',
    seoDescription: 'ProductDetail.seo.description',
    seoCanonical: 'ProductDetail.seo.canonical',
    seoShareImageId: 'ProductDetail.seo.shareImage',
  },
  Variant: {
    id: 'Variant.id',
    name: 'Variant.name',
    skuSuffix: 'Variant.skuSuffix',
    priceOverride: 'Variant.price',
    swatchHex: 'Variant.swatchHex',
    imageId: 'Variant.image',
    isAvailable: 'Variant.isAvailable',
    isDefault: 'Variant.isDefault',
  },
  Specification: {
    id: 'Specification.id',
    group: 'Specification.group',
    name: 'Specification.name',
    value: 'Specification.value',
    unit: 'Specification.unit',
    type: 'Specification.type',
    position: 'Specification.position',
  },
  Category: {
    id: 'Category.id',
    name: 'Category.name',
    slug: 'Category.slug',
    description: 'Category.description',
    parentId: 'Category.parentId',
    imageId: 'Category.image',
    position: 'Category.position',
    status: 'Category.status',
    seoTitle: 'Category.seo.title',
    seoDescription: 'Category.seo.description',
    seoCanonical: 'Category.seo.canonical',
    seoShareImageId: 'Category.seo.shareImage',
  },
  Collection: {
    id: 'Collection.id',
    name: 'Collection.name',
    slug: 'Collection.slug',
    description: 'Collection.description',
    story: 'Collection.story',
    imageId: 'Collection.image',
    heroMediaId: 'Collection.heroImage',
    position: 'Collection.position',
    status: 'Collection.status',
    seoTitle: 'Collection.seo.title',
    seoDescription: 'Collection.seo.description',
    seoCanonical: 'Collection.seo.canonical',
    seoShareImageId: 'Collection.seo.shareImage',
  },
  ProductDocument: {
    mediaAssetId: 'ProductDocument.id',
    name: 'ProductDocument.name',
  },
} as const;

const NOT_EXPOSED = {
  Product: {
    taxClass: 'checkout concern, not on any product page in the contract',
    isFeatured: 'a hint for rule-based sections, never shown',
    isNewArrival: 'a hint for rule-based sections, never shown',
    isBestseller: 'a hint for rule-based sections, never shown',
    status: 'public reads return published products only; the admin product shape is not in the contract yet',
    publishedAt: 'not in the contract',
    modelUrl: 'deferred: 3D viewer',
    videoUrl: 'deferred: product video',
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
  Variant: {
    productId: 'the variant is nested in its product',
    position: 'array order carries it',
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
  Specification: {
    productId: 'the row is under /admin/products/:id/specifications',
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
  Category: {
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
  Collection: {
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
  ProductDocument: {
    productId: 'the document is nested in its product',
    position: 'array order carries it',
    createdAt: 'not in the contract',
    updatedAt: 'not in the contract',
  },
} as const;

const SHAPES: Record<string, unknown> = {
  ProductCard: PRODUCT_CARD,
  ProductDetail: PRODUCT_DETAIL,
  Variant: VARIANT,
  Specification: SPECIFICATION,
  Category: CATEGORY,
  Collection: COLLECTION,
  ProductDocument: PRODUCT_DOCUMENT,
};

/** Walks 'ProductDetail.seo.shareImage' through the mirrors, stepping into arrays. */
function resolves(path: string): boolean {
  let node: unknown = SHAPES;
  for (const segment of path.split('.')) {
    while (Array.isArray(node)) {
      node = node[0];
    }
    if (node === null || typeof node !== 'object' || !(segment in node)) {
      return false;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  return true;
}

const columnsOf = (model: string): string[] => Object.keys(Prisma[`${model}ScalarFieldEnum` as 'ProductScalarFieldEnum']).sort();
const sorted = (values: readonly string[]): string[] => [...values].sort();

describe('shared/types product catalogue drift', () => {
  it('typechecks every shared field against its Prisma column', () => {
    expect(typeChecks.every(Boolean)).toBe(true);
  });

  it('gives ProductCard the keys the contract example has', () => {
    expect(PRODUCT_CARD).toEqual(shapeOf(contractExample('ProductCard')));
  });

  it('gives ProductDetail the keys the contract example has', () => {
    expect(PRODUCT_DETAIL).toEqual(shapeOf(contractExample('ProductDetail')));
  });

  it.each(Object.keys(EXPOSED))('accounts for every %s column, exposed or deliberately not', (model) => {
    const exposed = Object.keys(EXPOSED[model as keyof typeof EXPOSED]);
    const hidden = Object.keys(NOT_EXPOSED[model as keyof typeof NOT_EXPOSED]);

    expect(sorted([...exposed, ...hidden])).toEqual(columnsOf(model));
    expect(exposed.filter((column) => hidden.includes(column))).toEqual([]);
  });

  it.each(Object.entries(EXPOSED).flatMap(([model, columns]) => Object.entries(columns).map(([column, path]) => [`${model}.${column}`, path])))(
    'carries %s in the shared type at %s',
    (_column, path) => {
      expect(resolves(path)).toBe(true);
    },
  );

  it('matches the Prisma enums value for value', () => {
    const SHARED_PUBLISH_STATUS = { draft: 1, published: 1, unpublished: 1, archived: 1 } satisfies Record<PublishStatus, 1>;
    const SHARED_SPECIFICATION_TYPE = { text: 1, number: 1, boolean: 1, choice: 1 } satisfies Record<SpecificationType, 1>;

    expect(sorted(Object.keys(SHARED_PUBLISH_STATUS))).toEqual(sorted(Object.values(PrismaPublishStatus)));
    expect(sorted(Object.keys(SHARED_SPECIFICATION_TYPE))).toEqual(sorted(Object.values(PrismaSpecificationType)));
  });
});

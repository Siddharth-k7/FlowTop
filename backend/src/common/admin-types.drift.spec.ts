import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Prisma,
  PlacementLocationType as PrismaPlacementLocationType,
  SectionType as PrismaSectionType,
} from '../generated/prisma/client';
import type { Placement as PrismaPlacement, Product as PrismaProduct, Section as PrismaSection } from '../generated/prisma/client';
import type { SettingItem as BackendSettingItem } from '../settings/dto/settings.dto';
import type {
  AdminProduct,
  Page,
  Placement,
  PlacementLocationType,
  SettingItem,
  Section,
} from '../../../shared/types/src/index';

/**
 * Guards the admin types in shared/types (AdminProduct, Placement, Section, Page, SettingItem)
 * against what they are written from: prisma/schema.prisma, the settings DTO and
 * docs/03-api-contract.md. Same approach as catalog-types.drift.spec.ts.
 *
 * Four things fail this file:
 *   1. A shared field whose type or nullability differs from its Prisma column.
 *   2. A Prisma column that AdminProduct neither carries nor is listed as not exposed.
 *   3. A shared shape whose keys differ from the contract's JSON example.
 *   4. An enum value added or removed on one side only.
 */

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Shape<T> = T extends readonly (infer U)[] ? [Shape<NonNullable<U>>] : T extends object ? { [K in keyof T]-?: Shape<NonNullable<T[K]>> } : true;

// ─── 1. Value types and nullability ────────────────────────────────────────

type DatesAsStrings<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
type ProductColumns = Exclude<keyof AdminProduct, 'category' | '_count'>;
/** AdminProduct is the Prisma row as JSON: the same columns, dates as ISO strings. */
type _adminProductIsTheRow = Expect<Equal<Pick<AdminProduct, ProductColumns>, DatesAsStrings<PrismaProduct>>>;
type _settingItem = Expect<Equal<SettingItem, BackendSettingItem>>;
type _placementScalars = Expect<
  Equal<Pick<Placement, 'id' | 'productId' | 'locationType' | 'locationId' | 'position' | 'enabled'>, Pick<PrismaPlacement, 'id' | 'productId' | 'locationType' | 'locationId' | 'position' | 'enabled'>>
>;
/** The contract's `label` is a string; the column is nullable, and the API returns "" for null. */
type _placementLabel = Expect<Equal<NonNullable<PrismaPlacement['label']>, Placement['label']>>;
type _sectionScalars = Expect<Equal<Pick<Section, 'id' | 'position' | 'visible'>, Pick<PrismaSection, 'id' | 'position' | 'visible'>>>;
type _locationType = Expect<Equal<PlacementLocationType, PrismaPlacementLocationType>>;

const typeChecks: [_adminProductIsTheRow, _settingItem, _placementScalars, _placementLabel, _sectionScalars, _locationType] = [true, true, true, true, true, true];

// ─── 2. Keys against the contract ──────────────────────────────────────────

const PRODUCT: Shape<Omit<AdminProduct, 'category' | '_count'>> = {
  id: true, name: true, sku: true, slug: true, categoryId: true, shortDescription: true, fullDescription: true, price: true, salePrice: true, taxClass: true,
  isPurchasable: true, isAvailable: true, availabilityMessage: true, isFeatured: true, isNewArrival: true, isBestseller: true, status: true, publishedAt: true,
  seoTitle: true, seoDescription: true, seoCanonical: true, seoShareImageId: true, modelUrl: true, videoUrl: true, createdAt: true, updatedAt: true,
};
const PLACEMENT: Shape<Placement> = { id: true, productId: true, locationType: true, locationId: true, locationName: true, position: true, label: true, enabled: true };
const SECTION: Shape<Section> = { id: true, type: true, position: true, visible: true, config: {} };
const PAGE: Shape<Page> = { id: true, title: true, slug: true, status: true, sections: [SECTION], seo: { title: true, description: true, canonical: true, shareImage: { url: true } } };

const contractDoc = readFileSync(join(__dirname, '..', '..', '..', 'docs', '03-api-contract.md'), 'utf8').replace(/\r\n/g, '\n');

/** The first ```json block after the bold heading, parsed. `{ ... }` placeholders in the contract become `{}`. */
function contractExample(heading: string): unknown {
  const start = contractDoc.indexOf(`**${heading}**`);
  if (start === -1) throw new Error(`docs/03-api-contract.md has no "**${heading}**" heading`);
  const open = contractDoc.indexOf('```json\n', start);
  const body = contractDoc.slice(open + '```json\n'.length, contractDoc.indexOf('\n```', open));
  return JSON.parse(body.replace(/\{ \.\.\. \}/g, '{}').replace(/\[ Section \]/g, '[]')) as unknown;
}

/** Keys of an example: arrays to their first element, every leaf to true. `depth` stops the walk, for parts the contract leaves open. */
function shapeOf(value: unknown, depth = 9): unknown {
  if (Array.isArray(value)) return [shapeOf(value[0], depth)];
  if (value !== null && typeof value === 'object') {
    return depth === 0 ? true : Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shapeOf(inner, depth - 1)]));
  }
  return true;
}

/** Prisma columns AdminProduct does not carry. Empty on purpose: the admin sees the whole row. */
const NOT_EXPOSED: string[] = [];
const columns = Object.keys(Prisma.ProductScalarFieldEnum).sort();

describe('shared/types admin drift', () => {
  it('typechecks every admin field against its Prisma column and the backend DTO', () => {
    expect(typeChecks.every(Boolean)).toBe(true);
  });

  it('gives AdminProduct every Prisma Product column, and no other', () => {
    expect([...Object.keys(PRODUCT), ...NOT_EXPOSED].sort()).toEqual(columns);
  });

  it('gives Placement the keys the contract example has', () => {
    expect(PLACEMENT).toEqual(shapeOf(contractExample('Placement:')));
  });

  it('gives Section the keys the contract example has', () => {
    // `config` differs per type; its shapes are checked by the section-type test below.
    expect(Object.keys(SECTION).sort()).toEqual(Object.keys(contractExample('Section:') as object).sort());
  });

  it('gives Page the keys the contract example has', () => {
    // The contract leaves `seo` as `{ ... }`; its keys are the shared Seo type, pinned in catalog-types.drift.spec.ts.
    expect(Object.keys(PAGE).sort()).toEqual(Object.keys(contractExample('Page:') as object).sort());
  });

  it('lists the placement location types the contract lists', () => {
    const line = contractDoc.split('\n').find((l) => l.startsWith('`locationType`:')) ?? '';
    const listed = [...line.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]).sort();
    expect(listed).toEqual(Object.values(PrismaPlacementLocationType).sort());
  });

  it('lists the six section types the contract documents', () => {
    const documented = [...contractDoc.matchAll(/^\/\/ ([a-z_]+)\n\{/gm)].map((m) => m[1]).sort();
    expect(documented).toEqual(Object.values(PrismaSectionType).sort());
  });
});

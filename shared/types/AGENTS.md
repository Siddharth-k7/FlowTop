# shared/types

Type-only API shapes for the frontend and the admin. No values, no imports, no dependencies. Import from `@flowtop/types` (`"@flowtop/types": "file:../shared/types"` in the app's package.json).

`backend/src` must not import this folder: the API image is built from `backend/` alone. The backend owns the truth, and a backend test fails when this folder drifts from it.

| Types | Source of truth | Drift test |
|---|---|---|
| `Permission`, `RoleName`, `ROLE_PERMISSIONS`, `User` | `backend/src/auth/permissions.ts`, `auth-user.ts` | `backend/src/auth/shared-types.drift.spec.ts` |
| `ProductCard`, `ProductDetail`, `Variant`, `Specification`, `SpecificationGroup`, `Category`, `Collection`, `CollectionDetail`, and their parts | `docs/03-api-contract.md` for names and shapes, `backend/prisma/schema.prisma` for value types, nullability and enums | `backend/src/common/catalog-types.drift.spec.ts` |

## Product catalogue

Published before Dev B writes the endpoints, so Dev C and Dev D can build against them now. The endpoints return exactly these shapes. If a shape is wrong, change it here and in the contract in one pull request that Dev A, B, C and D review. Do not copy a type into your app to work around it.

- Money is integer paise. `price`, `salePrice` and `Variant.price` are numbers.
- `Variant.price` is already resolved (override applied). Do not compute it.
- `ProductDetail.variants` is `[]` when a product has no finishes, never null.
- `ProductDetail.specifications` is grouped (`SpecificationGroup[]`) and never has an empty value. `Specification` is the flat row the admin reads and writes.
- Images, `category` and `swatchHex` can be null, because the database allows it: a product may have no photo yet. Handle null.
- `ProductCard.badge` is null outside a placement context.

This example is typechecked as written by `backend/src/common/shared-types.agents.spec.ts`:

<!-- example: catalog -->
```ts
import type { Paginated, ProductCard, ProductDetail, SpecificationGroup } from '@flowtop/types';

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

/** The price to show: the sale price when there is one. */
export function priceOf(product: Pick<ProductCard, 'price' | 'salePrice'>): string {
  return formatPaise(product.salePrice ?? product.price);
}

/** A card can have no photo yet. The type says so. */
export function imageUrlOf(card: ProductCard): string | null {
  return card.primaryImage?.url ?? null;
}

export function cardsOf(page: Paginated<ProductCard>): ProductCard[] {
  return page.data;
}

export function defaultFinish(product: ProductDetail): string | null {
  return product.variants.find((variant) => variant.isDefault)?.name ?? null;
}

export function specificationGroups(product: ProductDetail): SpecificationGroup[] {
  return product.specifications;
}
```

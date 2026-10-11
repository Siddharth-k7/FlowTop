# Conventions

How we name things, where files go, and the patterns we repeat. Four people writing code that has to look like one product.

Read this before creating new files. If a convention here conflicts with what you would normally do, this file wins.

---

## Repository

```
flowtop/
├── backend/          NestJS API          Dev A + Dev B
├── frontend/         public website      Dev C
├── admin/            the CMS             Dev D
├── packages/ui/      tokens + components Dev C owns, Dev D imports
├── shared/types/     shared types        Dev A owns
├── infra/            deploy, monitoring  Dev A
└── docs/             you are here
```

Each app has its own `package.json`. npm workspaces at the root.

---

## Naming

| Thing | Style | Example |
|---|---|---|
| Folders | kebab-case | `product-detail/` |
| React components | PascalCase file and export | `ProductCard.tsx` |
| Hooks | camelCase, `use` prefix | `useCart.ts` |
| Utilities | camelCase | `formatPrice.ts` |
| Types and interfaces | PascalCase, no `I` prefix | `Product`, not `IProduct` |
| Enums | PascalCase name, SCREAMING values | `OrderStatus.SHIPPED` |
| Backend files | kebab-case with role suffix | `products.service.ts` |
| Database tables | snake_case, singular | `order_item` |
| Database columns | snake_case | `created_at` |
| API routes | kebab-case plural | `/api/v1/products` |
| JSON fields | camelCase | `salePrice` |
| CSS tokens | kebab-case with prefix | `--color-purple-deep` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |

Database is snake_case, JSON is camelCase. Prisma maps between them. Do not leak snake_case into an API response.

---

## Backend file layout

```
src/<module>/
├── <module>.module.ts
├── <module>.controller.ts      routes, guards, validation
├── <module>.service.ts         business logic
├── <module>.repository.ts      the only place Prisma is called
├── dto/
│   ├── create-<thing>.dto.ts
│   └── update-<thing>.dto.ts
└── <module>.spec.ts
```

Controllers hold no logic. Services hold no Prisma. Keep the layers honest or the tests get painful.

---

## Frontend and admin file layout

```
src/
├── app/                routes only, thin
├── components/
│   ├── <domain>/       ProductCard, CartDrawer
│   └── sections/       the six CMS sections (frontend only)
├── hooks/
├── lib/
│   ├── api.ts
│   ├── mocks/          typed fixtures, every one tagged TODO
│   └── utils/
└── types/              local types only, shared ones come from @flowtop/types
```

Route files are thin. They fetch and compose. The work lives in components.

---

## Components

- One component per file, named the same as the file
- Server components by default, `'use client'` only when interaction demands it
- Props typed inline or just above, never `any`
- Split past roughly 200 lines rather than growing
- Co-locate a component's sub-parts in a folder when it has three or more

```
ProductGallery/
├── ProductGallery.tsx
├── GalleryThumbnails.tsx
├── GalleryLightbox.tsx
└── index.ts
```

---

## Styling

Every value comes from a token. No hex codes, no raw pixel values, no arbitrary Tailwind values in a component.

```tsx
// no
<div className="bg-[#5B2A86] p-[18px]">

// yes
<div className="bg-purple-deep p-space-4">
```

If the token you need does not exist, add it to the token file. Do not inline it "just this once".

Breakpoints: 360, 768, 1024, 1440. Mobile first, so write the small case and add `md:` and `lg:` upward.

---

## Money

**Integer paise everywhere.** In the database, in the API, in TypeScript.

```ts
price: 450000        // ₹4,500.00
```

Never a float. Never a string. Never rupees. Format only at the moment of display, with the shared `formatPrice` helper.

Frontends never do arithmetic on money. Totals arrive computed.

---

## Dates

`timestamptz` in the database, ISO 8601 UTC in the API, rendered in Asia/Kolkata. One shared `formatDate` helper, no ad-hoc formatting.

---

## API calls

Both frontends use their `lib/api.ts` wrapper. Never a raw `fetch` in a component.

Every call handles three states: loading, error, empty. A screen with only a success state is not finished.

When the endpoint does not exist yet:

```ts
// TODO: swap for real API when GET /products lands
import { mockProducts } from '@/lib/mocks/products'
```

Always tagged `TODO`, always matching the contract shape exactly. Then one grep finds them all on swap day.

---

## Errors

Backend returns the standard envelope from `03-api-contract.md`. Frontends show `error.message` to the user and map `error.fields` onto the form.

Never show a raw stack trace. Never swallow an error silently. Never show success when the API did not confirm it.

---

## Git

Branches: `<dev>/<type>/<short-description>`

```
dev-b/feat/placement-api
dev-d/fix/product-form-autosave
```

Commits: `type(scope): message`

```
feat(placements): add position reorder endpoint
fix(cart): recalculate totals after variant change
docs(api): add section config shapes
```

Types: `feat` `fix` `docs` `refactor` `test` `chore`

One logical change per PR. A PR that touches two folders usually should have been two PRs.

---

## Pull requests

Every PR states:

- What changed, in one line
- Which audit task it closes, for example `3.B1`
- Whether it touches another developer's folder, and why
- Whether the API contract changed
- For frontend and admin, that it was tested at 360px

CODEOWNERS blocks a merge into someone else's folder without their approval. That is deliberate.

---

## Testing

- Backend: a unit test per service, an integration test per endpoint, and **always a test for the unauthorized case**, not only the happy path
- Frontend and admin: test the loading, error and empty states, not just success
- Phase 5 adds nine end-to-end acceptance tests shared by C and D

A feature with only happy-path coverage is not tested.

---

## Things we do not do

- No `any`
- No raw `fetch` in a component
- No business logic in a controller
- No Prisma outside a repository
- No hardcoded colours, spacing or font sizes
- No money arithmetic in a frontend
- No free-text style field in the CMS, ever
- No trusting a client-sent price, permission or payment status
- No success message for a failed save

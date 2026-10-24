# dev-a/feat/product-catalog-types, 2026-10-24

Branch `dev-a/feat/product-catalog-types` off `main` at `079be6d` (merge of PR #16). It publishes the product catalogue shapes into `shared/types` with no implementation: no endpoint, no service, no DTO, no frontend change.

Verified on the box (Linux, Node v24.x, fresh `git clone` of the branch, every `node_modules` absent, `npm ci` at the root and a separate `npm ci` in `backend/`, which is not a root workspace).

## What was added

| File | What |
|---|---|
| `shared/types/src/index.ts` (from line 208) | `PublishStatus`, `SpecificationType`, `ImageRef`, `GalleryImage`, `Seo`, `Finish`, `Variant`, `Specification`, `SpecificationItem`, `SpecificationGroup`, `CategoryRef`, `CollectionRef`, `Category`, `Collection`, `CollectionDetail`, `ProductCard`, `ProductDocument`, `ProductDetail`. Type-only, same file and same `export interface` style as `User`, `MediaAsset`, `Paginated`. |
| `backend/src/common/catalog-types.drift.spec.ts` | The drift test (see below). |
| `backend/src/common/shared-types.agents.spec.ts` | Typechecks the example in `shared/types/AGENTS.md` exactly as written (rule 9), plus a negative control. |
| `shared/types/AGENTS.md` | New. How to import, the rules the types encode, a working example. |
| `frontend/AGENTS.md:83` | The "shared shapes" list now names the catalogue types. |

Import path: `import type { ProductCard, ProductDetail } from '@flowtop/types'` (frontend already depends on it as `file:../shared/types`).

## Where the contract and the schema disagree

Rule I followed: **the contract decides field names and shapes; the schema decides value types, nullability and enums.** Nothing here was picked silently. Each row is a place a developer could otherwise guess wrong.

| # | Field | `docs/03-api-contract.md` | `backend/prisma/schema.prisma` | Followed |
|---|---|---|---|---|
| 1 | `ProductCard.category`, `ProductDetail.category` | Always an object (`:133`, `:154`) | `Product.categoryId String?` (`:301`) | Schema: `CategoryRef \| null` |
| 2 | `primaryImage`, `hoverImage` | Objects (`:126-127`) | Images come from `ProductMedia` rows; the seeded content has none (`product_media = 0`), so a product can have no image | Schema: `ImageRef \| null` |
| 3 | `Variant.image` | Object (`:163`) | `Variant.imageId String?` (`:361`) | Schema: `ImageRef \| null` |
| 4 | `Variant.swatchHex`, `Finish.swatchHex` | Always a hex string in the example | `Variant.swatchHex String?` (`:360`) | Schema: `string \| null` |
| 5 | `Variant.price` | `number`, "resolved price, override applied" | Column is `priceOverride Int?` (`:358`), "Null means the product price applies" | Contract: `number` (`:161`). The service resolves it; the type is not the column's type. |
| 6 | `ProductDetail.seo` | Nested `{ title, description, canonical, shareImage: { url } }` | Four flat columns `seoTitle`, `seoDescription`, `seoCanonical`, `seoShareImageId` (`:321-324`) | Contract shape. `canonical` is `string \| null` and `shareImage` is `{url} \| null` from the nullable columns. |
| 7 | `Collection.heroImage` | `heroImage` (`:293`) | Column is `heroMediaId` (`:438`), relation `heroMedia` | Contract name. |
| 8 | `Category.children` | `GET /categories` is a "tree" (`:276`), no field named | Relation `children` (`:421`) | Schema relation name. Flag: Dev B may prefer another name; change it here and in the spec in one PR. |
| 9 | `GalleryImage.width/height` | Numbers in the example (`:177`) | `MediaAsset.width/height Int?` (`:645-646`) | Schema: `number \| null` (same as the shared `MediaAsset`). |
| 10 | `ProductCard.finishes[].id` | `"uuid"`, not said whose | A `Variant` row has no finish table | **Assumption:** the variant id. Dev B must confirm. |
| 11 | `ProductDocument.id`, `.url`, `.sizeBytes` | `id`, `name`, `url`, `sizeBytes` (`:178`) | `ProductDocument` has `mediaAssetId` and `name` only; `url` and `sizeBytes` live on `MediaAsset` | Contract shape. **Assumption:** `id` is the media asset id. |
| 12 | `Specification` | Public shape is grouped (`group` + `items[]`) | Table is flat rows with `id`, `type`, `position` (`:380-400`) | Both are exported: `SpecificationGroup` (public, contract) and `Specification` (the row, schema). |
| 13 | `Category`, `Collection` | **No JSON shape in the contract**, only route lists | Full models (`:402-456`) | Derived from the schema, with the contract's `heroImage` and `story` HTML (`:293`). `CollectionDetail` adds `products: ProductCard[]` because `:293` says the detail carries them. |
| 14 | `docs/04-data-model.md` `Variant` | Has no `swatch_hex` | Has `swatchHex` (`:360`) | Schema. The data-model doc is behind the schema; not edited here. |

Left out on purpose (listed in `NOT_EXPOSED` in the drift test, each with a reason): `taxClass`, `isFeatured`, `isNewArrival`, `isBestseller`, `status`, `publishedAt`, `modelUrl`, `videoUrl` (Product); `productId`, `position` on child rows; every `createdAt`/`updatedAt`.

## The drift test

`backend/src/common/catalog-types.drift.spec.ts`, same approach as `src/auth/shared-types.drift.spec.ts` (shared types are type-only, so each shape is mirrored as a value, locked to the type at compile time, and compared at runtime). It fails on four things:

1. A shared field whose type or nullability differs from its Prisma column (`Equal<Pick<Shared,…>, Pick<PrismaModel,…>>`, enums included).
2. `ProductCard` or `ProductDetail` keys that differ from the JSON example in `docs/03-api-contract.md`, read from the doc at test time.
3. A Prisma column that is neither exposed nor listed in `NOT_EXPOSED`. Adding a column forces a decision.
4. An enum value added or removed on one side only.

**Important property of the existing pattern, which this test inherits:** `backend/tsconfig.json:24` sets `isolatedModules: true`, so ts-jest does not typecheck. The compile-time half (1) fails `npm run typecheck`, not `npm test`. CI runs both in the Backend job (`.github/actions/node-app/action.yml`), so a PR fails either way; running only `npm test` locally will not show it.

## Verdict

PASS on everything runnable on the box. The types are published; Dev C and Dev D can import them. They do not yet have a backend that returns them: nothing in this PR changes an endpoint.

## Checks

| # | check | PASS / FAIL / N/A | evidence |
|---|---|---|---|
| 1 | Read the contract and the schema first, listed every disagreement | PASS | 14 rows above, each with a line. |
| 2 | Exported the same way as the existing types | PASS | `shared/types/src/index.ts`: `export type` / `export interface`, no values, no imports. `npx tsc -p shared/types` exit 0. |
| 3 | Drift test red on a changed shared type | PASS | Fresh clone: `ProductDetail.salePrice` `number \| null` to `number` (`index.ts:389`). `npm run typecheck`: `catalog-types.drift.spec.ts(66,3): error TS2344: Type 'false' does not satisfy the constraint 'true'`, exit 2. Restored; green. |
| 4 | Drift test red on a changed schema | PASS | `schema.prisma:436` `Collection.story String` to `String?`, `prisma generate`: `typecheck` error at `catalog-types.drift.spec.ts(102,3)`. Earlier run: added `Product.weightGrams Int?`: jest `accounts for every Product column` failed, expected list contained `weightGrams`; added `scheduled` to `PublishStatus`: jest `matches the Prisma enums value for value` failed and 4 type errors. All restored, schema and client regenerated, `git status` clean. |
| 5 | Drift test red on a changed contract | PASS | Renamed `hoverImage` to `hoverImg` in the ProductCard example: jest `gives ProductCard the keys the contract example has` failed, diff `- "hoverImg"` / `+ "hoverImage"`. Restored. |
| 6 | AGENTS.md example verbatim | PASS | `shared-types.agents.spec.ts`: 2 passed. Red: `product.salePrice` to `product.salePrices` in AGENTS.md gave `Property 'salePrices' does not exist on type 'Pick<ProductCard, "price" \| "salePrice">'. Did you mean 'salePrice'?` Restored. |
| 7 | Root typecheck / lint / build / test, clean `npm ci` | PASS | Each exit 0 (frontend + `@flowtop/ui`; `next build` ran). Root `npm ci` exit 0. |
| 8 | Backend typecheck / lint / unit tests / build | PASS | typecheck 0, lint 0 (an earlier run failed lint: 3 errors in the new specs, fixed), build 0. Unit tests **207 passed, 22 suites** (main: 137 passed, 20 suites; this PR adds 70 tests). |
| 9 | `shared/types` build | N/A | `shared/types/package.json` has no `scripts` (`grep -c '"scripts"'` = 0). The nearest check is `npx tsc -p shared/types`, exit 0. |
| 10 | Frontend typecheck | PASS | `npm run typecheck` in `frontend`: exit 0. |
| 11 | Admin typecheck | N/A | `admin/` has only `AGENTS.md`, no `package.json` on main (`ls admin`); the CI job skips with a notice. Admin is Dev D's branch and not touched. |
| 12 | Nothing downstream broken | PASS | Frontend typecheck and build above. The frontend does not import the new names yet. |

## Phase 2 prerequisites: harness (prompt 1.4) and Check 5 (prompt 1.3)

The prompt text is in `docs/prompts/dev-b-catalogue.md` (Prompt 1.3 seed data, Prompt 1.4 test harness, Phase 1 CHECK 5 at `:158`: "40 products, 6 categories, 3 collections, varied data"). `docs/prompts/dev-a-platform.md` has neither. The harness itself lives in `backend/test/`; `docs/05-team-split.md` still lists 1.B6 (seed) and 1.B7 (harness) as "Not started".

Measured on the box against a real PostgreSQL 17.11 (fresh cluster, `flowtop_test` created by `test/global-setup.ts`), from the clean clone, command `npm run test:e2e`.

| # | check | result | evidence |
|---|---|---|---|
| H1 | Example test (`test/dev-b-imports.e2e-spec.ts`) | PASS, 12/12, 2.6 s | `npm run test:e2e -- test/dev-b-imports.e2e-spec.ts --reporters=default --verbose`: `Tests: 12 passed, 12 total`, `Time: 2.585 s`. |
| H2 | Whole e2e suite, serial | PASS, 137/137, 8 suites, 27.7 s | `npm run test:e2e`. |
| H3 | The example can fail | PASS | `src/auth/permission.guard.ts:41` `if (!required.every(...))` replaced by `if (false)`: `Tests: 2 failed, 10 passed`; `expected 403 "Forbidden", got 200 "OK"` at `dev-b-imports.e2e-spec.ts:103` and `:127`. Restored with `git checkout`; re-run 12/12. |
| H4 | DB reset between tests | PASS | `test/database.ts:8` TRUNCATE of every public table but `_prisma_migrations`, CASCADE; each spec calls it in `beforeEach` (e.g. `users.e2e-spec.ts:49`). |
| H5 | Auth helper per role | PASS | `test/accounts.ts:35` `createAccount(app, role, ...)` for `super_admin`, `marketing_admin`, `product_manager` (`src/auth/permissions.ts:65`), completes MFA (`:55` `signIn`). |
| H6 | Factories for catalogue data | **FAIL** | None. `accounts.ts` is the only factory; `fixtures/files.ts` is upload bytes only. 40 catalogue tests would each hand-write `prisma.product.create`. |
| H7 | Parallel running | **FAIL** | Without `--runInBand`: `Tests: 119 failed, 18 passed`, `Raw query failed. Code: 40P01. Message: deadlock detected`. All specs share one DB (`test-env.ts:11`). Serial only works because of `--runInBand` at `package.json:18`; `test/jest-e2e.json` has no `maxWorkers` and no comment saying so. |
| H8 | Teardown, open handles | PASS | Every spec has `afterAll(app.close)`. `--detectOpenHandles` on the example: no open-handle report, 12/12. |
| H9 | Clean-clone command documented | **PARTIAL** | It runs from a clean clone: `.env` with `TEST_DATABASE_URL`, then `npm run test:e2e` (the DB is created and migrated by `global-setup.ts:26`). But the command appears only in `package.json:18` and `.github/workflows/ci.yml:107`; `backend/AGENTS.md` and `docs/08-local-backend.md` name `TEST_DATABASE_URL` (`:32`) and not the command. `npx jest` directly fails (`Must use import to load ES Module`): the script's `--experimental-vm-modules` flag is needed. |
| H10 | Shared bootstrap | **FAIL** | `Test.createTestingModule` + `configureApp` + `beforeAll`/`beforeEach`/`afterAll` is copy-pasted in all 8 specs (e.g. `users.e2e-spec.ts:37-56`, `settings.e2e-spec.ts:28-45`). So is the `account()` wrapper (`users.e2e-spec.ts:61`). Forty more specs would copy it again. |
| H11 | In-memory state reset | **FAIL (latent)** | The rate limiter is process memory, not the DB, so `resetDatabase` does not clear it. Five specs call `app.get(RateLimiter).clear()` (`audit:65`, `auth:56`, `dev-b-imports:68`, `media:53`, `mfa:54`); `users` and `settings` do not. A test that signs in many times in a spec that forgot gets an intermittent 429. |
| H12 | Migration errors visible | **FAIL (minor)** | `global-setup.ts:28` `stdio: 'ignore'` hides `prisma migrate deploy` output, so a bad migration shows as a test-suite crash with no reason. |
| H13 | Reporter | NOTE | In a non-TTY shell, jest prints only the totals unless `--reporters=default` is passed. CI is unaffected. |

**Verdict on the harness:** good enough to start Phase 2 for sequential tests (reset, roles, MFA sign-in and teardown all work and the example can go red). Not yet ready for forty tests without three small fixes first: a catalogue factory (H6), one `createTestApp()` plus `beforeEach` helper that resets, syncs permissions and clears the rate limiter (H10, H11), and a one-line `"maxWorkers": 1` in `test/jest-e2e.json` plus the command in `backend/AGENTS.md` (H7, H9). Not fixed in this PR (scope: types only).

**Check 5 (seed on a dropped DB):** `DROP DATABASE`, `prisma migrate deploy`, then `npm run db:seed`.

| table | after seed 1 | after seed 2 |
|---|---|---|
| product | **0** (expected 40) | 0 |
| category | **0** (expected 6) | 0 |
| collection | **0** (expected 3) | 0 |
| variant, specification, media_asset, product_media, navigation_item, page, section, journal_article | 0 | 0 |
| permission / role / role_permission / setting | 35 / 3 / 67 / 8 | 35 / 3 / 67 / 8 |

**FAIL: 0 / 0 / 0, not 40 / 6 / 3.** Why: `npm run db:seed` runs `prisma/seed.ts` which calls `seedFromEnvironment` (`src/database/seed.ts:20-34`): permissions, roles, settings and an optional admin only. The catalogue seed `seedContent` exists at `backend/prisma/seed-content.ts:86` and **nothing imports it** (`grep -rn seedContent` finds only its own definition). Second defect: when run by hand, it fails at `seed-content.ts:145-153`: its navigation destinations are `'/products'`, `'/about'` and so on with `linkType: 'external'`, which the database constraint `navigation_item_destination_shape` (`migrations/20261013093542_navigation_link_type/migration.sql:20-24`) rejects (external must be an absolute http(s), mailto: or tel: URL); the transaction rolls back and leaves no rows. Idempotence of what the seed does run: stable (counts identical after 2 runs). With the five navigation destinations changed to absolute URLs in a scratch copy (not committed) `seedContent` gives 6 categories, 3 collections, 40 products, 119 variants, 286 specifications, 24 collection_product, 6 journal articles, 5 sections, 6 navigation items, and the counts are unchanged after a second run (idempotent). It creates no `media_asset` or `product_media` rows, so seeded products have no images: `primaryImage` is null, which is why the types allow null (disagreement row 2).

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | The frontend declares its own `ProductCard`, `ProductDetail`, `Category`, `Collection`, `ProductFinish`, `ProductSpecification`, and they do not match the contract: `primaryImage: string`, `finishes: string[]`, `categorySlug`, `salePrice?`, `fullDescriptionHtml`, `gallery: MediaAsset[]`, `ProductDetail extends ProductCard`, `Category.productCount`. | `frontend/src/lib/types-pending.ts:69-130`; mocks in `frontend/src/lib/mocks/products.ts` | Dev C (rule 7: two owners for one type). | Can wait one day; blocks the screens being right. Not changed here: it is Dev C's code. |
| 2 | Type-level drift fails `npm run typecheck`, not `npm test`. | `backend/tsconfig.json:24` | Anyone who runs only `npm test`. | Can wait; CI runs both. |
| 3 | Check 5 fails: 0 products, 0 categories, 0 collections; `seedContent` is never called and also violates a DB constraint. | `backend/prisma/seed-content.ts:86`, `:145-153` | Dev B (1.B6), and every Phase 2 test that needs catalogue data. | Blocks Phase 2 tests that need seeded data. |
| 4 | The harness has no catalogue factory, no shared bootstrap, and cannot run in parallel. | `backend/test/` (H6, H7, H10, H11) | Dev B's forty tests. | Fix before test 10, not forty. |

## Questions

1. Row 10 and 11 above are assumptions (variant id as finish id; media asset id as document id). Dev B: confirm or correct before writing the endpoints.
2. `Category.children` (row 8): keep the Prisma relation name?
3. Should `docs/03-api-contract.md` get Category and Collection JSON examples (row 13)? Then the drift test can compare their keys to the contract too, as it does for ProductCard and ProductDetail.
4. Should `docs/04-data-model.md` get `swatch_hex` (row 14)?

## Honesty line

Not verified: no endpoint returns these shapes yet, so nothing checks a real response against them (rule 2, rule 5 "a client calls every endpoint": none shipped). Category and Collection are checked against the schema only; the contract has no shape for them. The CI results are in the PR, not here. I did not run the admin app or a browser. The compile-time half of the drift test runs under `npm run typecheck`, not `npm test` (see above).

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | N/A. Types only; nothing renders. |
| 2 | 2 | Mock vs real API checked? | N/A. No endpoint exists to check. Failure #1 records that the existing frontend mock already disagrees with the contract. |
| 3 | 3 | Broke each drift test and watched it go red? | Yes (checks 3 to 6). |
| 4 | 4 | Clean clone, npm ci at root? | Yes (check 7), plus `npm ci` in `backend/`. |
| 5 | 5 | Another app imported and rendered the library; a client called every endpoint? | N/A. No component library or endpoint shipped. The frontend typecheck and build pass with the new exports present (check 10, 12). |
| 6 | 6 | Doc examples typechecked verbatim? | Yes (check 6). |
| 7 | 7 | One owner per shared type, importer, failing test? | No, for the consumer side. Owner and test exist (shared/types, drift spec). `frontend/src/lib/types-pending.ts:84,99,114,124` still has private copies until Dev C switches (failure #1). |
| 8 | 8 | Shared preset or base config changed, built before and after? | N/A. No config changed. |
| 9 | 9 | Shape first, AGENTS.md example, verbatim test? | Yes. `shared/types/AGENTS.md`, `shared-types.agents.spec.ts`. |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed as `<branch>-<date>.md`? | Yes. |
| 12 | reviews/README | Every row's evidence is file:line, output or measured? | Yes. |

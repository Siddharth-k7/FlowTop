# dev-a/fix/admin-cms-v2-complete, 2026-11-06

Replacement for PR 23 (`d177f7b8b6de4dda178db0d9d303f192d27d5081`). PR 23 stays a draft. This branch was created from that head. `origin/main` was `84017b46de7668cd088807ce3cd65c0518f14385` and had no commits this branch lacked, so no merge commit was required. Dev D's commits stay in the history.

## Verdict

The flows that blocked PR 23 now run against the real API. This review records what was implemented and what was measured. Merge is for the user after CI on the pushed head is green. This agent does not merge.

## Finding-by-finding

| review finding | status | fix |
|---|---|---|
| F1 product list stops at 25 and searches only those rows | FIXED | `listUrl` in `admin/src/components/ui/ListScreen.tsx` sends `search`, filter keys, `page` and `perPage`. Show more requests the next page. Browser search for `AAA Review 01` found the row after 26 creates (all HTTP 201). |
| F2 editor publish needs a category the API did not, and bulk publish skipped the rule | FIXED | `ProductsService.assertPublishable` requires `price > 0` and `categoryId` (`backend/src/products/products.service.ts`). Bulk publish and unpublish also require `product:publish`; archive requires `product:archive`. Browser: category "Basin Mixers" was added, the product form selected it, Publish was enabled, and the product published. |
| F3 page publish writes the draft back | FIXED | `PageBuilder` saves page fields without `status` or `sections`, syncs sections through the section routes, then `POST /publish` and reloads. No second save. E2E: published page stayed `published` and still had its section. |
| F4 collections and journal send the wrong body | FIXED | Collections PATCH fields and `PUT /admin/collections/:id/products` with `{ items: [{ productId, position }] }`. Journal publish is `POST /admin/journal/:id/publish`. E2E stored `productIds` in rank order and published an article. `product_manager` is 403 on journal publish. |
| F5 slug collision reported as the SKU | FIXED | Prisma 7 puts the index name on `driverAdapterError.cause.constraint.index` (`product_slug_key`). `rethrowUnique` reads the JSON of `meta`. E2E: duplicate slug is `fields.slug` and `fields.sku` is absent. |
| F6 no "Saved" after the first create | FIXED in code | `useDocument` writes `sessionStorage` `ft:saved:<collection>:<id>` before `router.replace`, and the next mount shows Saved at. The browser read the status line before the editor mounted, so that one sample was empty. A later status line on the same product was `Saved at 8:16:02 am`. |
| F7 guide tells staff to open a Media tab | FIXED | `admin/src/components/screens/Guide.tsx` now says images are uploaded from Media and this form has no media tab, and that category and price are required before publish. |
| F8 production bundle contains the mock password | FIXED | `next.config.mjs` replaces `mocks/router` with `admin/src/lib/mocks-off.ts` unless `NEXT_PUBLIC_USE_MOCKS=true`. After `npm run build`, zero `.next` JS files contain `mock-password` (the previous build had 2). |
| Orders CSV 404 | FIXED | `GET /admin/orders/export` returns `text/csv` with `Content-Disposition`. Formula cells are prefixed. E2E body contains `"'=cmd"`. `product_manager` gets 403. Browser download filename `orders.csv`. |
| Categories, variants, specs, placements, pages, journal, navigation, submissions, dashboard 404 | FIXED on the API | Modules under `backend/src/{categories,collections,placements,pages,journal,navigation,orders,submissions,dashboard}` plus variants and specifications on the products module. Permissions are the existing `ROLE_PERMISSIONS` grants. |
| S3 mock settings disagree with parsers | PARTIAL | The settings mock rejects a bad WhatsApp number, an empty recipient list, and clearing `email.senderAddress` once it is set (`admin/src/lib/mocks/admin.ts`). Orders, submissions and navigation mocks were updated to the new shapes. They are still an in-memory stand-in, not a second contract. |
| S5 branch age | OPEN process | Dev D's commits remain. This branch adds three commits on top. History was not rewritten. |

## Verification matrix

| boundary | command or action | result |
|---|---|---|
| Shared types vs Prisma enums | `npx tsc --noEmit` in backend, exit 0. Drift spec `admin-commerce.drift.spec.ts` included in the 223 unit tests. | PASS |
| Backend unit | `npm test --no-coverage` | 26 suites, 223 tests passed |
| Admin unit | `npm test` | 12 files, 83 tests passed |
| Admin lint | `npm run lint` | exit 0 |
| Backend lint | `npm run lint` | exit 0 |
| Admin production build | `npm run build` | Next.js 15.5.28, exit 0. `mock-password` files in `.next`: 0 |
| Real API e2e | `npm run test:e2e -- --testPathPatterns=admin-contract` | 19 passed |
| List URL red/green | Set `page` to the constant `'1'`. `list-url.test.ts` failed: received `page=1`, expected `page=2`. Restored `String(page)`. 2 passed. | PASS |
| Slug attribution red/green | `rethrowUnique` ignored `slug`. E2E expected `fields.slug`, received undefined, exit 1. Restored `target.includes('slug')`. 1 passed. | PASS |
| Browser, mocks off | Production admin on port 3001, API on port 4000, Postgres 16 migrated and seeded. Playwright Chromium. | See below |
| Docker image | `docker build -t flowtop-api:review backend` exit 0. `docker run --network host --env-file backend/.env` then `GET /health` | `{"data":{"status":"ok","database":"up"}}` |
| React overrides | Not changed. Root `package.json` still overrides `react` and `react-dom` to 19.3.1. | unchanged |
| Frontend | `npm run typecheck` and `npm test` | typecheck exit 0. Checks passed, 8 navigation failure-policy checks passed |
| UI kit | `npm test` | 33 passed, 0 failed |

### Browser (production admin, `NEXT_PUBLIC_USE_MOCKS` unset)

| step | result |
|---|---|
| Super admin enrols TOTP, logs out, signs in with one recovery code | `/dashboard`. Recovery code was not written to the log. |
| Signs in again with a TOTP from the next 30s step | `/dashboard` |
| Adds category "Basin Mixers" | row appears |
| New product, category selected, price 4500 | Publish enabled (`publishDisabled: false`) |
| Save, then Publish | URL left `/products/new`. Status line later read `Saved at 8:16:02 am`. The word published was on the page. |
| 26 products created (each 201), search `AAA Review 01` | the row was visible |
| Settings WhatsApp `12345` | field error stayed, value kept |
| Valid number saved, then cleared | input empty |
| Export CSV | download `orders.csv` |
| Products at 360px | `scrollWidth` 360 = `innerWidth` 360 |
| product_manager menu | Dashboard, Products, Categories, Collections, Pages, Media, Admin guide |
| product_manager opens `/settings` | both the error text and the permission toast were in the DOM |

Screenshots: `/opt/cursor/artifacts/pr23-fix/01-category.png` through `06-pm-denied.png`, plus `result.json`.

## Commands

Node v24.22.2.

```
cd backend && npx tsc --noEmit                         # exit 0
cd admin && npx tsc --noEmit                           # exit 0
cd backend && npm test --no-coverage                   # 26 suites, 223 passed
cd admin && npm test                                   # 12 files, 83 passed
cd admin && npm run lint                               # exit 0
cd backend && npm run lint                             # exit 0
cd admin && npm run build                              # exit 0, mock-password files 0
cd backend && npm run test:e2e -- --testPathPatterns=admin-contract
                                                       # 19 passed
sudo docker build --tag flowtop-api:review backend     # exit 0, image ee56cf619b17
sudo docker run --network host --env-file backend/.env flowtop-api:review
curl -sf http://127.0.0.1:4000/health                  # {"data":{"status":"ok","database":"up"}}
```

Postgres 16.15 on 127.0.0.1:5432. Databases `flowtop` and `flowtop_test` were created for this run. Docker was not installed at the start (`command -v docker` empty, no socket). `apt-get install docker.io` succeeded. `systemd` start was denied by `policy-rc.d`. `sudo dockerd` came up and `docker info` succeeded. That is the daemon the image was built and booted with.

## Honesty line

Not verified:

- The page builder was not clicked in the browser. Page create, section create, bad preset 422, and publish-stays-published were e2e only.
- Collection rank and navigation replace were e2e only, not clicked in the admin UI.
- Variants, specifications and placements were not clicked in the browser. Their routes are registered and typecheck. No e2e walked a finish or a placement row.
- The first-save "Saved at" line was read before the editor finished mounting, so that single sample was empty.
- Recovery-code reuse (the same code a second time) was not tried.
- Frontend typecheck and tests passed. UI kit tests: 33 passed. Those apps were not edited.
- CI on implementation head `39ab3291485538990ed6b703bb99a126c7d1a3e3` is green: run 42187063558, all seven checks (Backend, Backend image, Frontend, Admin, UI kit, Secret scan, GitGuardian). This paragraph is a documentation commit after that run. The user merges only when the checks are green on the current head.
- Docker was booted against the local review database, not Render.

Not verified.

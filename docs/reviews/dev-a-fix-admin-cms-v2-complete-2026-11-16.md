# PR 24 merge-audit fixes

Branch `dev-a/fix/admin-cms-v2-complete`. Closes the reproduced findings in the 2026-11-16 merge audit of `7024224837c80dac5a2c68d6c2a8282a0fb34b3d`.

### Verdict

The audited failures are fixed on this branch and covered by regression tests. Do not merge until CI on the new head is green. Do not merge together with PR 25 without picking one variants/specifications module.

### Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Browser measurement of the changed admin flows | PASS | Chrome (puppeteer-core, system Chrome) against `http://localhost:3001` and the Docker API on `http://localhost:4000`. Collection save landed on `/collections/dc591e66-50c6-49a1-a188-afef3b3bc749` with “Saved at 10:49:31 pm” and badge Draft. Page `82cfe53c-5491-4ef6-bc75-abb0f2e54264` kept “Hero banner” after the second save, then badge Published, then “Publish changes” again left it Published with no error. Postgres: title `Launch browser edit`, status `published`, one `hero` section at position 1; collection `Opel browser` status `draft`. |
| 2 | Real API, not mocks | PASS | `NEXT_PUBLIC_USE_MOCKS=false`. Admin bundle contains `http://localhost:4000/api/v1` (`admin/.next/static/chunks/736-48394c7d5a888071.js`). e2e uses Postgres. |
| 3 | Drift test proven red | PASS | With `JournalListQuery.status` typed as `string`, `npx tsc -p tsconfig.json --noEmit` reported `admin-commerce.drift.spec.ts(55,29): error TS2344: Type 'false' does not satisfy the constraint 'true'`. Restoring `@IsIn(PUBLISH_STATUSES)` made that tsc run exit 0. |
| 4 | Clean clone, root npm ci | PARTIAL | This VM started with no `node_modules`. `npm ci` in `backend/` and at the repo root both exited 0. A second clone of the repo was not made. |
| 5 | A client called the changed endpoints | PASS | Browser flows above, plus `backend/test/audit-merge-repro.e2e-spec.ts` (27 passed). Not every role on every unchanged route. |
| 6 | Doc examples typechecked verbatim | PARTIAL | `shared-types.agents.spec.ts` 2 passed (the shared-types AGENTS example). `docs/03-api-contract.md` samples were not copied out and typechecked. |
| 7 | Shared types have one owner and a failing drift check | PASS | `AdminJournalListQuery` and `AdminOrderListQuery` added in `shared/types/src/index.ts`. Locked in `backend/src/common/admin-commerce.drift.spec.ts`. |
| 8 | Shared preset output diff | N/A | No Tailwind preset or token change. |
| 9 | Shape published before the feature | N/A | This change fixes behaviour of shapes that already exist. The new query types were added in the same change as the filters. |
| 10 | Honesty line | PASS | Below. |
| 11 | Filed under docs/reviews | PASS | This file. |
| 12 | Evidence is file:line or command output | PASS | Cited below. |

### Failures

No open audit failure remains in the tests that were run. Residual limits are in the honesty line.

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | Nothing left from the reproduced audit list | | | |

### What changed

| Finding | Fix |
|---|---|
| Collection create 422 | `collectionBody` omits `status` (`admin/src/lib/content-types.ts`). `CreateCollectionDto` still rejects `status`. |
| Second page save deletes sections | `syncPageSections` reloads with GET after the writes (`admin/src/lib/section-sync.ts`). `useDocument` stores that result, not the pre-sync PATCH. |
| Republish 500 | `PublishStateService.transition` returns the record when the status is already the target (`backend/src/_base/publish-state.service.ts`). Illegal moves throw `ApiException` 422. Page and journal editors catch the publish result and reload. |
| Collection rank reverts | After `PUT .../products`, state uses `rankAfterSave` (`admin/src/lib/collection-save.ts`), not the PATCH `productIds`. |
| Section / variant reorder of another parent | `assertExactReorder` (`backend/src/common/reorder.ts`) inside the transaction. Positions only. Unknown id 404. Another parent or a duplicate 422. |
| Placement reorder moves location | Foreign id is 422, or 409 when that product is already in the target. Positions only (`placements.service.ts`). |
| Clear only default finish | Update throws 422 if it would leave the product with finishes and no default. Delete of a finish on an order is 409 with a specific message. |
| Bulk publish partial commit | `ProductsService.bulk` writes every id in one `repository.transaction`. A later refusal rolls the earlier ids back. |
| Non-string section preset | `assertSectionConfig` requires a string from the preset list. `columns` must be the integer 2, 3 or 4. |
| Placement type does not match the id | Lookup is per `locationType`. A missing product is 404, not the duplicate-placement 409. |
| Journal `status=nope` | `@IsIn` the four publish statuses. |
| Navigation drops grandchildren | `replace` walks every `children` array and checks each internal id exists before `deleteMany`. The editor renders two levels (`depth < 2`). |
| Collection PATCH skips the state machine | Status changes call `PublishStateService` before any write. Story saves do not send `status`. |
| List `productIds: []` | The list query includes ordered membership. |
| Order export ignores filters | Export uses `OrderListQuery`, including `status`. `from` is inclusive and `to` exclusive; both must be full timestamps. The export button sends the list filters (`admin/src/lib/order-export.ts`). |
| Parent category delete is a generic 409 | Message is `This category still has subcategories. Move them first.` |
| Product list responses can finish out of order | `settleListRequest` drops a stale generation. Filter and search clear the selection. |

### PR 25

See the chat report. Not edited.

### Honesty line

Not verified: a second fresh git clone; every doc sample in `docs/03-api-contract.md` typechecked by copying it out; every unchanged route as every role; a fractional variant price; public ISR timings; two editors saving one page at once; navigation edited in the browser (the API test covered grandchildren); category publish routes (still absent, and the audit said not to lock that 404 in); CI on the new head (push follows this file). The production image was booted with `NODE_ENV=production` and dummy S3 settings so it would start; `/health` returned `{"data":{"status":"ok","database":"up"}}`. The browser session used that same image. Chrome on `http://127.0.0.1:3001` was blocked by CORS because the allow-list is `localhost`, and the session cookie is `Secure`; the successful browser run used `http://localhost:3001` and `http://localhost:4000`.

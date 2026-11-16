# Re-audit of d07742c

### Verdict

The three HOLD findings are fixed on `da2af97`. Local suites, the Docker `/health` check, a browser pass against the new image, and CI run `43982374741` (7/7) all passed.

### Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Browser measurement of the CTA and hero video fields | PASS | Chrome on `http://localhost:3001` against the new image on `http://localhost:4000`. Hero `videoUrl` `javascript:alert(1)` was `POST 422` and the bar read `That layout is not one of the approved presets.` The next save stored `https://videos.example/a.mp4` (`POST 201`). CTA `cta.href` `javascript:alert(1)` was `POST 422`; `/products` was `POST 201`. Postgres: `browser-href-mwjwxrof-2` hero `video` `https://videos.example/a.mp4`, cta `href` `/products`. The first page row `browser-href-mwjwxrof` has no sections. |
| 2 | Real API, not mocks | PASS | The browser posts above hit `http://localhost:4000/api/v1/admin/pages/.../sections`. e2e uses Postgres. The P2034 path is a mocked `PrismaClientKnownRequestError` in `backend/src/products/variants.service.spec.ts`. |
| 3 | Drift test broken, then restored | PASS | Adding `'link'` to `SECTION_FIELDS.cta` made `tsc --noEmit` fail at `backend/src/pages/section-schema.drift.spec.ts:22` with `Type 'false' does not satisfy the constraint 'true'`. The key was removed and `tsc --noEmit` exited 0. |
| 4 | Clean clone | FAIL | Not run. CI is the clean install. |
| 5 | A client called the changed endpoints | PASS | Admin Save Draft called `POST /api/v1/admin/pages/:id/sections` for hero and cta. e2e calls the same route and `PUT /api/v1/admin/navigation`. |
| 6 | Every documented example typechecked verbatim | MISSING | Not run. The new config types follow the JSON in `docs/03-api-contract.md` around the section config shapes. |
| 7 | Shared types have one owner and a failing drift test | PASS | Owner is `shared/types/src/index.ts:468` (`SectionTypeName`) through `:554` (`CtaSectionConfig`). `SectionUrlField` is `:492`. The drift spec imports those types. |
| 8 | Shared preset diff | N/A | No Tailwind or token preset changed. |
| 9 | Shape published before the feature | N/A | The section shapes were already in the API contract. This change adds the types and the runtime schema together. |
| 10 | Honesty line | PASS | Below. |
| 11 | Review filed under docs/reviews | PASS | This file. |
| 12 | Evidence is a file:line, command output, or a measured value | PASS | Rows above. |

### Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | Nothing left from the three HOLD findings. | | | |

### Questions

1. Open redirect. `isSafeLink` in `backend/src/common/safe-href.ts:41` parses with `new URL(plain, 'https://flowtop.invalid/')` (`:12`). A relative value must stay on that origin (`:54`) and must not contain a backslash, a control character, or whitespace (`:16-22`). Absolute values may be `https:`, `mailto:`, or `tel:` (`:52-53`). `http:` is rejected. The comment at `:3-6` says the old `https?` pattern allowed it by accident and a stored `http` URL is a downgrade. Navigation uses the same function with relative paths turned off at `backend/src/navigation/navigation.service.ts:77`.

2. Presets inside arrays. `assertSectionConfig` (`backend/src/pages/section-config.ts:9`) checks the config against `SECTION_SCHEMA` for that section type (`backend/src/pages/section-schema.ts:48`). Array items are checked with the item schema (`:116-118`), so a preset is not looked up by a path that still contains `[0]`. Unknown keys are rejected (`:129`). Create passes `dto.type` at `backend/src/pages/pages.service.ts:78`. Update passes `existing.type` at `:88`.

3. URL fields. The URL node is `videoUrl` on hero (`section-schema.ts:51`), `viewAllHref` on a product carousel (`:56`), and `href` on a button (`:30`). `check` sends those through `isSafeLink` (`:96-98`). `link` is not a field of any section type, so it is an unknown key.

On `d07742c`, before this change, `npm run test:e2e -- --testPathPatterns=audit-break-d07742c|audit-break-extra --testNamePattern='rejects http|rejects script|rejects preset'` exited 1. `/\evil.com` and `/\/evil.com` came back `201`. `layout-in-array`, `layout-rainbow-in-array`, `link-key`, and `videoUrl` came back `201`. The extra case `http://evil.com` on a CTA came back `201`. After the fix the same three tests passed: `Tests: 2 skipped, 3 passed, 5 total`.

The live 15-pair default-finish test passed in about 8 seconds and needs more than Jest's 5 second default, so `backend/test/jest-e2e.json` sets `testTimeout` to 30000. A live P2034 was not injected. `variants.service.spec.ts` mocks `P2034` twice then success (3 transaction calls, 1 audit), three times then `CONFLICT` (audit not called), and an `ApiException` once with no retry.

Backend: lint clean, unit `29` suites / `240` tests, `nest build`, e2e `14` suites / `208` tests. Admin: typecheck, lint, vitest `14` files / `89` tests, `next build`. UI kit checks passed and `tsc --noEmit` passed. Frontend: typecheck, lint, test, `next build`. Image `flowtop-api:ci` `c3c856fc7cc6`. `GET http://127.0.0.1:4000/health` returned `{"data":{"status":"ok","database":"up"}}`.

### Honesty line

Not verified: a second fresh clone with `node_modules` deleted; every code sample in `docs/03-api-contract.md` pasted into a typecheck; a live Postgres P2034 (the retry is the mocked unit test, and the e2e race completed without a 500); public pages rendering the saved hero; the empty first page `browser-href-mwjwxrof` (the editor created `browser-href-mwjwxrof-2` after the 422 and left the first page with no sections). CI on `da2af97` is run `43982374741`: Backend, Backend image, Frontend, Admin, UI kit, Secret scan (gitleaks), and GitGuardian Security Checks all passed.

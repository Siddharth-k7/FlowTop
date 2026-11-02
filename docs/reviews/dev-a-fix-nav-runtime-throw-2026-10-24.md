# dev-a/fix/nav-runtime-throw, 2026-10-24

Branch `dev-a/fix/nav-runtime-throw` off `main` at `079be6d` (merge of PR #16, after PR #17 at `cefaf9d`). It answers question 1 in `dev-a-fix-public-static-rendering-2026-10-24.md`. `getNavigation()` fell back to the seed fixtures on any API error, and also on a 200 with no data. With ISR, every regeneration during an outage cached that fallback as if it were good, so the public nav stayed on seed data for as long as the API was down.

Verified on the box: Node v24.22.1, fresh `git clone`, `npm ci` at the root, `NEXT_PUBLIC_USE_MOCKS` unset except where labelled.

## Verdict

PASS. At runtime `getNavigation()` now throws. A failed regeneration leaves the last good page in the cache, and Next keeps serving it: measured over 7 forced regenerations (15s test window) and 2 at the real 300s window, the good nav was in every response and the seed nav never appeared. On main, under the same test, the seed nav replaced the good nav at the first failed regeneration and stayed until the API returned. The seed fallback now runs only during `next build`, and a build with the API down still succeeds. A new test pins the policy and was proven red.

## What changed

- `frontend/src/lib/navigation.ts`
  - New `isBuildPhase()`, which checks `NEXT_PHASE === 'phase-production-build'`.
  - `getNavigation()` throws on any API error and on a missing `data`, unless `isBuildPhase()`. During a build it logs `[navigation] API unavailable during build, prerendering with seed fixtures: …` and uses the seed.
  - The old partial fallback (`if (navRes.data) … else seed`) is gone.
- `frontend/scripts/test-navigation-fallback.mjs` (new, in `npm test`).
  - It loads the real `navigation.ts`, `api.ts` and fixtures, transpiled on load with the TypeScript compiler, and stubs only `fetch`.
  - It runs 8 cases: runtime API up, network failure, HTTP 500, 200 with `data: null`, `phase-production-server` network failure, build network failure, build `data: null`, and build API up.
- `frontend/AGENTS.md`, section "Public pages stay static": a new rule that server-side public loaders throw at runtime and fall back only during the build.

## Other public reads (the same pattern?)

| read | runtime caller | fallback? | action |
|---|---|---|---|
| `api.getNavigation`, `api.getPublicSettings` | `lib/navigation.ts` ← `app/layout.tsx:3` | Yes: catch-all, plus a silent `data == null` fallback | Fixed (this branch). |
| `api.getProducts`, `getProductBySlug`, `getCategories`, `getCollections`, `getJournal` | None (`grep -rn "api\." frontend/src` finds only `navigation.ts:45-46` and a doc comment in `api-session.ts:15`) | No. `httpRequest` rethrows (`api.ts:230-249`), and the mock-mode `catch` blocks only convert to `ApiError` and rethrow. | None needed. The new AGENTS.md rule covers them when Phase 2 adds callers. |
| Home page content | `app/page.tsx` | N/A. The page is hardcoded and makes no API call. | None. |
| `style-guide/ComponentShowcase.tsx:922` `.catch` | Client toast demo | Not a data fallback | None. |

## Measurements

Setup:
- A stub API (`/workspace/s5/stub.cjs`) serves the seed fixtures, with first header label `GoodNav<n>` and legal notice `GOOD legal notice from API #<n>`, where n is a counter that increments on each navigation fetch.
- Seed-only markers:
  - The seed legal notice `Precision architectural brassware` (2 hits in a seed-rendered page).
  - The header label `>Products<` (1 hit).
  - Both are 0 in a page rendered from the API.
- Probe: `curl -D - -H 'Cookie: session=abc123' http://localhost:<port>/`.

Three servers:
- **A**: this branch, revalidate **300s (production value)**.
- **B**: this branch with `PUBLIC_REVALIDATE_SECONDS` and the layout `revalidate` both set to **15s, for the test only** (not committed).
- **M**: main `079be6d`, same 15s edit, as the control.

| # | check | PASS / FAIL | evidence (times UTC) |
|---|---|---|---|
| 1 | Build with the API up caches the good nav | PASS | Builds A, B and M: `○ /`, `○ /_not-found`, `○ /style-guide` (A 5m, B and M 15s). A: `00:02:42Z 200 x-nextjs-cache: HIT s-maxage=300 good: GoodNav1 seed-legal 0 '>Products<' 0`. |
| 2 | API down, B (fix): good nav kept through 7 forced regenerations | PASS | API killed at 00:02:56Z, so both stubs return `000`. Every 19s from 00:03:16Z to 00:05:13Z: `STALE`, then `HIT` 1s later, always `good: GoodNav2`, seed-legal 0, `'>Products<'` 0, with the same `ETag: "5tkg65lano1jqd"` throughout. |
| 3 | Regeneration failed (server log) | PASS | `server-B.log`: `⨯ Error [NetworkError]: Network connection failed. Unable to reach server. digest: '1143635805'`. Final count (`grep -c NetworkError server-B.log`) 18 lines = 9 failed renders × 2 log lines: 8 with digest `1143635805` and 1 with digest `1597086492`. The 2 extra failures came from the #5 probes on other routes and the RSC request; which probe produced which digest was not attributed. |
| 4 | Control M (main): seed fallback poisons the cache | FAIL on main, as expected | First failed regeneration (00:03:17Z): the next response, at 00:03:19Z, is `HIT good: NONE seed-legal 2 '>Products<' 1`. Every later response until the API returned is the same, and `server-M.log` logs no error. |
| 5 | Other routes during the outage (B) | PASS | `/style-guide` 200 `STALE` `GoodNav1` seed 0. `/products` and `/no-such-page` 404 (cached not-found page) `GoodNav1` seed 0. RSC payload for `/` (`rsc: 1`) 200 `HIT` `GoodNav2` seed 0. |
| 6 | API back: refresh | PASS | The stub restarted at 00:05:30Z. B: `00:05:46Z STALE GoodNav2`, then `00:05:48Z HIT GoodNav3`. The stub logged `GET /api/v1/navigation cookie=null` at 00:05:46.950Z. M: `00:05:46Z STALE` (seed), then `00:05:48Z HIT GoodNav3`. |
| 7 | Production value (A, 300s) | PASS | Build fetch at 00:01:54Z, API down since 00:02:56Z. `00:07:11Z STALE s-maxage=300 GoodNav1 seed 0`, then `00:07:12Z HIT s-maxage=30 GoodNav1 seed 0`. `00:12:14Z STALE s-maxage=30 GoodNav1 seed 0`, then `00:12:15Z HIT GoodNav1 seed 0`. Same `ETag: "o4bn5plz2m1jr5"` both times. `server-A.log`: 4 `NetworkError` lines (2 regenerations). The API returned at 00:12:15Z; the recovery result is in check 8. |
| 8 | A recovery after the API returns | PASS | a-run.log: API 4101 back 00:12:15Z; 00:17:17Z `STALE s-maxage=30 GoodNav1 seed 0` -> stub logged `00:17:17.379Z GET /api/v1/navigation` -> 00:17:18Z `HIT s-maxage=300 GoodNav2 seed 0`; 00:17:19Z HIT GoodNav2 |
| 9 | Build with the API down succeeds with the seed | PASS | Clean clone, `NEXT_PUBLIC_API_BASE_URL=http://localhost:59999` (curl `000`): build exit 0, `○` ×3 with 5m, postbuild PASS. The log has `[navigation] API unavailable during build, prerendering with seed fixtures: Network connection failed. Unable to reach server.` ×3. `.next/server/app/index.html` has seed-legal 2 and `'>Products<'` 1. The same holds with `NEXT_PUBLIC_API_BASE_URL` unset (the CI case): exit 0, ○ ×3, 3 `[navigation]` warnings. Mock build: exit 0, 0 warnings. |
| 10 | Test proven red (rule 3) | PASS | With main's `navigation.ts`: `AssertionError … Missing expected rejection: runtime, network failure: throws: getNavigation() must throw at runtime so ISR keeps the last good page`, exit 1. Disabling the `isBuildPhase()` check (fallback everywhere): the same failure, exit 1. Always throwing (no build fallback): runtime cases pass, `build, network failure: seed fallback` fails with `NetworkError`, exit 1. Restored: `PASS: 8 navigation failure-policy checks.` |
| 11 | Clean-clone verify | PASS | Fresh clone of `dd91b61`, 0 node_modules, `npm ci` exit 0. Frontend `lint` "✔ No ESLint warnings or errors", `typecheck` exit 0, `test` exit 0 (ends `PASS: 8 navigation failure-policy checks.`), `build` exit 0 (#9). Root `typecheck`, `lint`, `test`, `build` all exit 0. |

Observation: after a failed regeneration, Next 15.5 serves the stale page with `s-maxage=30` (A, #7) and retries about 30s later rather than waiting a full revalidate window. During an outage this means a retry, and a logged error, roughly every 30s per route while traffic continues, and the stale good page throughout.

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | None open on this branch. | — | — | — |

## Questions

1. **`next dev` without a backend.** `NEXT_PHASE` is `phase-development-server`, so `next dev` with mocks off and no API now renders the error page instead of seed navigation. That follows the instruction to keep the fallback build-only. For local work without a backend, `NEXT_PUBLIC_USE_MOCKS=true` (frontend/AGENTS.md "When the API is not ready") is the path. Should dev get the fallback too?
2. **Root layout errors on uncached renders.** Every page is prerendered, and unknown URLs are served from the cached not-found page (#5), so no visitor hit an error during the outage. A route rendered for the first time at runtime during an outage (for example a future `[slug]` page not in `generateStaticParams`) would throw from the root layout. There is no `app/global-error.tsx` on main. Worth adding before Phase 2's dynamic product routes.

## Honesty line

The 7-regeneration run (#2) used a 15s revalidate, a test-only edit to both literals, not committed. The 300s production value was measured for 2 regenerations and recovery (#7, #8). The API was a stub serving the seed fixtures with marker strings, not a real backend. CI results are in the PR, not here.

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | Yes, by HTTP response measurement (headers and HTML) for every claim (#1-#9). There is no visual change; the nav markup is the same component. |
| 2 | 2 | Mock vs real API checked? | Yes. Mocks off throughout: real HTTP fetches against a stub that can be taken down. The mock build (#9) is unaffected. |
| 3 | 3 | Broke each drift test and watched it go red? | Yes (#10), 3 ways. |
| 4 | 4 | Clean clone, npm ci at root? | Yes (#11). |
| 5 | 5 | Another app imported and rendered the library? | N/A. `navigation.ts` has one consumer (`app/layout.tsx`), exercised in #1-#9. |
| 6 | 6 | Doc examples typechecked verbatim? | Yes. The AGENTS.md change is prose; the existing 2 examples still pass in `npm test`. |
| 7 | 7 | One owner per shared type, importer, failing test? | N/A. No shared type changed. |
| 8 | 8 | Built before and after for shared config change, diffed? | Yes for behaviour. Main (M) and branch (B) were built and run side by side (#2 vs #4). No shared config changed. |
| 9 | 9 | Published shape first, AGENTS.md example, verbatim test? | N/A. No new cross-team shape. The failure policy is documented in AGENTS.md and pinned by the test. |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed in docs/reviews as `<branch>-<date>.md`? | Yes. This file. |
| 12 | reviews/README | Every row's evidence is file:line, output, or measured value? | Yes. |

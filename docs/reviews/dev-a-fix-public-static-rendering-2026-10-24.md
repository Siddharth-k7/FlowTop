# dev-a/fix/public-static-rendering, 2026-10-24

Branch `dev-a/fix/public-static-rendering` off `main` at `e70fc03` (merge of PR #14). It answers question 7 in `frontend-dev-c-phase1-followups-2026-10-24.md`. A real build (mocks off) was dynamic (ƒ) because `frontend/src/lib/api.ts:129` called `cookies()` on every server request. That was not intended.

Verified on the box: Node v24.22.1, fresh `git clone`, `npm ci` at the root, no `frontend/.env*`, `NEXT_PUBLIC_USE_MOCKS` unset in every build below except the one labelled mock.

## Verdict

PASS. With mocks off, every route in the app is ○ (static) with a 5-minute ISR revalidate, whether the backend is unset, down, or up. The build tolerates a down backend: the navigation falls back to the seed fixtures and the page regenerates within 5 minutes. Public reads no longer read or send cookies. Only `frontend/src/lib/api-session.ts` may call `cookies()`, and nothing imports it yet. Two guards keep it that way, and both were proven red.

## What changed

- `frontend/src/lib/api.ts`
  - The server cookie block (old `:124-134`) and the `Cookie` header (old `:139-141`) are removed. `httpRequest` never imports `next/headers`.
  - `credentials` is now configurable (`:186`, default `include`).
  - Public reads use `publicRead(tag)` (`:116-121`): `credentials: 'omit'`, `next: { revalidate: PUBLIC_REVALIDATE_SECONDS (300, :103), tags: [tag] }`.
  - This applies to `getProducts` `:283`, `getProductBySlug` `:310`, `getCategories` `:332`, `getCollections` `:354`, `getNavigation` `:441`, `getPublicSettings` `:465` and `getJournal` `:491`.
  - Cart and submissions use `SESSION_CALL` (`:124-127`): `credentials: 'include'`, `cache: 'no-store'`, at `:379,394,406,419,518`.
  - `getCart` takes an optional `SessionInit` for a server route that needs the session.
- `frontend/src/lib/api-session.ts` (new): `sessionInit()` is the only `cookies()` call in the frontend.
- `frontend/src/app/layout.tsx:18`: `export const revalidate = 300`. This is the ISR floor even when the build-time fetch fails.
- `frontend/scripts/check-static-routes.mjs` (new):
  - `--source` runs in `npm test`. It checks for stray `next/headers` or `cookies()`, for importers of `api-session` that are not on the allowlist, and that the layout `revalidate` equals `PUBLIC_REVALIDATE_SECONDS`.
  - `--build` runs as `postbuild`. It fails if any page route is missing from `prerender-manifest.json` and is not in `ALLOWED_DYNAMIC_ROUTES` (empty).
- `frontend/package.json`: `test` adds `--source`, and a new `postbuild` runs `--build`. CI's `npm run build` therefore runs it.
- `frontend/AGENTS.md`: a new section, "Public pages stay static", with an example that `check-agents-examples.mjs` compiles verbatim, and one new checklist line.

## Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Baseline on main, mocks off | FAIL on main (reproduced) | `e70fc03`, `next build`, `NEXT_PUBLIC_USE_MOCKS`/`NEXT_PUBLIC_API_BASE_URL` unset: `ƒ /`, `ƒ /_not-found`, `ƒ /style-guide`; `prerender-manifest.json` routes `[]`. |
| 2 | Route table, mocks off, API URL unset (clean clone) | PASS | `○ /`, `○ /_not-found`, `○ /style-guide`, all with Revalidate `5m`, Expire `1y`. The full table is in the PR body. postbuild: "/_not-found ISR 300s, / ISR 300s, /style-guide ISR 300s … PASS". |
| 3 | Build with the backend down | PASS | `NEXT_PUBLIC_API_BASE_URL=http://localhost:59999` (nothing listening): build exit 0 with the same table, all ○ 5m. |
| 4 | Build with a backend up | PASS | `:4000` (a running Nest backend; `/health` → `{"status":"ok","database":"up"}`; `/api/v1/navigation` → 404, so the build falls back): all ○ 5m. A logging stub on `:4100` serving `/api/v1/navigation` and `/api/v1/settings/public` from the seed fixtures, with label `StubNav<n>`: all ○ 5m. The stub logged exactly 1 navigation and 1 settings request, both `cookie=null`. `.next/server/app/index.html` contains `StubNav1`, so the real API data was baked in. |
| 5 | Product and collection routes | N/A, none exist | `find frontend/src/app -type f`: `error.tsx, globals.css, layout.tsx, loading.tsx, not-found.tsx, page.tsx, providers.tsx, style-guide/{ComponentShowcase.tsx,page.tsx,registry.ts}`. There is no `products/` or `collections/` directory. The header links to `/products?category=…` (`lib/mocks/navigation.ts:17-41`) go to the 404 page today. When those routes land, postbuild fails unless they are ○/● (check 9). |
| 6 | Runtime: served from cache, no cookie forwarded | PASS (was FAIL) | Branch `next start` against the stub, 3 requests carrying `Cookie: session=abc123`: `x-nextjs-cache: HIT`, `Cache-Control: s-maxage=300, stale-while-revalidate=31535700`, and **0** stub requests. Main, same setup: `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, and 6 stub requests (2 per view), each with `cookie="session=abc123"` forwarded. |
| 7 | ISR regenerates after 300s | PASS | At build time + 5m46s: request 1 `x-nextjs-cache: STALE` (still `StubNav1`). The stub logged one navigation and one settings fetch, `cookie=null`. Request 2: `HIT` with `StubNav8`, the fresh data. |
| 8 | Guard: source check red (rule 3) | PASS | Putting `await import('next/headers'); cookies()` back into `httpRequest` gives "FAIL: lib/api.ts: imports next/headers … FAIL: lib/api.ts: calls cookies()", exit 1. Importing `api-session` in `app/page.tsx` gives "FAIL: app/page.tsx: imports lib/api-session.ts …", exit 1. Layout `revalidate = 60` gives "FAIL: app/layout.tsx revalidate 60 != lib/api.ts PUBLIC_REVALIDATE_SECONDS 300", exit 1. Restored: PASS. |
| 9 | Guard: postbuild red (rule 3) | PASS | Same `cookies()` reintroduction, then `npm run build`: table `ƒ` ×3, "FAIL: / renders per request …" ×3, `npm run build` exit 1. Making `getNavigation` use `{ cache: 'no-store' }` (which the source check does not catch): `ƒ` ×3, postbuild FAIL, exit 1. Restored: ○ ×3, PASS. |
| 10 | AGENTS.md example compiles verbatim, and goes red | PASS | `npm test`: "PASS: 2 AGENTS.md example(s) typecheck verbatim." Changing it to `api.getCart(await sessionInit())`: "TS2345: Argument of type 'SessionInit' is not assignable to parameter of type 'MockSwitch \| undefined'", then "FAIL: an AGENTS.md example does not typecheck". Restored. |
| 11 | Mock mode unaffected | PASS | `NEXT_PUBLIC_USE_MOCKS=true npm run build`: ○ ×3, 5m, postbuild PASS. |
| 12 | Browser render, no regression (rule 1) | PASS | Chrome on branch `next start` (clean clone) with a `session` cookie set, at 375 and 1280: status 200; `x-nextjs-cache: HIT`; h1 "Pure geometry. Enduring brassware."; 9 header controls; 26 footer links; `scrollWidth` equal to the viewport; only the `:3048` origin requested; 0 non-404 console errors. Main gives the same h1 and counts (9/26), with `no-store` headers. Screenshots on the box: `/workspace/s3/shots/{home,main-home}-{375,1280}.png`. |
| 13 | Rule 8: built client output | PASS | The shared client chunks have the same content hashes on main and the branch (`chunks/131-445671fb2fcaaadf.js`, `chunks/c7879cf7-b5ab1053c1d9a2e7.js`). The change is server-side rendering mode only. |
| 14 | Clean-clone verify | PASS | Fresh clone of `9bb4ad4`, 0 node_modules, `npm ci` exit 0. Frontend `lint` "✔ No ESLint warnings or errors", `typecheck` exit 0, `test` exit 0 (ui checks, AGENTS examples, static source check), `build` exit 0 (table above, postbuild PASS). Root `typecheck`, `lint`, `test`, `build` all exit 0. |

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | None open on this branch. | — | — | — |

## Questions

1. **Outage during regeneration.** `lib/navigation.ts` catches any API error and returns the seed fixtures. With ISR, a regeneration during an API outage caches the seed navigation for up to 5 minutes, replacing the last good page. Before this change, the same outage showed seed data on every request. Should production throw instead, so that Next keeps serving the last good page? I left this for the owner of `navigation.ts`, and Dev C should confirm.
2. **On-demand revalidation.** Every public read is tagged (`CACHE_TAGS` in `api.ts`). Phase 2 "revalidate on publish" (`docs/prompts/dev-c-public-web.md:386`) needs a route handler that calls `revalidateTag`, plus a shared secret with the backend. Nothing calls it yet, so a CMS edit can take up to 5 minutes to show.
3. **`loading.tsx` is now rarely visible.** Static pages render instantly, so `app/loading.tsx` only shows on client navigation while an RSC payload is in flight.
4. **Browser cart calls** keep `credentials: 'include'` and are unaffected. No public page calls them on the server.

## Honesty line

The "backend up" build used another agent's Nest backend on `:4000`, where `/api/v1/navigation` is 404, so it exercised the fallback path. The real-data path was exercised against a logging stub on `:4100` serving the seed fixtures. I did not run a backend from `docs/08-local-backend.md` with seeded navigation. No product or collection routes exist, so ● (SSG with params) was not exercised. CI results are in the PR, not here.

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | Yes (#12), plus response headers (#6, #7). |
| 2 | 2 | Mock vs real API checked? | Yes. Mocks off for every build except #11. Real HTTP fetches against a stub (#4, #6, #7) and against a down or unrelated backend (#3, #4). |
| 3 | 3 | Broke each drift test and watched it go red? | Yes (#8, #9, #10). |
| 4 | 4 | Clean clone, npm ci at root? | Yes (#14). |
| 5 | 5 | Another app imported and rendered the library? | Yes. The frontend layout renders through the changed client (#12). There is no other consumer of `lib/api.ts`. |
| 6 | 6 | Doc examples typechecked verbatim? | Yes (#10). |
| 7 | 7 | One owner per shared type, importer, failing test? | Yes. `PUBLIC_REVALIDATE_SECONDS` is owned by `api.ts`, the layout literal is checked against it (#8), and `SessionInit` is owned by `api.ts`. |
| 8 | 8 | Built before and after for shared config change, diffed? | Yes (#1 vs #2, #13). |
| 9 | 9 | Published shape first, AGENTS.md example, verbatim test? | Yes. `sessionInit()`/`SessionInit` shape, example in `frontend/AGENTS.md`, verbatim test (#10). |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed in docs/reviews as `<branch>-<date>.md`? | Yes. This file. |
| 12 | reviews/README | Every row's evidence is file:line, output, or measured value? | Yes. |

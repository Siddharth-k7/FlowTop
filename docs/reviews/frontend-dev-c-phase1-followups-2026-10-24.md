# frontend-dev-c-phase1-followups, 2026-10-24

Branch `frontend-dev-c-phase1-followups` off `main` at `98b2037`. Dev C's Phase 1 follow-ups: style-guide gaps, `packages/ui` a11y items, the four CSS-sweep behaviour changes, Phase 1 checks 8 and 9, a real render of `app/loading.tsx`. (The slash form `frontend-dev-c/phase1-followups` cannot be created because a branch named `frontend-dev-c` already exists on origin.)

Measured in Chrome (playwright-core + `/usr/bin/google-chrome`) against `next start` production builds:

- **before**: `65201d7`, the build before the preset `extend` fix (port 3002).
- **main**: `98b2037` (port 3001).
- **branch, mock**: this branch built with `NEXT_PUBLIC_USE_MOCKS=true STYLE_GUIDE=on` (port 3000).
- **branch, clean**: this branch from a fresh clone, plain `npm run build`, served with `STYLE_GUIDE=on` (port 3003).

The screenshots are on the review box under `/workspace/dev-c-followups/`, not in the repo.

## Verdict

Mergeable once CI is green. Every item below is PASS. Several "gaps" were already closed on `main`; they are reported with measurements, not re-done. The real defects found on the way were rows that did not reorder on sort, dangling `aria-controls` in Tabs, Menu and Header, a dangling Checkbox `aria-describedby`, a duplicate ToastProvider and an unannounced loading boundary. All are fixed and guarded by a test that was proven red.

## Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Table: sorting reorders rows | PASS (was FAIL on main) | On main, clicking SKU changed `aria-sort` but the rows stayed `FLW-BSN-101, SHW-204, VLV-309`. On branch, SKU desc gives `FLW-VLV-309, FLW-SHW-204, FLW-BSN-101` and Inventory asc gives `6, 18, 42 units`. Fix: `sortedInventory` useMemo at `frontend/src/app/style-guide/ComponentShowcase.tsx:92-104`. Doc at `packages/ui/COMPONENTS.md` §7 says the caller sorts. |
| 2 | Table: loading state | PASS | "Toggle loading" (`ComponentShowcase.tsx:673`) gives `<table aria-busy="true">` with 3 `tr.animate-pulse` rows (measured at 360px, branch clean). `aria-busy` was added at `packages/ui/src/components/Table/Table.tsx:59`; main had none. The separate loading demo table already existed on main (3 skeleton rows). Screenshot: `table-loading-360-final.png`. |
| 3 | Table: empty state | PASS | "Toggle empty" (`ComponentShowcase.tsx:681`) gives 1 row, "No products match… Clear filter". Screenshot: `table-empty-360-final.png`. |
| 4 | Button loading and disabled for secondary, ghost, danger | PASS, already on main | At 360px on main and branch, each of primary, secondary, ghost and danger has Loading (`aria-busy="true"`, `disabled`) and Disabled (`disabled`). Screenshot: `demo-button-360-final.png`. No change needed. |
| 5 | Disabled Tab | PASS, already on main; `aria-disabled` added | "CAD & 3D BIM (Disabled)" has `disabled=true` on main and branch. Branch adds `aria-disabled` at `Tabs.tsx:253`. Arrow keys skip it (filter at `Tabs.tsx:167`). Screenshot: `demo-tabs-360-final.png`. |
| 6 | Switch 44px hit height | PASS, already on main | 3 visible switches measure button 48×44 and track 48×24 (main and branch). The 4th switch is in a closed modal (0×0). Guarded by `packages/ui/test/aria.test.mjs` "Switch: the hit area…" |
| 7 | Tabs `aria-controls` → panels not in DOM | PASS (was FAIL) | Main: only the selected tab had `aria-controls`. A `TabList` with no `TabPanel` dangled (test red on main, see #16). Branch: all 4 tabs point at panels in the DOM (`controlsInDom: true` ×4). Inactive panels have `hidden` and do not mount children. Code: `Tabs.tsx:255`, `:288`, `:299`. |
| 8 | Field `aria-describedby` dangling | PASS (Field was fine; Checkbox was FAIL) | Field: 0 danglers after Trigger Error and after Clear Error. The test found Checkbox `{hint, error}` referencing `_R_0_-hint` while the hint was hidden. Fixed at `Checkbox.tsx:51-52,129`. Also covered: Input, Select, Textarea, Switch, Radio, RadioGroup. |
| 9 | Table rows mouse-only | PASS, already on main | Tab from the last header lands on `button in-tbody=true` for every row (main and branch). Guarded by the "Table: clickable rows…" test. |
| 10 | Toast live region mounted up front | PASS; duplicate removed | Before the first toast there is `alert/assertive` + `status/polite`, children 0. Main had 4 regions, because the showcase nested a second ToastProvider inside `app/providers.tsx:7`. Branch has 2 (`ComponentShowcase.tsx:48`). |
| 11 | Other dangling ARIA ids on the page | PASS (was FAIL) | Main at 1280, closed: `mobile-navigation-drawer`, `dropdown-panel-nav-products`, `dropdown-panel-nav-collections`. Main at 360 with the drawer open: `dropdown-panel-*` ×2 and `…-menu`. Branch: `[]` closed, with a dropdown open, and with the drawer open. Fix: `Header.tsx:153,214`, `Menu.tsx:170`. |
| 12 | Sweep: Header dropdown `w-72` (`Header.tsx:246`) | PASS, keep | Products panel at 1280: before 133px wide × 464px tall, labels wrapped to 2 lines and descriptions truncated to ~12 chars. main/branch 288px × 364px, one line each, 0 overflowing links. Intended. Screenshots: `header-dropdown-1280-{before,main,final}.png`. |
| 13 | Sweep: Skeleton card `h-48` (`Skeleton.tsx:17`) | PASS, keep | The `variant="card"` classes measure 2px before (border only, `h-48` not generated) and 192px on main and branch. A 2px card skeleton is a bug, so 192px is the intended value. Screenshots: `skeleton-card-640-{before,main,branch}.png`. `variant="card"` has no frontend caller today. |
| 14 | Sweep: `transition-*` defaults vs motion tokens | PASS, fixed | Header `.transition-colors` timing function: before `ease`, main `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind built-in), branch `cubic-bezier(0.2, 0, 0, 1)`, which is `--ease-standard` (`tokens.css:177`). Duration is 0.15s in all three, `--duration-fast` (`tokens.css:179`). Preset DEFAULTs at `tailwind-preset.cjs:190-201`. Under reduced motion all three compute `1e-05s` (`base.css:78` forces 0.01ms). |
| 15 | Sweep: `font-mono` now applies | PASS, keep | 78 `.font-mono` elements (hex/token values such as `#5B2A86`). Before they computed to the body sans stack; main/branch compute `ui-monospace, SFMono-Regular, Menlo, …, monospace`. There is no `--font-mono` token (`tokens.css:77-78` has display and body only), so the Tailwind mono stack is kept. Screenshots: `font-mono-1280-{before,main,final}.png`. |
| 16 | ARIA guard test fails when broken (rule 3) | PASS | `packages/ui/test/aria.test.mjs` against main's Tabs, Menu and Checkbox gave 4 failures: "one aria-controls per tab 1 !== 3", "Tabs composed: dangling", "Menu closed: dangling", "Checkbox {hint,error}: dangling". Removing `touch-target` from Switch, the row button from Table, the up-front Toast container and Table `aria-busy` each turned their test ✖. All restored; 33/33 pass. |
| 17 | Check 8: mock mode, backend off, every route | PASS | Build with `NEXT_PUBLIC_USE_MOCKS=true`, no `NEXT_PUBLIC_API_BASE_URL`, no `.env`. Of the 27 routes (/, /style-guide, a junk URL and every `href` on `/`), `/` and `/style-guide` return 200 and the other 25 return 404 on the not-found page "Page or Fitting Not Found". 0 failed requests, 0 non-404 console errors. The browser made no request to any origin but :3000. The 16 console 404s on `/` are all router prefetches of unbuilt routes (`/cart`, `/products`, …). Screenshots: `check8-375-*.png` (27). |
| 18 | Check 9: shared types imported, private copies gone | PASS | `frontend/package.json:17` `"@flowtop/types": "file:../shared/types"`. Imports at `api.ts:31`, `mocks/index.ts:29`, `types-pending.ts:8`. Removed: `PaginationMeta`, `PaginatedResponse`, `ApiErrorEnvelope`, private `MediaAsset`. `User`: N/A, the frontend has no user type (public site, no auth). |
| 19 | Check 9: mismatches the compiler finds | PASS | Swapping the types with the mocks unchanged gave tsc exit 0: no mock carried a MediaAsset or error envelope, and the meta already matched. A gallery item in the old private shape gave exit 2: `products.ts(32,7): TS2739 … missing … 'MediaAsset': filename, createdAt` and `mocks/index.ts(187,12): TS2322 … 'gallery' are incompatible`. Fixed at `products.ts:36,43`, then exit 0. Contract differences that compile: `width/height: number \| null`, `variants` keys optional, `ErrorEnvelope.code` is the `ErrorCode` union (was `string`), `fields?` added. |
| 20 | Check 9: drift guard proven red | PASS | `mockApiError(404, 'NOTFOUND', …)` gives `TS2345 … not assignable to parameter of type 'ErrorCode'`, exit 2. `meta.per_page` gives `TS2561 … Did you mean to write 'perPage'?`, exit 2. Both restored, exit 0. |
| 21 | `loading.tsx` rendered for real at 375/640/1280 | PASS | Clean build, `/` is ƒ. Navigated `/style-guide` → `/` with the navigation's RSC response held, so Next showed `app/loading.tsx`: 28 skeletons; hero 320px at 375 and 384px at 640/1280 (`h-80 sm:h-96`); card image 192px; CTA 44px; `scrollWidth == viewport` at all three. Screenshots: `loading-{375,640,1280}.png`. |
| 22 | `loading.tsx` announced | PASS (was FAIL) | Main had `aria-label` on a generic div, which is not exposed. Branch: `role="status"` at `loading.tsx:6`; Chrome a11y snapshot `status "Loading page content"`. |
| 23 | Rule 8: preset change, built CSS diff | PASS | Full rule-set diff of the main vs branch frontend CSS: exactly 5 rules changed (`.transition-{all,colors,opacity,shadow,transform}`, `cubic-bezier(.4,0,.2,1)/.15s` → `var(--ease-standard)/var(--duration-fast)`), 0 others. |
| 24 | Backward-compatible `packages/ui` API | PASS | No export, prop or type removed or renamed. Tabs, Menu, Checkbox and Table changes are attributes only. `ui-test` 33/33, including the COMPONENTS.md snippet compile. |
| 25 | Clean-clone verify | PASS | Fresh `git clone`, 0 node_modules dirs, `npm ci` exit 0 (Node v24.22.1). `packages/ui`: `npm test` 33/33, `lint` exit 0, `check` exit 0. Frontend: `lint` "✔ No ESLint warnings or errors", `typecheck` exit 0, `test` "PASS: 1 AGENTS.md example(s) typecheck verbatim.", `build` exit 0 (/, /_not-found, /style-guide). Root `build`, `test`, `lint`, `typecheck` all exit 0. |

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | None open on this branch. | — | — | — |

## Questions

1. **Header `w-72`: intended?** Yes, keep. Before the fix the panel shrank to 133px and wrapped every label (#12).
2. **Skeleton card `h-48`: intended?** Yes, keep. Before, it was a 2px line (#13).
3. **`transition-*` 150ms plus easing: matches the motion tokens?** The duration did. The easing was Tailwind's, not `--ease-standard`. It is now token-driven (#14, #23).
4. **`font-mono` now applies: intended?** Yes, keep. Hex and token values read as code. Add a `--font-mono` token only if design wants a branded mono (#15).
5. **Mock mode with the backend off: does every route work?** Yes (#17).
6. **Contract mismatches?** `filename`, `createdAt`, the nullable dimensions, and the `ErrorCode` union (#19).
7. **Something for the owners:** a mock build prerenders `/` statically (○), while a real build is dynamic (ƒ), because `getNavigation` → `api.ts:129` calls `cookies()` only outside mock mode. So `loading.tsx` can only be seen in a real build. Is that intended?

## Honesty line

Not verified, and why:

- **Real backend:** I did not call one. No frontend route calls a list or media endpoint yet. I made one GET to a backend already running on :4000 from another worktree. It returned `{"error":{"code":"NOT_FOUND","message":"…"}}`, which matches `ErrorEnvelope`. Media endpoints are behind `/admin` auth and were not called.
- **Dev D's admin:** not rendered against this `packages/ui` because it is not on `main`. The only consumer checked is the frontend.
- **Browsers:** Safari and Firefox were not tested, and no real screen reader was used. The a11y evidence is DOM attributes plus the Chrome a11y snapshot.
- **Screenshots:** they stay on the box and are not committed.
- **CI:** the CI run is reported in the PR, not here.

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | Yes. Checks 1-15, 17, 21-22 are measured in Chrome. |
| 2 | 2 | Mock vs real API checked? | Yes. Mocks are now typed against `@flowtop/types`, and the error envelope was compared against a running backend. Media endpoints were not called (honesty line). |
| 3 | 3 | Broke each drift test and watched it go red? | Yes. #16 (8 ARIA tests), #20 (ErrorCode, perPage), plus the AGENTS.md example (`'NOTFOUND'` → "FAIL: an AGENTS.md example does not typecheck"). |
| 4 | 4 | Clean clone, npm ci at root? | Yes (#25). |
| 5 | 5 | Another app imported and rendered the library? | Yes. The frontend renders every changed component (#1-#11). Admin is N/A because it is not on main. No endpoints shipped. |
| 6 | 6 | Doc examples typechecked verbatim? | Yes. COMPONENTS.md snippets are compiled by `test/components.test.mjs`. The new `frontend/AGENTS.md` example is compiled by `frontend/scripts/check-agents-examples.mjs` in `npm test`. |
| 7 | 7 | One owner per shared type, importer, failing test? | Yes. `@flowtop/types` owns them, the frontend imports them, and the frontend typecheck fails on drift (#19, #20). |
| 8 | 8 | Built before and after for preset change, diffed? | Yes (#23). |
| 9 | 9 | Published shape first, AGENTS.md example, verbatim test? | Yes for `mockApiError`: shape in `mocks/index.ts:35`, example in `frontend/AGENTS.md`, verbatim test in `check-agents-examples.mjs`. No other new cross-team shape. |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed in docs/reviews as `<branch>-<date>.md`? | Yes. This file. |
| 12 | reviews/README | Every row's evidence is file:line, output, or measured value? | Yes. |

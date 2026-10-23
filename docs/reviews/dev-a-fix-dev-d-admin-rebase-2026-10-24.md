# dev-a/fix/dev-d-admin-rebase, 2026-10-24

A rebased copy of `dev-d/feat/admin-shell@888e40b`, rebased onto `main@98b2037`, with the Phase 1 review fixes on top.
Dev D's branch was not touched: no push and no force-push to `dev-d/feat/admin-shell`, and its remote head is still `888e40b`.
Dev D's two commits keep him as author (`29a3967`, `7b9fe6e`). The fixes are five commits by Dev A on top (`54c6089`..`f2353a8`).

## Verdict

Mergeable once CI is green and Dev D has compared it with his branch. Admin typecheck, lint, test (38 at f2353a8, 40 now) and build pass. The clean-clone run was at f2353a8. The real-API browser run reported 33/33, but that was **32 real checks plus 1 vacuous one (PM 5)**. PM 5 is now fixed and proven red/green (see "PM 5: correction and fix"). Nothing is blocked inside this branch. Two items wait on others: the GitGuardian false-positive mark (the user, in the dashboard) and the Phase 4 `/admin/dashboard` endpoint (Dev B).

## Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Rebase onto main 98b2037, clean | PASS | `git log --oneline`: 29a3967, 7b9fe6e on 98b2037, no conflicts |
| 2 | Tailwind: preset + tokens via package imports, no duplicate spacing/zIndex/font/screens, packages/ui in content | PASS | admin/tailwind.config.ts:1-12; admin/src/app/globals.css:1 `@import "@flowtop/ui/tokens.css"` |
| 3 | borderRadius.lg renamed so the preset's lg (40px) is not overridden | PASS | `rounded-card` measured on /login AuthCard: borderRadius `14px` (measure.json) |
| 4 | Screens: no custom `sm: 360px`; `xs:` used | PASS | Topbar.tsx `xs:block`; 360px overflow measured below |
| 5 | Renders with the preset (rule 1) | PASS | computed on /login: submit bg `color(srgb 0.3569 0.1647 0.5255)` = #5B2A86, min-height `44px`; label colour ink `0.086,0.071,0.110`, not purple; input radius `12px` |
| 6 | nav.ts uses the Permission union with the real read perms | PASS | admin/src/components/shell/nav.ts:4-18; typo `product:wrote` → `TS2820 ... Did you mean "product:read"?` |
| 7 | admin/src/types deleted; User, MediaAsset, ErrorEnvelope and Paginated come from @flowtop/types | PASS | `git show --stat 80e0d8f` deletes admin/src/types/index.ts; `grep -rn "@/types" admin/src` → nothing |
| 8 | Mock users derived from ROLE_PERMISSIONS (compile-checked) | PASS | admin/src/lib/mocks/roles.ts:12 `ROLE_GRANTS: ROLE_PERMISSIONS`; removing `media:read` from product_manager → `TS2322 Type '"media:write"' is not assignable to type '"media:read"'` (exit 2), restored |
| 9 | eslint-config-next, lint script, vitest, test script, engines node >=24 | PASS | admin/package.json; `npm run lint` → no output (0 problems); `npm test` → `Tests 40 passed (40)` (6 files, after the PM 5 fix) |
| 10 | Real tests: formatPrice, validateFile, assetName, api() error mapping | PASS | admin/src/__tests__/{formatPrice,media,api}.test.ts; flipping the 403 assertion → `1 failed / 37 passed`, restored |
| 11 | Mock identities on @example.test, one MOCK_PASSWORD, flowtop123 gone | PASS | `git grep flowtop123 HEAD` → nothing; admin/src/lib/mocks/auth.ts `MOCK_PASSWORD` |
| 12 | Mocks opt-in, dynamic import, production build refuses mocks | PASS | api.ts:8 `=== 'true'`, api.ts:45 `await import`; `NEXT_PUBLIC_USE_MOCKS=true next build` → `Error: NEXT_PUBLIC_USE_MOCKS=true is not allowed in a production build`; next-config.test.ts |
| 13 | media.ts upload: never hangs, reuses BASE + handleStatus | PASS | media.ts `settleUpload`; tests: 502 HTML → rejects SERVER_ERROR, empty 413 → rejects |
| 14 | LoginFlow next= same-origin | PASS | LoginFlow.tsx:20 `safeNext(next, location.origin)`; tests reject `//evil.example`, `/\evil.example`, `javascript:` |
| 15 | MediaLibrary key={sel.id} | PASS | MediaLibrary.tsx:15 |
| 16 | Dashboard tiles permission-filtered (cosmetic) | PASS | dashboard/tiles.ts; real API: product_manager tiles `["Add Product","Add Collection","Upload Media"]` |
| 17 | @flowtop/ui Button/Input/Select/Textarea/Card/Modal/Table replace ui-classes + FormField | PASS | `git show --stat 1ad23cf` deletes lib/ui-classes.ts and components/FormField.tsx; screenshots below |
| 18 | t27u-1 drawer traps focus and restores it | PASS | Shell.tsx:34 `useFocusTrap`; 360px: first focus `Close menu`, after 12×Tab still inside `true`, after Shift+Tab inside `true`, Escape → focus `Open menu` |
| 19 | t27u-2 user menu: arrows, Escape, outside click | PASS | Topbar.tsx:33-52; ArrowDown → focus role `menuitem`, wrap → `Log out`, Escape → menu closed and focus on the button, outside click → 0 menus |
| 20 | t27u-3 breadcrumb keys + duplicate Home/Dashboard | PASS | Topbar.tsx:16 `key={c.href}`; /dashboard crumbs `["Home"]`; test: `/pages/pages/new-page` gives 4 unique hrefs |
| 21 | t27u-4 toast timers cleared per toast and on unmount | PASS | lib/dismiss-timer.ts; tests: second show restarts (hidden only after 6s from it), dispose → `vi.getTimerCount() === 0` |
| 22 | t27u-5 Delete hidden without media:delete (cosmetic) | PASS | MediaDetail.tsx:21; product_manager: `Delete buttons in detail panel: 0`; forced `DELETE /admin/media/:id` → `403` |
| 23 | Toast live region mounted up front | PASS | Shell.tsx:70; product_manager on /users: toast text read from `[role=status][aria-live=polite]` |
| 24 | Clean clone: npm ci + root typecheck/lint/build/test | PASS | fresh `git clone` of this branch → `npm ci` 0, `npm run typecheck` 0, `lint` 0, `build` 0 (frontend, admin, ui), `test` 0 |
| 25 | gitleaks on the branch | PASS | gitleaks 8.30.1 `git --log-opts=98b2037..HEAD` → `7 commits scanned ... no leaks found` |
| 26 | Root package-lock change is additive only | PASS | package-lock diff against 98b2037: 0 removed, 0 version changes, 95 added (the admin workspace's deps) |
| 27 | GitGuardian incident for flowtop123 | PARTIAL | flowtop123 is gone from the tree but still in history (`git log -S flowtop123` → 29a3967, 80e0d8f). Marking it as a false positive is pending for the user in the GitGuardian dashboard |
| 28 | PM 5: product_manager does not see the orders/submissions tables | PASS (was vacuous, now fixed) | src/__tests__/dashboard.test.ts plus the real-API check with a stubbed 200 summary. Both go red with the filter removed (see "PM 5: correction and fix") |

### Step 3: real API, mocks OFF, headless Playwright (Chromium 156)

Setup: API `localhost:4000` (`backend npm run start:dev`, Postgres 17 on 5433, migrated and seeded). Admin is a production `next start` with `NEXT_PUBLIC_USE_MOCKS` unset. Two deviations from docs/08:
- The admin ran on port 3011, not 3001. Port 3001 on the shared box was taken by another agent's frontend, so I added 3011 to `CORS_ORIGINS` and `ADMIN_URL` in the gitignored backend/.env.
- Postgres was installed natively, not through docker compose (no Docker on the box).

Run: 2026-10-24, about 04:36:10 to 04:37:06 IST, on a freshly started backend (pid 65600, started 04:36:08 IST, "Nest application successfully started" 04:36:09). Script: /workspace/dev-d-phase1/step3-run.mjs. Log: /workspace/dev-d-phase1/step3-run.log. **Reported 33/33. Corrected: 32 real checks + 1 vacuous (PM 5).** PM 5 passed only because `/admin/dashboard` returns 404, and `Dashboard.tsx:54` then renders the error card instead of the tables for every role, super_admin included. So it never tested the permission filter. It is fixed below.

| check | result |
|---|---|
| MFA first login (seed super_admin, no MFA) | `POST /auth/login 200`, requiresMfa=false, mfaSetupRequired=true → `/mfa-setup` |
| MFA enrol | `POST /auth/mfa/setup 200` (key length 32) → `POST /auth/mfa/verify 200`, 8 recovery codes → /dashboard; `POST /auth/logout 204` |
| Login with TOTP | `POST /auth/login 200 requiresMfa=true` → `POST /auth/mfa 200` → /dashboard |
| Login with a recovery code | `POST /auth/mfa 200` → /dashboard. Reusing the same code → `401`, UI: "That code is not valid. Check your authenticator app and try again." |
| Upload image | `POST /admin/media/upload 201`, filename=e2e-upload.png, createdAt=2026-10-23T23:07:00.699Z (04:37 IST) |
| Grid shows filename + createdAt | tile text `e2e-upload.png · 164 B · 24 Oct 2026 · Needs alt text` |
| assetName fallback never fires | every tile name equals the API `filename`, none empty; every item has `createdAt` |
| Edit alt | `PATCH /admin/media/:id 200`, alt round-trips; UI "Alt text saved." |
| List view (ui Table) | row count equals the API item count |
| Delete unused | `DELETE /admin/media/:id 204`, tile gone |
| Delete in-use (product_media row inserted by SQL) | `DELETE 409 CONFLICT` "This file is still in use: product "E2E Lounge Chair" (main image). Remove it from there first." The UI shows the same text |
| PDF filter | `GET /admin/media?perPage=100&search=&type=document → 200`, items `["e2e-spec-sheet.pdf application/pdf"]`, no 422 |
| product_manager (invite + dev-email reset) | `POST /admin/users/invite 201`, `POST /auth/password-reset 202`, confirm `204` |
| product_manager menu | `["Dashboard","Products","Categories","Collections","Pages","Media"]` |
| PM 5: no orders/submissions tables for product_manager | **vacuous in this run**: `table captions: []`, but only because the 404 hid the tables for every role. Fixed and re-proven in "PM 5: correction and fix" |
| Forced fetch to a forbidden resource | `GET /admin/users 403 FORBIDDEN` "You do not have permission to do this."; /users shows the denied card and the toast |
| 360px overflow | /media scrollWidth 360 = innerWidth 360; /dashboard 360 = 360 |

All API 4xx seen, with expected or unexpected:
- `GET /auth/me 403`: expected (MFA_SETUP_REQUIRED before enrolment).
- `POST /auth/mfa 401`: expected (reused recovery code).
- `DELETE /admin/media/:id 409`: expected (in use).
- `GET /admin/users 403` ×2 and `DELETE /admin/media/:id 403` for product_manager: expected (forced).
- `GET /admin/dashboard 404` ×7: **unexpected for a real dashboard**. The endpoint does not exist yet (Phase 4, Dev B). The admin now shows "The dashboard summary is not available yet." instead of the raw `Cannot GET /api/v1/admin/dashboard`.

There were no page errors. The only console errors are the browser's own "Failed to load resource" lines for the 4xx above.

### PM 5: correction and fix

The fix has two parts, and both fail when the filter is removed:

1. **Unit test, runs in CI:** `admin/src/__tests__/dashboard.test.ts`.
   - It server-renders `Dashboard` inside `UserContext` for the mock super_admin and the mock product_manager. Both users' permissions come from `ROLE_PERMISSIONS`.
   - It asserts that the super_admin markup contains "Recent orders" and "Recent submissions", and that the product_manager markup contains neither.
   - `vitest.config.mts` now sets `esbuild.jsx = 'automatic'` so components can render in tests (tsconfig keeps `jsx: preserve` for Next).
   - Limitation: server rendering runs no effects, so this test pins the gate but not the data rows.
2. **Real-API check, not in CI:** `/workspace/dev-d-phase1/dashboard-pm5.mjs`.
   - Login, MFA enrolment, invite and password reset all go through the real API. Only `/admin/dashboard` is stubbed, by Playwright route interception, to a 200 with one order (`FT-STUB-ORDER-1`) and one submission (`Stub Submitter`).
   - It waits for the stub's "Draft pages" stat, which proves the data arrived, then reads the table captions and row text.
   - The stub was served to both roles.

Red, with the filter removed (`{canSee(permissions, 'order:read') && (` and the submission one replaced by `{true && (`). Admin rebuilt and restarted:

```
=== VITEST
   ✓ ... > super_admin sees Recent orders and Recent submissions
   × ... > product_manager sees neither table
AssertionError: expected '<div class="flex flex-col gap-8"><sec…' not to contain 'Recent orders'
      Tests  1 failed | 1 passed (2)
=== PLAYWRIGHT (05:23:38 IST)
PASS PM 5a: super_admin sees both tables with the stubbed rows :: captions=["Recent orders","Recent submissions"] orderRow=1 submissionRow=1
FAIL PM 5b: product_manager sees neither table though the stub has rows :: captions=["Recent orders","Recent submissions"] orderRow=1 submissionRow=1
end ...; 1/2 passed   (exit 1)
```

Green, with the filter restored (`Dashboard.tsx` identical to HEAD). Admin rebuilt and restarted:

```
=== VITEST
 ✓ src/__tests__/dashboard.test.ts (2 tests)
      Tests  2 passed (2)
=== PLAYWRIGHT (05:25:26 IST)
PASS PM 5a: super_admin sees both tables with the stubbed rows :: captions=["Recent orders","Recent submissions"] orderRow=1 submissionRow=1
PASS PM 5b: product_manager sees neither table though the stub has rows :: captions=[] orderRow=0 submissionRow=0
stub served to: ["super_admin","product_manager"]
end ...; 2/2 passed   (exit 0)
```

Logs: /workspace/dev-d-phase1/pm5-vitest-red.log, pm5-red.log, pm5-vitest-green.log and pm5-green.log. Only PM 5 and the admin unit tests were re-run, not the other 32 checks.

### Backend restarts and `pkill` during testing (all times IST, 2026-10-24)

- **About 04:25:30: `pkill -f "nest start"`** (broad).
  - It ran while I moved the admin to port 3011, right after `kill 42784` (my backend).
  - The `.env` edit just before it is stamped 04:25:28.
  - The `ss` check just before it showed only my backend (pid 42784, cwd /workspace/dev-d-phase1/repo/backend) listening on :4000. I did not list `nest` processes right before it, so I can't prove no other agent's `nest` process was killed. A later listing showed only mine, and today nothing else on the box runs `nest`.
  - It happened before the final run.
- **About 04:35: `pkill -f "nest start --watch"`** (narrow).
  - It was meant to clear the in-memory MFA lockout. It matched only my watcher and missed the `dist/main` child, so the stale backend (pid 57382) kept serving, and that run crashed at MFA 3.
- **About 04:36:05 to 04:37:06: the final run.**
  - I ran `kill 57382 65084 65085`, started a fresh backend (pid 65600, up at 04:36:09), then started the run at about 04:36:10 IST.
  - pid 65600 was still serving at 04:56. There were no connection-refused errors, network errors or 5xx in the run; the only API errors were 401/403/404/409.
  - No check was retried inside the run (single script, stops at the first exception).
- **Earlier runs of the suite (8 before the final one):**
  - Five failed on harness bugs: response body lost on navigation; null login response ×2; multipart upload 422 through `route.fetch`; menu comparator reading icon text.
  - One passed 33/33 on earlier code.
  - One failed at 32/33 on a real bug: `/media` was 377px wide at 360px, fixed in f2353a8.
  - One crashed on the MFA lockout.
  - None of them failed because of a dead backend.

The first runs found five things, all fixed in `f2353a8`:
- The search input collapsed beside the ui Select.
- /media at 360px overflowed: scrollWidth 377.
- The dashboard showed the raw 404 text.
- `lg:not-sr-only` zeroed the sidebar label padding.
- The upload hint said 10 MB, but the limits are 15 MB for images and 25 MB for PDFs.

A side finding about the API: a 5th run within 15 minutes failed MFA setup. The per-user MFA lockout (5 wrong codes in 15 min, auth.constants.ts:24) had counted one deliberate reused recovery code per run. It is in-memory, so an API restart cleared it. This is working as designed.

Screenshots after the component swap:
- /workspace/dev-d-phase1/shots/media-grid-1440.png
- /workspace/dev-d-phase1/shots/media-list-1440.png
- /workspace/dev-d-phase1/shots/media-360.png
- /workspace/dev-d-phase1/shots/dashboard-1440.png
- /workspace/dev-d-phase1/shots/dashboard-360.png

### a11y list: packages/ui (Dev C), checked, not changed here

All five items are already fine on main@98b2037, so nothing is needed from Dev C:
- Switch: `touch-target` gives 44px (Switch.tsx:93, base.css:63).
- Tabs: `aria-controls` is on the selected tab, the panel has `aria-labelledby`, and unselected panels are not rendered, so there are no dangling IDREFs (Tabs.tsx:216, 254-256).
- Field: `aria-describedby` is computed from hint and error (Field.tsx:40, 61; Input.tsx:79).
- Table: with onRowClick, the first cell is a `<button>` (Table.tsx:174-183).
- Toast: both live regions render with zero toasts (Toast.tsx:400-425).

Admin's own copies were the FormField, the Shell toast and the drawer. FormField is replaced by the ui Field, the toast is fixed (row 23) and the drawer is fixed (row 18).

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | `/admin/dashboard` does not exist, so the dashboard summary is always "not available yet" | backend (Phase 4) | Dev B → dashboard counts | can wait (Phase 4) |
| 2 | flowtop123 is still in history (29a3967), and the GitGuardian incident is open | GitGuardian dashboard | the user (false-positive mark) | can wait. It is a mock placeholder, not a credential |
| 3 | The mock router ships as a lazy chunk (`.next/static/chunks/135.*.js` contains `example.test`). It is only requested when USE_MOCKS is true | admin/src/lib/api.ts:45 | nobody | can wait |

## Questions

- **Is Dev D's branch touched?** No. The only branch pushed is `dev-a/fix/dev-d-admin-rebase`, and `dev-d/feat/admin-shell` is still `888e40b`.
- **Root file changes (Dev A owns these):** only `package-lock.json`, and it is additive. Admin's `next`/`react` ranges now match frontend's (`^15.2.0`/`^19.0.0`). With the old 19.1.1 pin, packages/ui and admin loaded two Reacts, and `next build` failed with `Cannot read properties of null (reading 'useContext')`.
- **Commits per step:**
  - 54c6089 is step 1.
  - 80e0d8f is steps 2a and 2c.
  - b2b962b is step 2b plus the api/media parts of step 5.
  - 1ad23cf is step 4, the rest of step 5 and the five t27u fixes. These touch the same component files, so they share one commit.
  - f2353a8 holds the fixes from the browser run.

### Note to Dev D (for the user to send)

> Hi Pratham, I put a rebased copy of your admin work on a new branch, `dev-a/fix/dev-d-admin-rebase` (PR to main, not merged). Your branch `dev-d/feat/admin-shell` is untouched and still at 888e40b.
> What changed on top of your two commits (still yours):
> - admin uses the @flowtop/ui preset and tokens (rounded-lg → rounded-card)
> - @flowtop/types replaces admin/src/types, and nav uses real read perms
> - mocks are opt-in and use @example.test (flowtop123 is gone)
> - ESLint + Vitest are set up (38 tests)
> - ui Button/Input/Select/Modal/Table replace ui-classes
> - the PDF filter sends type=document
> - drawer focus trap, user-menu keys, breadcrumb keys, toast timers, Delete hidden without media:delete
> - same-origin `next=`
> It passed a real-API browser run (MFA, media CRUD, 409, product_manager 403). Please compare it with your branch before you next pull, and tell me if anything should go back to how you had it.

## Honesty line

Not verified:
- CI on the PR at the time of writing (see the PR checks).
- Safari and Firefox (Chromium only).
- Screen-reader output: the live regions were checked by DOM role and text, not with NVDA or VoiceOver.
- The drawer trap was checked at 360px with keyboard only, not on a touch device.
- Rule 8's before/after CSS diff was not run, because no shared preset or base config changed. Admin's tailwind.config only consumes the preset.
- Docs examples (rule 6) were not re-typechecked because no docs examples changed.
- Backend tests were not run because no backend code changed.
- The e2e run used port 3011 and a native Postgres, not docker compose on 3001.
- The real-API PM 5 check is not in CI (CI has no Playwright job). Only the unit test runs there.
- After the PM 5 fix, only PM 5 and the admin unit tests were re-run, not the other 32 browser checks.
- The clean-clone root checks were run at f2353a8, not at the PM 5 commit. CI covers the new head.
- Whether the 04:25:30 IST broad `pkill` killed another agent's process can't be proven either way.

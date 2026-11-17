# Editor save errors

### Verdict

The two save bugs are fixed on this branch. A bad `videoUrl` names that field and is shown on the input. A rejected first save writes no page. Not merged.

### Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Browser measurement of the error, the empty fields, and 360px | PASS | Chrome on `http://localhost:3001` against `node dist/main` on `http://localhost:4000`. Rejected hero: bar text `sections[0].videoUrl: Use a site path or an https, mailto or tel link.` and `[role="alert"]` `Use a site path or an https, mailto or tel link.` under Video link. Postgres at that moment: `SELECT` of `page` where title `Browser save` returned 0 rows. After the https retry, URL was `/pages/981ce9de-ce40-40c8-9364-6f68cb037ee3`, bar `Saved at 12:27:42 am`, one page, hero `videoUrl` `https://videos.example/a.mp4`. How many was empty and Media was `Choose…`; the stored carousel config has no `count` and the hero config has no `mediaType`. At 360px, `scrollWidth` and `clientWidth` were both 345, and the alert was the https sentence. |
| 2 | Real API, not mocks | PASS | The browser posts hit `http://localhost:4000`. `GET http://127.0.0.1:4000/health` from image `flowtop-api:ci` (`d44aa90a5651`) returned `{"data":{"status":"ok","database":"up"}}`. e2e uses Postgres. |
| 3 | Regression and drift tests failed, then passed | PASS | Before the fix, `section-config.spec.ts` 5 failed (message `That layout is not one of the approved presets.`). `page-create.e2e-spec.ts` 4 failed (`POST` with sections was 422 `Some fields need attention.`; a section `videoUrl` rejection used the layout sentence). Admin render did not contain `Use a site path or an https, mailto or tel link.` After the fix those tests passed. Removing `visible` from the Create page example failed `admin-types.drift.spec.ts:119`. Adding `note` to `CreatePageBody` failed `tsc` at `admin-types.drift.spec.ts:64` (`Type 'false' does not satisfy the constraint 'true'`). Both were put back. |
| 4 | Clean clone | PASS | Not a second local clone. CI run `43988292825` on `dc9392b` is the clean `npm ci`: Backend, Backend image, Frontend, Admin, UI kit, Secret scan (gitleaks), and GitGuardian Security Checks all passed. |
| 5 | A client called the changed endpoint | PASS | Admin Save Draft called `POST /api/v1/admin/pages` with the hero. e2e `backend/test/page-create.e2e-spec.ts` calls the same route and `POST /api/v1/admin/pages/:id/sections`. |
| 6 | Documented example typechecked verbatim | PASS | `shared/types/AGENTS.md` example `create-page` is typechecked by `backend/src/common/shared-types.agents.spec.ts`. The catalog example is in the same test. Other contract samples were not pasted out. |
| 7 | Shared type has one owner and a failing drift test | PASS | `CreatePageBody` and `PageSectionWrite` live in `shared/types/src/index.ts`. `backend/src/common/admin-types.drift.spec.ts` compares them to `**Create page:**` in `docs/03-api-contract.md`. |
| 8 | Shared preset diff | N/A | No Tailwind or token preset changed. |
| 9 | Shape published with the endpoint | PASS | `CreatePageBody` is in `shared/types` and the contract in this same change, with the example the agents spec typechecks. |
| 10 | Honesty line | PASS | Below. |
| 11 | Review filed under docs/reviews | PASS | This file. |
| 12 | Evidence is a file:line, command output, or a measured value | PASS | Rows above. |

### Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | Nothing left from the two save bugs. | | | |

### Questions

1. The save bar prints the API `message`. For a page create that is `sections[0].videoUrl: …` (`backend/src/pages/section-config.ts:9`). For a later section save it is `videoUrl: …`. The input shows the field sentence without the path (`admin/src/components/builder/SectionEditor.tsx:15`).

2. `POST /admin/pages` now accepts `sections` and inserts them in one transaction (`backend/src/pages/pages.service.ts:54`). A rejected section writes no page. Sending sections also requires `section:write` (`backend/src/pages/section-config.ts` `assertCanAttachSections`). Omitting `sections` still creates the page alone.

3. A cleared How many and a Choose… preset are omitted (`admin/src/components/ui/SchemaForm.tsx:14` and `:20`). If a client still sends `count: null` or `mediaType: ""`, the API says `Enter a whole number of 0 or more.` or `Choose one of: image, video.` (`backend/src/pages/section-schema.ts:86` and `:90`).

### Honesty line

Not verified: a second fresh clone on this machine with every `node_modules` deleted (CI run `43988292825` did that install and passed 7/7); every code sample in `docs/03-api-contract.md` pasted into a typecheck; a super-admin MFA login in the browser (the browser used `marketing_admin`); the public site rendering the saved hero. CI on `dc9392b` is run `43988292825`: Backend, Backend image, Frontend, Admin, UI kit, Secret scan (gitleaks), and GitGuardian Security Checks all passed.

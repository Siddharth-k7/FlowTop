# PR 24 re-audit fixes

Follow-up to `ed190e2515de9dbe75d6f84ff88bced7c1fcdccb`.

### Verdict

The re-audit hold items are fixed on this branch. Merge still waits on CI for this head.

### Checks

| # | check | result | evidence |
|---|---|---|---|
| 1 | Browser | PASS | Chrome against `http://localhost:3001` and the new image on `http://localhost:4000`. CTA `javascript:alert(1)` returned `422` and the stored row is `cta.href` `/products`. Navigation `javascript:` returned `PUT 422`. A three-level menu then `PUT 200` and the table is Shop, Brass, Grand, all https. |
| 2 | Real API | PASS | Adversarial e2e on Postgres. Before the fix: 2 failed, 17 passed. After: 19 passed. |
| 3 | Drift red | PASS | `NAVIGATION_MAX_CHILD_DEPTH = 3` made `tsc` report `admin-commerce.drift.spec.ts(60,25): error TS2344: Type 'false' does not satisfy the constraint 'true'`. Restored to `2 as const`. |
| 4 | Clean clone | PARTIAL | `npm ci` was already done this VM. No second clone. |
| 5 | Client called the paths | PASS | Browser above and `audit-adversarial.e2e-spec.ts`. |
| 6 | Doc samples | N/A | No contract sample was rewritten. |
| 7 | Shared type | PASS | `NavigationMaxChildDepth` in `shared/types/src/index.ts`, locked to the service constant. |
| 8 | Preset diff | N/A | No Tailwind preset change. |
| 9 | Shape first | PASS | The depth limit is the shared type the service constant satisfies. |
| 10 | Honesty | PASS | Below. |

### Honesty line

Not verified: a second git clone; CI on this new head until the run finishes; a fourth menu level clicked in the browser (the API test sends a valid https great-grandchild and expects 422); public ISR against a live API.

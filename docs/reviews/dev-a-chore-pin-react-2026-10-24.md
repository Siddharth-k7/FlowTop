# dev-a/chore/pin-react, 2026-10-24

Branch `dev-a/chore/pin-react` off `main` at `e70fc03` (merge of PR #14). One change: the root `package.json` gains

```json
"overrides": { "react": "19.3.1", "react-dom": "19.3.1" }
```

19.3.1 is the version the frontend uses on main (`npm ls react` on a clean `e70fc03` clone: `@flowtop/frontend` → `react@19.3.1`, `react-dom@19.3.1`).

Verified on the box: Node v24.22.1, npm 11.19.1, fresh `git clone`.

## Verdict

PASS. After deleting every `node_modules` and running `npm ci` at the root, there is exactly one React and one React DOM, both 19.3.1. `package-lock.json` did not change: main already resolved to a single 19.3.1, so this pin does not change what gets installed today. It stops a workspace (admin, or a later `packages/*`) from pulling in a second copy. A test merge with the PR #15 head merges without conflicts and also installs one copy.

## Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | Exact version taken from the frontend | PASS | Clean `e70fc03` clone, `npm ls react react-dom` gives `@flowtop/frontend@0.1.0` → `react@19.3.1`, `react-dom@19.3.1`; `packages/ui` dedupes to the same. `frontend/package.json:20-21` declares `^19.0.0`; `packages/ui/package.json:40-41` (dev) declares `^19.3.1`. |
| 2 | Lockfile needs regenerating? | PASS, no | `npm install --package-lock-only` with the overrides in place: exit 0, `git status` shows only `package.json` modified. `package-lock.json` is byte-identical to main. |
| 3 | Delete every node_modules, `npm ci` | PASS | `find . -name node_modules -type d -prune` gives `./node_modules`, removed, then 0 left. `npm ci` gives "added 363 packages, and audited 367 packages in 5s", exit 0. |
| 4 | `npm ls react` shows one version | PASS | Every entry is `react@19.3.1` (two say `overridden`, the rest `deduped`). Full output is in the PR body. Physical copies (`npm ls react react-dom --all --parseable` → package.json name@version): `1 react@19.3.1`, `1 react-dom@19.3.1`. |
| 5 | `npm ls react-dom` shows one version | PASS | Every entry is `react-dom@19.3.1`. |
| 6 | The override actually bites (rule 3) | PASS | In a scratch copy of the manifests, setting `packages/ui` devDependencies to `react`/`react-dom` `19.2.0`: **without** the overrides, `npm install` gives 2 copies each (`react@19.2.0` under `@flowtop/ui`, `react@19.3.1` hoisted). **With** the overrides: `1 react@19.3.1`, `1 react-dom@19.3.1`. |
| 7 | Root build, test, lint, typecheck | PASS | On the branch, after the clean `npm ci`: `npm run typecheck`, `lint`, `test` and `build` all exit 0. In test, the ui checks all pass and "PASS: 1 AGENTS.md example(s) typecheck verbatim." Build: frontend `/`, `/_not-found`, `/style-guide`, plus the ui `tsc --noEmit`. |
| 8 | Rule 8: built output unchanged | PASS | `node_modules/react` and `node_modules/react-dom` are sha256-identical to a main install. The frontend build's shared chunks have the same content hashes as main's build (`chunks/131-445671fb2fcaaadf.js`, `chunks/c7879cf7-b5ab1053c1d9a2e7.js`). |
| 9 | Conflict with PR #15 (admin, read-only) | PASS, no textual conflict | PR #15 (`dev-a/fix/dev-d-admin-rebase` @ `572f82c`) adds `admin/package.json` (`react ^19.0.0`) and changes `package-lock.json`. It does **not** touch the root `package.json`, which is the only file this branch changes. A scratch `git merge` of this branch into `refs/pull/15/head` merged automatically. `npm ci` on the result exits 0, and `npm ls` shows `@flowtop/admin` → `react@19.3.1 overridden`, frontend and ui `deduped`: still 1 copy each. On that merge, root `npm run typecheck`, `lint`, `test` and `build` (which includes `@flowtop/admin` `next build`) all exit 0. Nothing was pushed to PR #15 or `dev-d/feat/admin-shell`. |

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | None. | — | — | — |

## Questions

1. Bumping React from now on means changing three places: the override and the two workspace ranges. Should a root check fail when `npm ls react` shows more than one copy? There is no root `test` script of its own today (root `test` only fans out to workspaces), so I did not add one in this PR.
2. Merge order with PR #15 does not matter textually. Whichever lands second should still run `npm ci` and `npm ls react` once, because PR #15 rewrites a lot of `package-lock.json`.

## Honesty line

The admin results (check 9) come from a local test merge of PR #15's head, not from PR #15's CI. I did not run the admin app in a browser. CI on this PR runs on GitHub, and its results are reported in the PR, not here.

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | N/A. No render change; built chunks are hash-identical (#8). |
| 2 | 2 | Mock vs real API checked? | N/A. Dependency pin only. |
| 3 | 3 | Broke each drift test and watched it go red? | Yes (#6). Without the override, a drifted workspace gives 2 copies; with it, 1. |
| 4 | 4 | Clean clone, npm ci at root? | Yes (#3). |
| 5 | 5 | Another app imported and rendered the library? | Yes for install: frontend and ui resolve the single copy. Admin was test-merged from PR #15 (#9). |
| 6 | 6 | Doc examples typechecked verbatim? | N/A. No doc example added; the existing AGENTS.md example still passes (#7). |
| 7 | 7 | One owner per shared type, importer, failing test? | N/A. No types changed. |
| 8 | 8 | Built before and after for shared config change, diffed? | Yes (#8). |
| 9 | 9 | Published shape first, AGENTS.md example, verbatim test? | N/A. No cross-team shape. |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed in docs/reviews as `<branch>-<date>.md`? | Yes. This file. |
| 12 | reviews/README | Every row's evidence is file:line, output, or measured value? | Yes. |

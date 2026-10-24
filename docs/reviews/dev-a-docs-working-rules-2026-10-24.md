# dev-a/docs/working-rules, 2026-10-24

Branch `dev-a/docs/working-rules` off `main` at `079be6d` (merge of PR #16). Docs only, three files plus this review:

- `docs/11-working-rules.md`: new, the six working rules, with the user's text byte-for-byte.
- `AGENTS.md`: a `## How we work` section inserted after "Rules that apply everywhere" and before "Where things are written down". Nothing else in the file changed.
- `docs/README.md`: one new row, for `11-working-rules.md`, directly after the `10-review-standards.md` row.

Verified on the box: fresh `git clone` of `main`, Node v24.22.1.

## Verdict

PASS, mergeable once CI is green. Both content files are in place, the README row exists, every relative link and `docs/` path resolves, and the diff touches only the three files above plus this review. The user's text was not edited. One mapping in the "Where these map" table does not match `docs/10-review-standards.md` (check 7, Failure 1), and I left it as written for the user to decide.

## Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | `docs/11-working-rules.md` is byte-identical to the supplied text | PASS | `sha256sum docs/11-working-rules.md` and the source file both give `d79aef9f260798a347f017d4621b1e959fa4d9891d1249f91d5f53ea0bb14742`. No BOM (first bytes `# W`), no CR characters (`grep -c $'\r'` gives 0). |
| 2 | AGENTS.md section inserted verbatim, in the right place, nothing else changed | PASS | `git diff AGENTS.md` is one hunk of 16 added lines at `@@ -38,6 +38,22 @@`, after rule 5 of "Rules that apply everywhere" and before `## Where things are written down`, with one blank line each side. 0 lines removed. The section matches the source file `agents-section.md` (sha256 `08e65b0b6a25be62e8ba36b39521c546f8f9519c8b5e2a58ad6cd6fb75da92d7`), which ends with one newline. |
| 3 | `docs/README.md` has a row for `11-working-rules.md`, in order | PASS | `docs/README.md:14` is `\| [11-working-rules.md](11-working-rules.md) \| ... \|`, directly after the `10-review-standards.md` row (line 13) and before `reviews/README.md` (line 15). Same three-column format as the rows around it. No other open branch changes `docs/README.md` or `AGENTS.md` (`git diff origin/main...origin/<branch> -- docs/README.md AGENTS.md` is empty for all 7 remote branches), so there is nothing to merge in. The README has no `07` row on main, and this PR does not touch that. |
| 4 | Every relative link and `docs/` path resolves | PASS | Script output below: 8 targets checked, 7 resolve. The 1 that does not is `admin/src/types/index.ts` (check 5). |
| 5 | Every mentioned file or package exists | PARTIAL | `admin/src/types/index.ts` is **not on main**: `admin/` on main holds only `AGENTS.md`. The file exists only on `origin/dev-d/feat/admin-shell` (`git ls-tree` shows it) and was deleted on `origin/dev-a/fix/dev-d-admin-rebase` (PR #15). The text in rule 3 is history ("kept private copies"), so it is a mention and not a link, but anyone who goes looking on main will not find it. `@flowtop/types` exists: `shared/types/package.json:2` `"name": "@flowtop/types"`. `shared/types` exists. `product:write` appears in no source: not in `shared/types`, not in `backend/src`, only in prose in `docs/10-review-standards.md:13` and this file, which matches rule 4 ("invented"). |
| 6 | Factual claims that can be checked against the repo | PASS for 2 of 2 checkable | `MediaAsset` has `filename` (`shared/types/src/index.ts:152`) and `createdAt` (`:160`), added in `3c6e5c5`, which is in the PR #11 merge `98b2037`. `bg-ink/60` is used in `packages/ui/src/components/Modal/Modal.tsx:116` and `Drawer.tsx:111`. The other incident figures (470 to 491 rules, 13 `sm:` classes, "three days", "about two weeks", Dev D checks 5 to 10) are not in the repo and I did not verify them. |
| 7 | "Where these map" numbers match the real `docs/10-review-standards.md` | PARTIAL | Rule 1 → 9: matches (rule 9 is "SHIP THE TYPE BEFORE YOU SHIP THE THING"). Rule 3 → 7: matches ("ONE SOURCE OF TRUTH, GUARDED BY A TEST"). Rule 4 → 2: matches ("MOCKS ARE NOT VERIFICATION"). Rule 5 → 8: matches ("WHEN YOU CHANGE A SHARED CONFIG, DIFF THE OUTPUT"). Rule 6 → 2 and 5: matches in substance (2 is mocks, 5 is "CHECK THE CONSUMER, NOT JUST THE PRODUCER"), but the row label "check the consumer not just the producer" is only rule 5's heading. **Rule 2 → 8 does not match:** rule 2 is about branch length, and `docs/10-review-standards.md` has no rule about that. Rule 8 is about diffing the output of a shared config change, which is rule 5's subject, and only one of rule 2's four bullets (the Tailwind preset) touches it. Text left as supplied. |
| 8 | `git diff --stat` shows only the intended files | PASS | `git diff --stat origin/main..HEAD`: `AGENTS.md` (16 +), `docs/11-working-rules.md` (133 +), `docs/README.md` (1 +), this review. 4 files changed, 230 insertions, 0 deletions. |
| 9 | Docs and lint tooling | PASS, none exists for markdown | No `.prettierrc`, markdownlint, remark or link-check config in the repo (`git ls-files` finds none), and `.github/workflows/ci.yml` has no markdown or docs step. `git diff --check` exits 0. The root `lint` script fans out to workspaces (ESLint on code), which this change does not touch. Root `AGENTS.md` is not read by any script: `frontend/scripts/check-agents-examples.mjs` and `backend/src/_examples/agents-examples.spec.ts` read `frontend/AGENTS.md` and `backend/AGENTS.md`. |
| 10 | CI | See PR | CI runs on GitHub; its per-check results are in the PR, not here. |

Link-check output (script `check-links.py`, run from the repo root on the branch; it extracts markdown links, backticked paths and bare `docs/`, `shared/`, `admin/`, `frontend/`, `backend/`, `packages/` paths from the three added pieces, and resolves each against the file's own folder and the repo root):

```
== docs/11-working-rules.md
  OK   [backtick] package.json -> package.json
  MISS [backtick] admin/src/types/index.ts -> None
  OK   [bare-path] docs/10-review-standards.md -> docs/10-review-standards.md
  OK   [bare-path] shared/types -> shared/types
== AGENTS.md (How we work section)
  OK   [bare-path] docs/11-working-rules.md -> docs/11-working-rules.md
  OK   [bare-path] docs/10-review-standards.md -> docs/10-review-standards.md
== docs/README.md (11 row)
  OK   [md-link] 11-working-rules.md -> docs/11-working-rules.md
missing: 1
```

`docs/10-review-standards.md` is written as a plain path from the repo root, not a markdown link. In `docs/11-working-rules.md` it sits in `docs/`, so as a clickable link it would need to be `10-review-standards.md`. It is plain text, so nothing is broken, and I did not change it.

## Failures

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | The "Where these map" table maps rule 2 (branches live 48 hours) to review standard 8 (diff the output when you change shared config). Rule 8 is the subject of rule 5, and `docs/10-review-standards.md` has no standard for branch length. | `docs/11-working-rules.md` (last table) | Nobody is blocked. A reader who follows the table lands on an unrelated rule. | Can wait. The user decides: map rule 2 to "none yet" or add a branch-length rule to `docs/10-review-standards.md`. |
| 2 | `admin/src/types/index.ts` is named in rule 3 but is not on main. It exists only on Dev D's branch, and PR #15 deletes it. | `docs/11-working-rules.md` (rule 3) | Nobody. It is history, not a link. | Can wait. It will read oddly until PR #15 merges. |

## Questions

1. Rule 3 says "If something you need is not in there, add it there", while the root `AGENTS.md` says `shared/types/` is "Dev A owns, all propose" and "Never edit a folder you do not own". Should a non-Dev-A developer add the type to `shared/types` directly, or propose it to Dev A? The two sentences read differently.
2. The new `## How we work` section and the existing line "`docs/10-review-standards.md` must be read before writing any review or reporting work complete" now say nearly the same thing twice. Harmless, and the user asked for the section as written, so I left both.
3. `AGENTS.md` "Working style" says "build against a typed mock", and rule 4 says mocks come from the shared type. These agree, and the new rule makes "typed" mean "derived from `@flowtop/types`".

## Honesty line

I did not verify the incident figures in the rules (470 to 491 CSS rules, thirteen `sm:` classes, three days lost, about two weeks, Dev D's checks 5 to 10 all in mock mode, the Dev C `tsc` catch), because none of that is in the repo. I did not render the markdown on GitHub. I did not run `npm ci`, `build` or `test` locally, because the change is docs only and no script reads root `AGENTS.md` or the docs. CI on this PR runs on GitHub and its results are reported in the PR.

## BEFORE YOU REPORT DONE

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Browser measurement for every render claim? | N/A, because docs only; nothing renders. |
| 2 | 2 | Mock vs real API checked? | N/A, because docs only; no mock and no API involved. |
| 3 | 3 | Broke each drift test and watched it go red? | N/A, because docs only; no drift test added or changed. |
| 4 | 4 | Clean clone, npm ci at root? | N/A, because docs only and no script reads the changed files. The checks ran on a fresh clone of main (#9). |
| 5 | 5 | Another app imported and rendered the library? | N/A, because no library or endpoint shipped. |
| 6 | 6 | Doc examples typechecked verbatim? | N/A, because the added text has no code example. |
| 7 | 7 | One owner per shared type, importer, failing test? | N/A, because no types changed. |
| 8 | 8 | Built before and after for shared config change, diffed? | N/A, because no shared config changed. |
| 9 | 9 | Published shape first, AGENTS.md example, verbatim test? | N/A, because no cross-team shape. |
| 10 | 10 | Honesty line present? | Yes. |
| 11 | reviews/README | Filed in docs/reviews as `<branch>-<date>.md`? | Yes. This file. |
| 12 | reviews/README | Every row's evidence is file:line, output, or measured value? | Yes, except rows 6 and 7 where the claims are quoted from the repo and the unverified ones are named in the honesty line. |

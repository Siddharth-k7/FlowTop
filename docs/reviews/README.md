# Reviews

Reviews go in `docs/reviews/` as files, not pasted into chat.

Read [10-review-standards.md](../10-review-standards.md) before writing one.

## Naming

`<branch-or-pr>-<yyyy-mm-dd>.md`, for example `dev-c-week1-2026-10-20.md`.

## Structure

Every review file uses this structure.

### Verdict

One-line verdict: mergeable, or not and why.

### Checks

| # | check | PASS / FAIL / PARTIAL / MISSING | evidence |
|---|---|---|---|
| 1 | | | |

Evidence is a file:line, real command output, or a measured value. A description of what you did is not evidence.

### Failures

Failures ranked worst first. Each one states what is broken, which file, who it blocks, and whether it blocks today or can wait.

| # | what is broken | which file | who it blocks | blocks today or can wait |
|---|---|---|---|---|
| 1 | | | | |

### Questions

Direct answers to whatever questions the review was asked.

### Honesty line

The honesty line from rule 10 of [10-review-standards.md](../10-review-standards.md).

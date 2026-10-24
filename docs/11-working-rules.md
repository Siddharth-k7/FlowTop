# Working rules

Six rules. Each one exists because of a specific thing that went wrong in
Phase 1, named below so nobody has to take them on faith.

docs/10-review-standards.md is about how you verify and report, after the
work. This file is about how you build, during it.

---

## 1. Ship the type before the thing

The day you start building something another developer needs, publish its
shape first: the signature, the response JSON, the props. Body empty,
returning null, whatever. Put it in shared/types or in that folder's
AGENTS.md with a working example, and write a test that uses the example
verbatim.

The other person codes against that signature immediately. When you fill
in the body, their code lights up unchanged.

**What happened:** Dev B lost three days in week 1 waiting on Dev A. The
rules were written in AGENTS.md but the signatures were not, so there was
nothing to code against. Separately, Dev D needed a permission list that
did not exist anywhere shared, so he wrote his own and invented
`product:write`.

**A signature is not real until it is written down with a working
example.** "I'll tell you the shape on Slack" is how drift starts.

---

## 2. Branches live 48 hours, not two weeks

If a prompt takes longer than two days, split it and merge the first half.
The only exception is a pair that would break main if separated, such as
an endpoint and the contract change describing it.

**What happened:** `frontend-dev-c` lived about two weeks. In that time:

- Two branches independently created a root `package.json`, producing an
  add/add conflict on both it and the lockfile
- Dev C and Dev D hit the identical `bg-ink/60` alpha bug separately,
  because tokens were not on main and Dev D copied CSS variables by hand
- A Tailwind preset change from replace to extend turned on hundreds of
  previously dead utilities in one go, instead of a few at a time
- Dev D had nothing real to build against for the whole period

Every one of those is a long-branch bug. None would have survived a
two-day branch.

---

## 3. No private type copies

Import from `@flowtop/types` or the type does not exist. If something you
need is not in there, add it there. Do not keep a local copy "for now".

**What happened:** `admin/src/types/index.ts` and the frontend both kept
private copies of our API types. The admin's copy invented permissions.
The frontend's copy went stale the moment PR #11 added `filename` and
`createdAt` to `MediaAsset`.

The second one is the happy ending: the moment Dev C deleted his copy and
imported `@flowtop/types`, `tsc` immediately flagged the stale mock. That
is the bug class caught at compile time instead of in production.

---

## 4. Mock shapes come from the type, never hand-written

Derive every fixture from the shared type and the real role mapping. A
hand-written mock is a second source of truth that agrees with nothing.

**What happened:** Dev D's admin gated its menu on `product:write`. His
mocks used the same invented key, so every check passed. Against the real
API, Products, Categories and Collections were hidden from every role
including super admin, and a product manager would have seen two menu
items.

**A mock that can disagree with the real API proves nothing when it
passes.**

---

## 5. Changing a shared config means diffing the output

A preset, a base tsconfig, a root package.json: these change every
consumer at once. Build the output before and after and diff it. Then open
the places the diff points at.

**What happened:** moving the Tailwind preset from replacing Tailwind's
scales to extending them brought back `spacing`, `fontSize`, `zIndex`,
`maxHeight` and the `sm` breakpoint across every app. Built CSS went from
470 to 491 rules. Thirteen `sm:` classes that had silently done nothing
suddenly applied at 640px, and the homepage's Featured Collections grid
went from one column to two in the 640 to 767 band that nobody had looked
at.

It turned out fine. It was not checked first.

---

## 6. Real API before "done"

Mock mode is not verification. A feature is not finished until it has run
against the real backend, and a component library is not finished until
another app imports and renders it.

**What happened:** Dev D's Phase 1 checks 5 through 10 were all reported
as passing. Every one was mock mode. The real-API run found the permission
bug, the `type=pdf` filter that 422s, and an alt-text bug that writes to
the wrong file.

Also: a dashboard permission test passed for weeks because
`/admin/dashboard` returns 404, so the error card hid the tables from
everyone. The test proved nothing until the endpoint was stubbed.

**A test that cannot fail is worse than no test, because it buys
confidence it has not earned.**

---

## Where these map

| Rule | Review standard it enforces |
|---|---|
| 1 | 9, ship the type before you ship the thing |
| 2 | 8, diff the output when you change shared config |
| 3 | 7, one source of truth guarded by a test |
| 4 | 2, mocks are not verification |
| 5 | 8 |
| 6 | 2 and 5, check the consumer not just the producer |

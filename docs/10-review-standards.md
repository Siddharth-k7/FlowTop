# Review standards

Every agent on this project reads this before writing a review or reporting that work is done. It exists because the same failures keep repeating.

Write the review as a file under [reviews/](reviews/README.md). Do not paste it into chat.

---

## Rules

1. **MEASURE, DO NOT INFER.** A claim about what renders needs a browser measurement. Reading a config and reasoning about it is not evidence. Example: text-primary resolved to the brand purple for two weeks. Every form label, input, select and table cell rendered rgb(91,42,134). It was found by reading computed styles, and it survived a config review.

2. **MOCKS ARE NOT VERIFICATION.** If the mock and the real API can disagree, a passing test against the mock proves nothing. Example: Dev D's admin gated its menu on a permission called product:write. The backend has no such permission. His mocks used the same invented key, so every check passed. Against the real API, Products, Categories and Collections were hidden from every role, including super_admin.

3. **A DRIFT TEST MUST BE PROVEN TO FAIL.** Break the thing it guards, watch it go red, put it back. A test that passes but never fails is worse than no test, because it buys confidence it has not earned.

4. **RUN ON A CLEAN CLONE.** Fresh clone, delete every node_modules, npm ci at the repo root, then build and test. "It works locally" has twice meant a stale node_modules. Example: frontend typecheck was 0 errors locally and 580 on a clean clone. Example: packages/ui's npm test crashed on every clean install because it looked for tsc in the wrong node_modules.

5. **CHECK THE CONSUMER, NOT JUST THE PRODUCER.** Shipping a component library is not done until another app imports it and renders it. Shipping an endpoint is not done until a client calls it.

6. **DOCUMENTED EXAMPLES MUST COMPILE VERBATIM.** Copy every code example out of the docs, paste it with no edits, and typecheck. Example: 3 of 24 compiled, and three documented props did not exist.

7. **ONE SOURCE OF TRUTH, GUARDED BY A TEST.** A type that lives in two places will drift. Pick the owner, make the other side import it, and write a test that fails on divergence.

8. **WHEN YOU CHANGE A SHARED CONFIG, DIFF THE OUTPUT.** Changing a preset or a base config changes every consumer. Build before and after, and diff. Example: moving the Tailwind preset from replace to extend turned on spacing, fontSize, zIndex, maxHeight and the sm breakpoint everywhere. Hundreds of previously dead utilities went live at once.

9. **SHIP THE TYPE BEFORE YOU SHIP THE THING.** The day you start building something another developer needs, publish its shape first: the signature, the response JSON, the props. Body empty. Put it in that folder's AGENTS.md with a working example, and write a test that uses that example verbatim.

10. **SAY WHAT YOU DID NOT CHECK.** Every report ends with an honesty line listing what was not verified and why. If you did not run a command, say so instead of describing what you expect would have happened. A confident summary with the caveats stripped out is worth less than a shorter one with them left in.

---

## BEFORE YOU REPORT DONE

Answer every question yes, no, or "N/A, because <reason>". One no and the work is not done.

N/A must name the reason. "N/A, docs only" is fine for rules 1, 3, 5, 6 and 8. If a change touches code that runs, N/A on rules 1, 2 or 4 is almost always wrong: say no and go do the check instead.

The point of N/A is so you never answer yes to something you did not do.

| # | Rule | Question | Yes / No / N/A |
|---|---|---|---|
| 1 | 1 | Did a browser measurement support every claim about what renders, rather than a reading of config? | |
| 2 | 2 | Where a mock and the real API can disagree, did you treat a passing test against the mock as not enough, and check the real API? | |
| 3 | 3 | Did you break the thing each drift test guards, watch the test go red, and put it back? | |
| 4 | 4 | Did you run build and test from a clean clone: fresh clone, every node_modules deleted, then npm ci at the repo root? | |
| 5 | 5 | Did another app import and render every component library you shipped, and did a client call every endpoint you shipped? | |
| 6 | 6 | Did you copy every code example out of the docs, paste it with no edits, and typecheck it? | |
| 7 | 7 | Does every shared type have one owner, with the other side importing it, and a test that fails on divergence? | |
| 8 | 8 | For every shared preset or base config you changed, did you build before and after and diff the output? | |
| 9 | 9 | For everything another developer needs that you started, did you publish the shape first (the signature, the response JSON, or the props, body empty), put a working example in that folder's AGENTS.md, and write a test that uses that example verbatim? | |
| 10 | 10 | Does the report end with an honesty line listing what was not verified and why, including any command you did not run? | |
| 11 | [docs/reviews/README.md](reviews/README.md) | Is this review filed in docs/reviews/ as <branch-or-pr>-<yyyy-mm-dd>.md, rather than pasted into chat? | |
| 12 | [docs/reviews/README.md](reviews/README.md) | Is every row's evidence a file:line, real command output, or a measured value? A description of what you did is not evidence. | |

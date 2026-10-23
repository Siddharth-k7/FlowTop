# Flowtop

Premium bathfittings company in India. We are building a public website plus an admin CMS that lets Flowtop staff manage everything without a developer.

**The one idea behind the whole project:** nothing is hard-coded. Products, collections, homepage sections, menus and campaigns all live in the database. Staff add, arrange and publish them from the admin panel. If a routine content change needs a code deploy, the feature is wrong.

## Stack

- Frontend and admin: Next.js App Router, React, TypeScript, Tailwind
- Backend: NestJS, TypeScript
- Database: PostgreSQL via Prisma
- Monorepo, npm workspaces

## Layout and ownership

| Folder | What it is | Owner |
|---|---|---|
| `backend/` | API and database | Dev A (platform, commerce) and Dev B (catalogue, content) |
| `frontend/` | Public website | Dev C |
| `admin/` | The CMS | Dev D |
| `packages/ui/` | Shared design tokens and components | Dev C owns, Dev D imports |
| `shared/types/` | Types both sides import | Dev A owns, all propose |
| `infra/` | Deploy, CI, monitoring | Dev A |

Each of `backend/`, `frontend/` and `admin/` has its own AGENTS.md with rules specific to that folder. Read it before working there.

**Never edit a folder you do not own.** If a change is needed there, say so and stop. Do not reach across the boundary.

## Rules that apply everywhere

1. **The server is the only security.** Hiding a button, disabling an input or omitting a menu item is presentation, never a permission check. Every protected action is authorized server-side.

2. **Never trust the client.** Prices, totals, permissions and payment status come from the server on every request. A value that arrived from a browser is an input to validate, not a fact.

3. **Placement is its own table.** A product appears in many places at once: the homepage, a category, a collection, a campaign. Each is a separate row with its own position and enabled flag. Never a boolean column on the product. Removing one placement must never affect another.

4. **Content is data, not code.** Never hard-code a product, a collection, a homepage section or a menu item into a layout or a component. If it appears on the site, it came from the database.

5. **Never report success that did not happen.** If a save failed, an email bounced or a payment is unconfirmed, say so. A false success is worse than an error.

## Where things are written down

Read the relevant doc before you build, not after.

| File | What it holds | Read before |
|---|---|---|
| `docs/03-api-contract.md` | Every endpoint, request and response shape | Touching any endpoint or any API call |
| `docs/04-data-model.md` | Tables, relationships, the placement model | Touching the schema or a query |
| `docs/02-mvp-scope.md` | What ships in v1, what is deferred | Adding anything not already specified |
| `docs/05-team-split.md` | Who owns what, and the seams between them | Working near a boundary |
| `docs/06-conventions.md` | Naming, folders, patterns | Creating new files |
| `docs/10-review-standards.md` | How to review, and when work counts as done | Writing any review, or reporting work complete |

[docs/10-review-standards.md](docs/10-review-standards.md) must be read before writing any review or reporting work complete.

The API contract is the agreement between four people. Changing it is a pull request all four review, never a unilateral edit.

## Working style

- TypeScript strict. No `any`.
- Small, single-purpose files. Split rather than grow past roughly 200 lines.
- When an API you need does not exist yet, build against a typed mock and mark it `TODO: swap for real API`. Never block on another developer.
- Commits: `type(scope): message`, for example `feat(placements): add position reorder`.
- Every PR states which audit task it closes.

## Deferred, do not build

3D product viewer, warranty forms, exhibitions, projects, gallery albums, scheduled publishing, revision history, customer accounts. The schema keeps columns for some of these so they can be added later. Do not build the features.

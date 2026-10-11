# Flowtop

Flowtop is a premium bathfittings company in India. This repository holds the
Flowtop public website, where customers browse the catalogue, read the journal
and place orders, together with the admin CMS the Flowtop team uses to manage
products, content, page layouts and orders. It is a monorepo: one backend API,
two frontends (public site and admin), a shared UI kit and shared types.

## Ownership

| Dev | Role | Owns |
|---|---|---|
| A | Platform and Commerce | `backend/` auth, users, media, settings, audit, common, cart, orders, payments, email, submissions; `backend/prisma/`; `infra/`; `.github/` |
| B | Catalogue and Content | `backend/` products, variants, specifications, categories, collections, placements, pages, sections, navigation, journal, analytics, search |
| C | Public Website | `frontend/`, `packages/ui/` |
| D | Admin CMS | `admin/` |

`AGENTS.md`, `docs/` and `shared/` are owned by all four. Nobody edits another
dev's folder; if you need a change there, ask the owner. Ownership is enforced
through `.github/CODEOWNERS`.

## Getting started

1. Clone the repo.
2. Read [`AGENTS.md`](AGENTS.md) at the root, then the `AGENTS.md` in your own folder.
3. Read [`docs/05-team-split.md`](docs/05-team-split.md) to find your folder and your tasks.
4. Browse [`docs/README.md`](docs/README.md) for the rest of the documentation.

Apps are not scaffolded yet. Each dev sets up their own app inside their folder in week 1.

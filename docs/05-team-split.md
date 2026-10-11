# Flowtop MVP - Four Person Task Audit

**Team:** A (Platform and Commerce), B (Catalogue and Content), C (Public Website), D (Admin CMS)
**Duration:** 10 weeks, 5 phases
**Source:** Flowtop Website SRS v1.0, 9 Oct 2026

---

## The four roles

| Dev | Role | Owns these folders |
|---|---|---|
| **A** | Platform and Commerce | `backend/src/{auth,users,media,settings,audit,common}`, `backend/src/{cart,orders,payments,email,submissions}`, `backend/prisma/`, `infra/`, `.github/` |
| **B** | Catalogue and Content | `backend/src/{products,variants,specifications,categories,collections,placements,pages,sections,navigation,journal,analytics}` |
| **C** | Public Website | `frontend/` entirely, plus `packages/ui/` |
| **D** | Admin CMS | `admin/` entirely |

Nobody edits another person's folder. If you need a change there, you ask.

### Why split this way

A and B both write backend code but never touch the same module. A owns anything to do with identity, money or infrastructure. B owns anything to do with content. The only file they share is the Prisma schema, and A is the owner of it, so B proposes changes through A.

C and D both write React but never share a page. The one thing they share is the UI kit in `packages/ui/`, and **C owns it**. D imports it. This is a real dependency, see the warning below.

### The critical dependency

**C must ship design tokens and the UI kit by end of week 1.** D cannot build a single admin screen without them. If C is late, D is blocked, and D has the biggest single piece in the project (the page builder). Treat this as the number one schedule risk.

Mitigation: C builds tokens and the ten most-used components first (Button, Input, Select, Card, Modal, Table, Toast, Badge, Tabs, Spinner), ships them on day 4, then continues with the rest while D starts.

---

## How to use this file

- **Owner** - A, B, C, D, or a combination for shared work
- **Status** - `Not started` / `In progress` / `Done` / `Blocked`
- **Needs** - what must exist before this can start

---

## Phase 0: Day one, everyone in a room

Do not skip this. With four people, an unwritten contract becomes four different assumptions.

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 0.1 | Create the repo, branch protection, PR template, CODEOWNERS file | A | Not started | - |
| 0.2 | Agree the full database schema on a whiteboard before any code | ALL | Not started | - |
| 0.3 | Write the API contract: every endpoint, request shape, response shape | ALL | Not started | 0.2 |
| 0.4 | Create `shared/types/` from the contract. This is the single source of truth | A | Not started | 0.3 |
| 0.5 | Agree the section config schema, since C renders it and D edits it | C + D | Not started | 0.3 |
| 0.6 | Set up the mock server so C and D can build before the APIs exist | A | Not started | 0.4 |
| 0.7 | Agree component naming and folder conventions for `packages/ui/` | C + D | Not started | - |

**CODEOWNERS matters with four people.** Set it so a PR touching `backend/src/auth/` needs A's approval, `frontend/` needs C's, and so on. GitHub then enforces the boundaries instead of you having to remember them.

---

## Phase 1: Foundation (Weeks 1 to 2)

### Dev A - Platform

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 1.A1 | Write the Prisma schema with every table, including deferred features | A | Not started | 0.2 |
| 1.A2 | First migration, dev and staging databases | A | Not started | 1.A1 |
| 1.A3 | Login, logout, password reset, session handling | A | Not started | 1.A2 |
| 1.A4 | MFA for Super Admin | A | Not started | 1.A3 |
| 1.A5 | Three roles and the permission table | A | Not started | 1.A3 |
| 1.A6 | Server-side permission guard used by every protected route | A | Not started | 1.A5 |
| 1.A7 | Audit log. Publish, delete, role change, settings change all write a row | A | Not started | 1.A5 |
| 1.A8 | Two storage buckets, public and private, with the upload endpoint | A | Not started | 1.A2 |
| 1.A9 | CI pipeline, secret storage, secret scanning | A | Not started | 0.1 |
| 1.A10 | Staging environment deployed | A | Not started | 1.A9 |
| 1.A11 | Settings module, so email and WhatsApp config is editable later | A | Not started | 1.A2 |

### Dev B - Catalogue

B has no APIs to build yet in Phase 1, because the schema is still landing. Use the time for groundwork.

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 1.B1 | Review and sign off the content tables in the schema with A | B | Not started | 1.A1 |
| 1.B2 | Build the shared repository and service base classes the content modules will reuse | B | Not started | 1.A2 |
| 1.B3 | Build the publish state machine: draft, published, unpublished, archived | B | Not started | 1.B2 |
| 1.B4 | Build the slug generation and uniqueness helper | B | Not started | 1.B2 |
| 1.B5 | Build the SEO fields mixin, reused by products, pages, collections and articles | B | Not started | 1.B2 |
| 1.B6 | Write and seed realistic mock data for C and D: 40 products, 6 categories, 3 collections | B | Not started | 0.4 |
| 1.B7 | Set up the integration test harness the content modules will use | B | Not started | 1.B2 |

Task 1.B6 is more valuable than it looks. C and D are blocked on realistic data, and B producing it early means their screens look real from week two.

### Dev C - Public Website

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 1.C1 | Design tokens: colours, type scale, spacing, radius, shadow, breakpoints | C | Not started | - |
| 1.C2 | **Ship the 10 core UI components by day 4.** Button, Input, Select, Card, Modal, Table, Toast, Badge, Tabs, Spinner | C | Not started | 1.C1 |
| 1.C3 | The remaining UI components: Drawer, Checkbox, Radio, Switch, Tooltip, Pagination, EmptyState, Textarea | C | Not started | 1.C2 |
| 1.C4 | Style guide page showing every token and every component state | C | Not started | 1.C3 |
| 1.C5 | Public header: desktop nav with dropdown, mobile hamburger, sticky behaviour | C | Not started | 1.C2 |
| 1.C6 | Public footer and root layout | C | Not started | 1.C2 |
| 1.C7 | 404 page, loading skeletons, error boundary | C | Not started | 1.C6 |
| 1.C8 | Public API client with the mock flag | C | Not started | 0.6 |

### Dev D - Admin CMS

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 1.D1 | Admin app scaffold, importing tokens and UI kit from C | D | Not started | 1.C2 |
| 1.D2 | Login screen with the MFA second step | D | Not started | 1.D1, 1.A3 |
| 1.D3 | Admin shell: sidebar, topbar, breadcrumbs, responsive collapse | D | Not started | 1.D1 |
| 1.D4 | Role-based menu visibility, with a comment that this is cosmetic only | D | Not started | 1.D3, 1.A5 |
| 1.D5 | Dashboard with 8 quick action tiles and 4 summary cards | D | Not started | 1.D3 |
| 1.D6 | Admin API client with the mock flag, 401 and 403 handling | D | Not started | 0.6 |
| 1.D7 | Media library screen: drag and drop upload, grid, search, detail panel | D | Not started | 1.A8 |
| 1.D8 | MediaPicker modal, reused by every other screen later | D | Not started | 1.D7 |

### Phase 1 exit checks

| # | Check | Who verifies | Status |
|---|---|---|---|
| 1 | Product Manager role cannot reach the users API by curl | B tests A's work | Not started |
| 2 | Super Admin login requires the second factor | D tests A's work | Not started |
| 3 | Style guide renders every token and component state | D reviews C's work | Not started |
| 4 | Admin panel usable at 360px, sidebar became a drawer | C reviews D's work | Not started |
| 5 | Upload an image, it appears in the library with a working URL | D end to end | Not started |
| 6 | Grep for hex colours outside the token file returns zero | C | Not started |
| 7 | Both frontends run entirely on mock data with the backend switched off | C and D | Not started |

---

## Phase 2: Products (Weeks 3 to 4)

### Dev A - Platform

A has light catalogue involvement here, so A gets ahead on commerce foundations.

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 2.A1 | Harden the upload pipeline: type checks, size limits, non-executable storage | A | Not started | 1.A8 |
| 2.A2 | Image processing: generate responsive sizes and WebP on upload | A | Not started | 2.A1 |
| 2.A3 | Begin the payment gateway integration, sandbox only | A | Not started | Gateway chosen |
| 2.A4 | Email service wiring, templates, delivery logging | A | Not started | 1.A11 |
| 2.A5 | Rate limiting middleware, applied to public endpoints | A | Not started | 1.A6 |
| 2.A6 | Review every one of B's new endpoints for a permission guard | A | Not started | B's phase 2 |

### Dev B - Catalogue

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 2.B1 | Product CRUD API with draft, publish, unpublish, archive | B | Not started | 1.B3 |
| 2.B2 | Unique SKU index, clear duplicate error | B | Not started | 2.B1 |
| 2.B3 | Variant and finish API with per-finish price and image | B | Not started | 2.B1 |
| 2.B4 | Specification API as key-value rows with configurable field types | B | Not started | 2.B1 |
| 2.B5 | Archive guard blocking hard delete when referenced | B | Not started | 2.B1 |
| 2.B6 | Category CRUD with ordering | B | Not started | 1.B3 |
| 2.B7 | Collection CRUD with assigned products and ranking | B | Not started | 2.B1, 2.B6 |
| 2.B8 | Public read endpoints: product by slug, category listing, filters, collection | B | Not started | 2.B1 |
| 2.B9 | Search and filter query layer with sensible indexes | B | Not started | 2.B8 |

### Dev C - Public Website

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 2.C1 | Product card component with hover image swap and finish dots | C | Not started | 1.C3 |
| 2.C2 | Product detail page: gallery, zoom, swipe, finish picker, sticky mobile bar | C | Not started | 2.B8 |
| 2.C3 | Spec table that renders only rows with values | C | Not started | 2.C2 |
| 2.C4 | Enquiry-only product variant of the page, no cart button | C | Not started | 2.C2 |
| 2.C5 | Category and product listing with grid and skeletons | C | Not started | 2.B8 |
| 2.C6 | Filter sidebar on desktop, bottom sheet on mobile, state in the URL | C | Not started | 2.C5 |
| 2.C7 | Sort control and active filter chips | C | Not started | 2.C6 |
| 2.C8 | Collection index and collection detail with editorial story layout | C | Not started | 2.B8 |

### Dev D - Admin CMS

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 2.D1 | Product list: table, sort, search, filters, bulk actions, skeletons | D | Not started | 2.B1 |
| 2.D2 | Product form shell with 7 tabs, sticky action bar, autosave, unsaved warning | D | Not started | 2.B1 |
| 2.D3 | Identity and Commerce tabs | D | Not started | 2.D2 |
| 2.D4 | Variant and finish editor with drag reorder | D | Not started | 2.B3 |
| 2.D5 | **Specification editor.** Add any field, choose its type, reorder, common-specs shortcut | D | Not started | 2.B4 |
| 2.D6 | Media tab using MediaPicker, gallery reorder, alt text per image | D | Not started | 1.D8 |
| 2.D7 | SEO tab with character counters and a live Google result preview | D | Not started | 2.D2 |
| 2.D8 | Category admin with drag reorder and inline rename | D | Not started | 2.B6 |
| 2.D9 | Collection admin with product picker and ranking | D | Not started | 2.B7 |

### Phase 2 exit checks (AT-01)

| # | Check | Who verifies | Status |
|---|---|---|---|
| 1 | Create, draft, edit, add media and specs, preview, publish, archive a product | D runs it, all watch | Not started |
| 2 | **Add a custom spec field "Spout Reach" with no code change** | D | Not started |
| 3 | A product with an empty field shows no empty row publicly | C | Not started |
| 4 | Finish switch changes image and price with no reload | C | Not started |
| 5 | Duplicate SKU is rejected with a clear message | B | Not started |
| 6 | Filter state survives a copied URL in a new tab | C | Not started |
| 7 | Kill the network, hit Save, no false success | D | Not started |
| 8 | Every new endpoint has a permission guard | A audits B | Not started |

---

## Phase 3: Placement and page builder (Weeks 5 to 6)

The heaviest phase. B and D carry most of it.

### Dev A - Platform

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 3.A1 | Finish the payment gateway integration | A | Not started | 2.A3 |
| 3.A2 | Webhook endpoint with signature verification | A | Not started | 3.A1 |
| 3.A3 | Idempotency layer, unique constraint on the gateway payment ID | A | Not started | 3.A2 |
| 3.A4 | Cart API with server-side price recalculation on every call | A | Not started | 2.B1 |
| 3.A5 | Order model, unique reference, status transitions | A | Not started | 3.A4 |
| 3.A6 | Caching layer for public content reads | A | Not started | 2.B8 |
| 3.A7 | Review B's placement and section endpoints for authorization | A | Not started | B's phase 3 |

### Dev B - Catalogue

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 3.B1 | **Placement table and API.** product, location, position, enabled | B | Not started | 2.B1 |
| 3.B2 | Placement query API: given a location, return ordered products | B | Not started | 3.B1 |
| 3.B3 | Rule-based selection, newest in a category | B | Not started | 3.B1 |
| 3.B4 | Guard: archived or unavailable products never return purchasable | B | Not started | 3.B1 |
| 3.B5 | Page and section API: create, reorder, duplicate, hide, publish | B | Not started | 1.B3 |
| 3.B6 | Section config validation. Only approved preset values accepted | B | Not started | 3.B5, 0.5 |
| 3.B7 | Navigation API with one dropdown level and footer links | B | Not started | 1.B3 |
| 3.B8 | Journal API with product links | B | Not started | 2.B1 |
| 3.B9 | Analytics event endpoints | B | Not started | 1.B2 |

### Dev C - Public Website

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 3.C1 | HeroSection with mobile image slot and overlay presets | C | Not started | 0.5 |
| 3.C2 | ProductCarouselSection with manual and rule-based sources | C | Not started | 3.B2 |
| 3.C3 | CollectionShowcaseSection | C | Not started | 0.5 |
| 3.C4 | ImageTextSection with ratio and stacking options | C | Not started | 0.5 |
| 3.C5 | GallerySection with grid, masonry and slider layouts | C | Not started | 0.5 |
| 3.C6 | CtaSection with button and document download modes | C | Not started | 0.5 |
| 3.C7 | SectionRenderer with typed switch and a safe fallback | C | Not started | 3.C1 to 3.C6 |
| 3.C8 | Rebuild the homepage and build the dynamic `[slug]` page | C | Not started | 3.C7 |
| 3.C9 | Public journal index and article page | C | Not started | 3.B8 |
| 3.C10 | Wire the header and footer to the navigation API | C | Not started | 3.B7 |

### Dev D - Admin CMS

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 3.D1 | Placement panel inside the product form | D | Not started | 3.B1 |
| 3.D2 | Placement preview modal showing the product in its real section | D | Not started | 3.B2, 3.C7 |
| 3.D3 | Page builder shell: three columns, section list, live preview | D | Not started | 3.B5 |
| 3.D4 | Drag to reorder, duplicate, hide, delete sections | D | Not started | 3.D3 |
| 3.D5 | Section editor panel, dropdowns only, no free text style field | D | Not started | 3.B6, 0.5 |
| 3.D6 | Device preview toggle using a real resized iframe | D | Not started | 3.D3 |
| 3.D7 | Undo and redo, 20 steps | D | Not started | 3.D4 |
| 3.D8 | Page settings: slug, SEO, publish state | D | Not started | 3.D3 |
| 3.D9 | Navigation editor, drag and drop tree | D | Not started | 3.B7 |
| 3.D10 | Journal admin form | D | Not started | 3.B8 |

### Phase 3 exit checks (AT-02, AT-03, AT-04)

| # | Check | Who verifies | Status |
|---|---|---|---|
| 1 | Product in a category, a collection and Homepage Featured at position 2 | D runs it | Not started |
| 2 | **Remove only the homepage placement. The other two survive. Product intact.** | D runs it, B confirms in the DB | Not started |
| 3 | Add a carousel, duplicate a section, reorder, publish. Public matches | D and C together | Not started |
| 4 | Create a campaign page from a template and publish | D runs it | Not started |
| 5 | Grep the admin for any free-text style input returns zero | C audits D | Not started |
| 6 | Section config with an invalid preset is rejected by the API | A audits B | Not started |
| 7 | Page builder usable at 360px | C audits D | Not started |
| 8 | A section with empty optional fields renders without breaking | D audits C | Not started |

---

## Phase 4: Commerce and communication (Weeks 7 to 8)

### Dev A - Platform

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 4.A1 | Checkout validation for customer and delivery data | A | Not started | 3.A4 |
| 4.A2 | Order confirmation flow, verified payment only | A | Not started | 3.A2, 3.A3 |
| 4.A3 | Order admin API with search, filter and status change | A | Not started | 3.A5 |
| 4.A4 | Transactional email: customer confirmation and Flowtop notification | A | Not started | 2.A4 |
| 4.A5 | Form submission API with validation, rate limiting, spam protection | A | Not started | 2.A5 |
| 4.A6 | Settings API for email recipients and WhatsApp number and templates | A | Not started | 1.A11 |
| 4.A7 | Order export, restricted to authorized roles | A | Not started | 4.A3 |

### Dev B - Catalogue

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 4.B1 | Product availability checks consumed by the cart | B | Not started | 3.A4 |
| 4.B2 | Stock and availability messaging per product | B | Not started | 4.B1 |
| 4.B3 | Related products and Complete the Look APIs | B | Not started | 2.B1 |
| 4.B4 | Analytics aggregation queries for the dashboard | B | Not started | 3.B9 |
| 4.B5 | Public search endpoint across products, collections and articles | B | Not started | 2.B9 |
| 4.B6 | Sitemap data endpoint feeding C's sitemap | B | Not started | 2.B8 |
| 4.B7 | Performance pass on content queries, fix N+1s, add indexes | B | Not started | Phase 3 |

### Dev C - Public Website

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 4.C1 | Add to cart button that never sends a price | C | Not started | 3.A4 |
| 4.C2 | Cart drawer and cart page, all totals from the API | C | Not started | 3.A4 |
| 4.C3 | Checkout: contact, delivery, review, pay | C | Not started | 4.A1 |
| 4.C4 | Payment handoff, then poll the API for verified status. Never read success from the URL | C | Not started | 4.A2 |
| 4.C5 | Confirmation and failure pages | C | Not started | 4.C4 |
| 4.C6 | Floating WhatsApp button, number from settings | C | Not started | 4.A6 |
| 4.C7 | Product WhatsApp action, prefilled with name, SKU, finish and URL, properly encoded | C | Not started | 4.A6 |
| 4.C8 | Contact and dealer enquiry forms with honest success and error states | C | Not started | 4.A5 |
| 4.C9 | Site search UI | C | Not started | 4.B5 |
| 4.C10 | Analytics events across the funnel, with a debug mode | C | Not started | 3.B9 |

### Dev D - Admin CMS

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 4.D1 | Order list with filters and search | D | Not started | 4.A3 |
| 4.D2 | Order detail with line items, address, payment state, status timeline | D | Not started | 4.A3 |
| 4.D3 | Status change with confirmation, and a note that changes are logged | D | Not started | 4.A3 |
| 4.D4 | Print-friendly order view | D | Not started | 4.D2 |
| 4.D5 | Submissions inbox with filters, detail panel, mark as handled | D | Not started | 4.A5 |
| 4.D6 | CSV export, visible only to authorized roles | D | Not started | 4.A7 |
| 4.D7 | Email settings screen with a test send button | D | Not started | 4.A6 |
| 4.D8 | WhatsApp settings screen with a live message preview | D | Not started | 4.A6 |
| 4.D9 | Dashboard summary cards wired to real numbers | D | Not started | 4.B4 |

### Phase 4 exit checks (AT-08, AT-09)

| # | Check | Who verifies | Status |
|---|---|---|---|
| 1 | Guest checkout completes, order recorded, both emails arrive | C and D together | Not started |
| 2 | **Change the price in dev tools. Server charges the real price.** | D attacks C and A | Not started |
| 3 | **Fake the success redirect. No order created.** | B attacks A | Not started |
| 4 | **Fire the webhook twice. One order only.** | B attacks A | Not started |
| 5 | WhatsApp message carries the right name, SKU, finish and URL | D verifies C | Not started |
| 6 | Change the WhatsApp number in settings, frontend picks it up, no deploy | D | Not started |
| 7 | Kill the network, submit a form, no false success | A verifies C | Not started |
| 8 | Submit the contact form 20 times fast, rate limited | C verifies A | Not started |
| 9 | Every analytics event fires exactly once | C | Not started |

---

## Phase 5: Hardening and launch (Weeks 9 to 10)

No new features. **Everyone tests someone else's work.** The rotation:

```
A tests B      B tests A      C tests D      D tests C
```

### Dev A - Platform

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 5.A1 | Full security review: authorization, injection, XSS, CSRF, rate limits | A | Not started | Phase 4 |
| 5.A2 | Upload hardening and malware scanning where available | A | Not started | 2.A1 |
| 5.A3 | Backups configured and a restore actually performed and documented | A | Not started | Phase 4 |
| 5.A4 | Production deploy, monitoring, logging, alerting, rollback guide | A | Not started | 5.A3 |
| 5.A5 | Load test the checkout path | A | Not started | Phase 4 |
| 5.A6 | Secret scan across the whole history | A | Not started | Phase 4 |
| 5.A7 | Test B's work: attack every content endpoint | A | Not started | Phase 4 |

### Dev B - Catalogue

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 5.B1 | Query performance audit, indexes, N+1 elimination | B | Not started | Phase 4 |
| 5.B2 | Seed script with realistic Flowtop products and content | B | Not started | Phase 2 |
| 5.B3 | Data migration and rollback scripts | B | Not started | Phase 4 |
| 5.B4 | API documentation for every content endpoint | B | Not started | Phase 4 |
| 5.B5 | Write the backend integration test suite | B | Not started | Phase 4 |
| 5.B6 | Test A's work: attack auth, payments and uploads | B | Not started | Phase 4 |

### Dev C - Public Website

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 5.C1 | Performance: responsive images, WebP and AVIF, lazy loading, font strategy | C | Not started | Phase 4 |
| 5.C2 | Core Web Vitals, target LCP under 2.5s on mobile 4G | C | Not started | 5.C1 |
| 5.C3 | Accessibility pass on the public site, WCAG 2.2 AA oriented | C | Not started | Phase 4 |
| 5.C4 | Responsive pass at 6 widths | C | Not started | Phase 4 |
| 5.C5 | SEO: sitemap, robots, structured data, meta, canonicals | C | Not started | 4.B6 |
| 5.C6 | Support page, legal pages, About, Manufacturing and Quality as CMS pages | C | Not started | Phase 3 |
| 5.C7 | Resilience: 404, 500, timeouts, expired session, no JavaScript | C | Not started | Phase 4 |
| 5.C8 | Test D's work: click every admin screen looking for breakage | C | Not started | Phase 4 |

### Dev D - Admin CMS

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 5.D1 | Accessibility pass on the admin panel | D | Not started | Phase 4 |
| 5.D2 | Responsive pass on the admin panel at 6 widths | D | Not started | Phase 4 |
| 5.D3 | Admin performance: lazy load the page builder, virtualize long tables | D | Not started | Phase 4 |
| 5.D4 | Error and empty states audited on every admin screen | D | Not started | Phase 4 |
| 5.D5 | Write the admin guide for Flowtop staff | D | Not started | Phase 4 |
| 5.D6 | Build the training environment with safe sample data | D | Not started | 5.B2 |
| 5.D7 | Test C's work: break every public page and form | D | Not started | Phase 4 |

### Shared

| # | Task | Owner | Status | Needs |
|---|---|---|---|---|
| 5.S1 | Write the 9 end to end acceptance tests | C + D | Not started | Phase 4 |
| 5.S2 | Run the full acceptance suite in staging with test credentials | ALL | Not started | 5.S1 |
| 5.S3 | Train Flowtop staff, then watch them work unaided | D leads, all present | Not started | 5.D5 |
| 5.S4 | Production launch | ALL | Not started | All gates |

---

## Workload balance

| Phase | A | B | C | D | Note |
|---|---|---|---|---|---|
| 0 | 3 | 1 | 2 | 1 | Mostly shared |
| 1 | 11 | 7 | 8 | 8 | A heavy, unavoidable, everything waits on auth |
| 2 | 6 | 9 | 8 | 9 | A gets ahead on payments |
| 3 | 7 | 9 | 10 | 10 | The crunch phase |
| 4 | 7 | 7 | 10 | 9 | C heavy on checkout |
| 5 | 7 | 6 | 8 | 7 | Plus 4 shared |
| **Total** | **41** | **39** | **46** | **44** | Within 15 percent |

C carries slightly more because the public site is simply bigger. D's tasks are individually larger, the page builder alone is worth several.

---

## Rules for four people

With two people you can keep the whole system in your head. With four you cannot, so the process has to carry it.

1. **CODEOWNERS enforces the boundaries.** A PR into someone else's folder cannot merge without their approval. Set this up on day one.
2. **The API contract is a file in the repo, not a conversation.** Changing it is a PR that all four review.
3. **One shared types package, owned by A.** Everyone imports, nobody edits without a PR.
4. **Nobody waits.** C and D build against mocks. B builds against the schema. A builds against the contract.
5. **Daily 15 minute standup, all four.** Finished, blocked, needed from whom.
6. **Weekly integration day, every Friday.** Turn off all mocks, run the real stack end to end, fix what broke. Do not let this slip. Four people drift apart faster than two.
7. **Phase 5 rotation:** A tests B, B tests A, C tests D, D tests C. Nobody finds their own bugs.
8. **Pair the risky work.** A and B pair on the placement query. C and D pair on the section config schema. These two interfaces cause the most rework when they are got wrong.

---

## Interfaces: where the four meet

Four people means four pairs that can break each other. These are the seams.

| Seam | Between | What crosses it | Risk if wrong |
|---|---|---|---|
| Prisma schema | A and B | Table shapes | B blocked, migration churn |
| Auth and guards | A and B | Every endpoint uses A's guard | Unprotected endpoints ship |
| UI kit | C and D | Components and tokens | D blocked, two visual languages |
| Section config | C and D | The shape D saves and C renders | Pages render wrong or crash |
| Content API | B and C | Public read endpoints | Pages show wrong data |
| Content API | B and D | Admin CRUD endpoints | Forms cannot save |
| Commerce API | A and C | Cart, checkout, payment | Checkout broken, worst case money bugs |
| Commerce API | A and D | Orders, submissions, settings | Admin cannot manage orders |

**The two to watch:** the UI kit (C to D, week 1) and the section config (C and D, Phase 3). Both are early, both block someone, and both are easy to get wrong because they feel like small decisions at the time.

---

## Blockers from Flowtop

| # | Needed | Blocks | By when | Status |
|---|---|---|---|---|
| 1 | Customer accounts in v1, yes or no | The schema, task 1.A1 | **Day 1** | Open |
| 2 | Inventory manual or integrated | The schema, task 1.A1 | **Day 1** | Open |
| 3 | Payment gateway choice | Tasks 2.A3, 3.A1 | Week 3 | Open |
| 4 | Shipping, tax and refund rules | Tasks 3.A4, 5.C6 | Week 5 | Open |
| 5 | Sender domain and three inboxes | Task 4.A4 | Week 6 | Open |
| 6 | WhatsApp number and templates | Tasks 4.C6, 4.C7 | Week 7 | Open |
| 7 | Final product data and images | Task 5.B2 | Week 9 | Open |
| 8 | Legal page text | Task 5.C6 | Week 9 | Open |

Items 1 and 2 are day one, not week seven. They change the schema and the schema is the first thing built.

---

## The three that must not be got wrong

Every one of the four should be able to recite these.

1. **Placement is its own table.** product, location, position, enabled. Never a flag on the product. **Owner: B, task 3.B1.**
2. **Payment is confirmed by webhook, idempotently.** Never by redirect. **Owner: A, tasks 3.A2 and 3.A3.**
3. **Permissions are checked server-side on every route.** Hiding a button is not security. **Owner: A, task 1.A6. B must use the guard on every endpoint. C and D must never assume the UI is the guard.**

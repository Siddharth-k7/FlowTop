# SRS Summary

Condensed from *Flowtop Website Software Requirements Specification v1.0*, 9 October 2026.

This is the reference version. The full SRS is the contract with Flowtop; this file is what you read while building. Where they disagree, the SRS wins.

---

## What Flowtop asked for

A premium bathfittings website with an admin CMS, where staff control everything without a developer.

The defining line from the SRS:

> Flowtop staff must be able to add, edit, publish, arrange and retire website content, including products and exactly where each product is showcased, without a developer for routine updates.

Everything else follows from that.

---

## Core principles

1. Content is data-driven. Never hard-code a product, collection, exhibition or campaign into a page layout.
2. Routine edits need no developer.
3. The CMS offers controlled design options, not unrestricted CSS that can break the brand.
4. Admin actions are permission-checked on the server, not merely hidden in the interface.
5. The site stays usable when 3D or video assets fail, with static image fallbacks.

---

## Users

**Public:** consumers browsing and buying, trade and project buyers downloading catalogues and enquiring, returning customers checking an order.

**Admin, six roles in the full spec:**

| Role | Can do | Cannot do |
|---|---|---|
| Super Admin | Everything, including roles, payment config, security | Nothing, but sensitive actions are logged |
| Website / Marketing Admin | Pages, sections, navigation, campaigns, journal, exhibitions, media, SEO | Payment credentials, roles, security |
| Product Manager | Products, variants, categories, collections, finishes, 3D, placement | Roles, gateway secrets |
| Orders / Commerce Staff | View orders, change permitted statuses, export | Site layout, roles, gateway secrets |
| Support Staff | View warranty submissions and related context | Prices, products, design, permissions |
| Read-only Reviewer | Preview and review | Create, edit, delete, publish, export |

MVP ships the first three. The permission table supports all six.

---

## Requirement groups

The SRS numbers 79 requirements. Full detail is in the original document; these are the groups and what each is about.

| Prefix | Area | Count | The point |
|---|---|---|---|
| IAM | Identity and access | 8 | Server-enforced RBAC, MFA for super admins, audit log, guest checkout |
| CMS | Content lifecycle | 6 | Draft, preview, publish, schedule, archive, with revision history |
| PRD | Products | 8 | Full CRUD, unique SKU, variants, **data-driven specifications** |
| PLC | Placement | 6 | One product in many locations, each removable independently |
| PG | Page builder | 5 | Reusable sections, reorder and duplicate, **preset-only styling** |
| CAT / COL / NAV | Taxonomy | 4 | Categories, collections, CMS-managed menus |
| 3D | Product viewer | 4 | GLB models, finish switching, graceful fallback |
| ORD | Commerce | 6 | **Server-side pricing, verified payment, idempotent callbacks** |
| COM | Email and forms | 4 | Configurable recipients, validation, honest success states |
| WAR | Warranty | 4 | Registration and claims, private attachments |
| CNT | Editorial | 4 | Journal, exhibitions, projects, shared media library |
| RWD | Responsive | 5 | Works at 360px, public site and admin, WCAG 2.2 AA oriented |
| SEC | Security | 10 | HTTPS, hashing, server authz, upload checks, backups with a tested restore |
| PERF | Performance | 4 | LCP under 2.5s, lazy loading, CDN |

---

## The placement requirement

This is the one the client cares about most and the one most likely to be built wrong, so it gets its own section.

**Locations a product can appear in:**

- Homepage: Featured, New Arrivals, Bestsellers, Recommended, campaign areas, collection spotlights
- Category pages: Basin Mixers, Pillar Cocks, Bib Cocks, Shower Mixers, Kitchen Faucets, Accessories
- Collection pages, manually ranked
- Campaign and landing pages
- Other product pages: related, matching finishes, accessories, Complete the Look
- Journal articles, exhibitions, projects

**The acceptance scenario, quoted from the SRS:**

> An admin creates "Flowtop Opel Basin Mixer", assigns it to "Basin Mixers" and "Opel Collection", then adds it to "Homepage Featured" at position 2. After publishing, it appears in all three places in the configured order without a code deployment.

And PLC-03:

> The admin MUST see the current placements for a product and remove a placement without deleting the product. Removing a placement affects only that location.

A boolean column on the product cannot satisfy that. It must be its own table.

---

## Section library

Ten section types in the full spec. MVP ships six; see `02-mvp-scope.md`.

Hero / banner · Product grid or carousel · Collection showcase · Image and text · Video and gallery · 3D product experience · Manufacturing and quality steps · Journal, exhibition and project cards · FAQ, testimonials and statistics · CTA, document download and contact

---

## Acceptance tests

Twelve scenarios, all demonstrated in staging with test payment credentials.

| Test | Scenario |
|---|---|
| AT-01 | Product CRUD with no code change |
| AT-02 | Placement across category, collection and homepage, then remove one |
| AT-03 | Rearrange the homepage and publish |
| AT-04 | Create a campaign landing page from a template |
| AT-05 | 3D model with a working fallback |
| AT-06 | Journal article and exhibition page |
| AT-07 | Role and permission enforcement, including direct API calls |
| AT-08 | Guest checkout with server-verified payment |
| AT-09 | WhatsApp message prefilled with name, SKU, finish and URL |
| AT-10 | Warranty submission with private attachments |
| AT-11 | Responsive core journeys |
| AT-12 | Resilience under bad input, spam, expired sessions, failed email, webhook retries |

MVP covers nine. AT-05, AT-10 and half of AT-06 move with their deferred features.

---

## Release gates

- No unresolved critical security defects
- A backup restoration test performed and documented
- Every MUST requirement tested, or accepted as an exception by Flowtop
- Email, payment, WhatsApp and forms verified in staging
- **Flowtop staff complete training and pass the key admin workflows unaided**

The last one is the real test. Everything else can pass while the product still fails its purpose.

---

## Explicitly out of scope, version 1

Full CRM, ERP or warehouse system. A dealer or distributor portal. Native mobile apps. An AI assistant or personalisation engine. A full virtual bathroom designer, or AR for every SKU.

---

## Decisions Flowtop still owes us

Payment gateway. Shipping, tax, returns and serviceable regions. Verified sender domain and recipient inboxes. Official WhatsApp number and approved templates. Warranty durations, terms and required proof. Final SKU data, images and finish matrix. Which products get GLB files. Inventory manual or integrated. Whether customer accounts ship at all.

The last two change the database schema, so they are needed on day one, not in week seven.

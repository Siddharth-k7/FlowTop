# MVP Scope

What ships in version one, what waits, and why.

**Read this before building anything not already specified.** If a feature is not in here, it is not in the MVP, whatever the SRS says.

---

## MVP in one line

A visitor can browse products, read specifications, enquire on WhatsApp and buy with guest checkout. An admin can add a product, decide where it appears, and rearrange the homepage. Nothing else.

**47 requirements in. 12 partial. 20 deferred. 9 of the 12 acceptance tests in scope.**

---

## In scope

### Authentication and roles — partial

Three roles ship: Super Admin, Marketing Admin, Product Manager. MFA for Super Admin. Server-side permission checks on every route. Audit log.

**Deferred:** Orders Staff, Support Staff, Read-only Reviewer. Super Admin covers their work. The permission table supports all six, so adding them later is configuration.

### Products — full

Full CRUD. Unique SKU. Variants and finishes. **Data-driven specifications** so staff can add a field like "Spout Reach" with no code change. Images, gallery ordering, PDF documents. SEO fields. Archive with a foreign-key guard.

**Deferred:** product video, 3D model.

### Placement — nearly full

One product in many locations. Manual position per location. Enable and disable. Remove one placement without affecting the others or the product. In-context preview.

**Deferred:** active date ranges on a placement (moves with scheduling). Rule-based sources ship with one rule only, newest in a category.

### Page builder — full, with six sections

Add, delete, duplicate, reorder, hide and show. Preset-only styling. Responsive preview. Page slug and SEO.

Six sections ship:

| Section | In MVP |
|---|---|
| Hero / banner | Yes |
| Product carousel | Yes |
| Collection showcase | Yes |
| Image and text | Yes |
| Gallery | Yes, images only |
| CTA and document download | Yes |
| Video | No |
| FAQ, testimonials, statistics | FAQ only, as a page, not a section |
| Journal / exhibition / project cards | No |
| Manufacturing and quality steps | No |
| 3D product experience | No |

Six is enough to build a homepage and a campaign page, which is what AT-03 and AT-04 test.

### Categories and collections — partial

Category CRUD with ordering. Collections with story, hero image, assigned ranked products and SEO.

**Deferred:** collection video, related-content links.

### Navigation — partial

CMS-managed header with one dropdown level, plus footer links.

**Deferred:** featured-link blocks in the menu, broken-URL validation.

### Commerce — full

Cart with server-side price recalculation. Guest checkout. Gateway payment verified server to server. Idempotent webhooks. Order records with a unique reference. Admin order list with four statuses. Two emails per order.

**MVP limits:** flat shipping rate, single tax rate, no discount codes, no stock counts, four order statuses only.

### WhatsApp — full

Site-wide button. Product actions prefilled with name, SKU, selected finish and URL. Number and templates editable in admin.

### Email and forms — partial

Three routed events: online order, contact enquiry, dealer enquiry. Configurable recipients and sender. Validation, rate limiting, spam protection. Submissions retained in a protected admin area.

**Deferred:** warranty registration, warranty claim, admin security notifications.

### Journal — partial

Articles with hero, body, SEO and product links. It ships because marketing needs something to post at launch and it is the cheapest content module.

**Deferred:** exhibitions, projects, gallery albums.

### Media library — full

Central upload and reuse across every content type. Public and private buckets separated from day one.

### Security — full

All ten SEC requirements. HTTPS, modern password hashing, server-side authorization, secure cookies, input validation, CSRF, rate limits, upload checks, gateway-held card data, secrets in environment storage, backups with a tested restore, legal pages.

**Partial:** malware scanning on uploads, which moves with the warranty attachments.

### SEO and performance — full

Editable metadata on every content type. Sitemap, robots, structured data, canonicals. Responsive images, modern formats, lazy loading, CDN. LCP target under 2.5s on mobile.

**Deferred:** redirect management for changed slugs.

### Analytics — partial

Page views, product views, search, filters, add to cart, checkout, purchase, WhatsApp clicks, form submissions.

**Deferred:** 3D interaction and warranty events, which move with those features.

---

## Deferred to phase two

| Feature | Why it waits |
|---|---|
| **3D product viewer** | Flowtop has not supplied GLB files. The SRS itself says 3D must not block the first release. |
| **Warranty registration and claims** | The approved policy, durations and proof requirements do not exist yet. Building the form first means building it twice. |
| **Exhibitions, projects, gallery** | Static pages cover About, Manufacturing and Quality at launch. |
| **Scheduled publishing** | Needs a job runner for little launch value. |
| **Revision history and rollback** | Add the `revision` column now, build the feature later. |
| **Three remaining admin roles** | Super Admin covers their work in MVP. |
| **Customer accounts** | Guest checkout satisfies the requirement. |
| **Redirect management, nav validation, video sections** | Low value against week-one cost. |

**MVP stopgap for support:** a Support page with CMS-managed FAQs, downloadable manuals and the support WhatsApp button. Customers can reach a human. They just cannot submit a structured warranty form yet.

---

## Schema columns to add now

These belong to deferred features. Add the columns in the first migration anyway. Adding them later means a migration across live data.

`product.model_url` · `product.video_url` · `placement.active_from` · `placement.active_to` · `page.scheduled_at` · `section.scheduled_at`

Build nothing that uses them.

---

## Acceptance tests in MVP

| Test | In MVP | Note |
|---|---|---|
| AT-01 Product CRUD | Yes | Primary gate |
| AT-02 Placement | Yes | Primary gate |
| AT-03 Dynamic homepage | Yes | Primary gate |
| AT-04 New page | Yes | Primary gate |
| AT-05 3D model | No | Moves with 3D |
| AT-06 Journal and exhibition | Partial | Journal half only |
| AT-07 Permissions | Yes | Against the three MVP roles |
| AT-08 Checkout | Yes | Primary gate |
| AT-09 WhatsApp | Yes | Primary gate |
| AT-10 Warranty | No | Moves with warranty |
| AT-11 Responsive | Yes | |
| AT-12 Resilience | Yes | |

**Sign-off needs AT-01, 02, 03, 04, 07, 08, 09, 11 and 12 to pass.**

---

## Adding something not in this file

Do not. If Flowtop asks for a feature mid-build, it goes on the phase two list unless all four developers and Flowtop agree to swap it for something already in scope.

Scope that grows quietly is how a ten-week project becomes a sixteen-week one.

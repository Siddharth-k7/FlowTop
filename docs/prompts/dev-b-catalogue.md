# Dev B - Catalogue and Content

**Your scope:** `backend/src/{products,variants,specifications,categories,collections,placements,pages,sections,navigation,journal,analytics,search}`

**Not your scope:** `backend/src/{auth,users,media,settings,audit,common,cart,orders,payments,email,submissions}` and `backend/prisma/` are Dev A. `frontend/` is Dev C. `admin/` is Dev D.

**Dev A owns the schema.** You propose content table changes through him, you never edit `schema.prisma` yourself.

---

## How to use this file

Run the prompts in order. After each phase, run the checks, then post the "send for review" block.

You build the heart of the product. Placement is the feature Flowtop is paying for, and it is in Phase 3. Everything before that is preparation for getting it right.

Dev C and Dev D consume almost every endpoint you write. When you change a response shape, you break their screens, so the API contract is not a suggestion.

---

## PROMPT 0 - Orient

```
Read these before writing any code:
- AGENTS.md at the repo root
- backend/AGENTS.md
- docs/04-data-model.md
- docs/03-api-contract.md
- docs/06-conventions.md
- docs/05-team-split.md, the Dev B sections

Then tell me, in your own words:
1. Which backend modules I own and which belong to Dev A
2. Why placement is a separate table and what breaks if it is a column
3. Why specifications are rows and not columns
4. What happens to a product's other placements when one is deleted

Do not write any code yet.
```

---

# PHASE 1 - Groundwork (Weeks 1 to 2)

Dev A is writing the schema and auth. You cannot build content modules until the schema exists, so build the foundations every module will reuse, and the seed data everyone else needs.

## Prompt 1.1 - Review the schema

```
Dev A has written backend/prisma/schema.prisma from docs/04-data-model.md.
Review the content tables only: Product, Variant, Specification, Category,
Collection, CollectionProduct, Placement, Page, Section, NavigationItem,
JournalArticle, ArticleProduct.

Check each against the data model doc and tell me:
- Any missing column or wrong type
- Any missing index or unique constraint
- Whether placement has its unique constraint on
  (productId, locationType, locationId) and its index on
  (locationType, locationId, position)
- Whether every money column is Int
- Whether the deferred columns exist: model_url, video_url, active_from,
  active_to, scheduled_at

Do not edit the schema. Produce a list of findings I will send to Dev A.
```

## Prompt 1.2 - Shared base classes

```
Build the foundations every content module will reuse. Put them in
backend/src/_base/.

1. BaseRepository<T> with typed find, findMany with pagination, create,
   update and softDelete. Pagination returns the meta envelope from
   docs/03-api-contract.md.

2. PublishStateService implementing the state machine: draft, published,
   unpublished, archived. Legal transitions only, rejecting the rest.
   Publishing sets publishedAt. Archiving checks for blocking references
   first. Every transition writes an audit row through Dev A's AuditService.

3. SlugService: generate a slug from a name, guarantee uniqueness within a
   type, append -2, -3 on collision, and allow manual override.

4. SeoFields DTO and mixin, reused by Product, Category, Collection, Page
   and JournalArticle. Five fields: title, description, canonical,
   shareImageId, plus validation on length.

5. OrderableService for anything with a position column: reorder by an array
   of ids, in one transaction, with no gaps left behind.

Write tests for every one. These are used by eleven modules, so a bug here
is a bug everywhere.
```

## Prompt 1.3 - Seed data

```
Write realistic Flowtop seed data. Dev C and Dev D are blocked on this,
because their screens look fake without it.

In backend/prisma/seed-content.ts, create:

6 categories: Basin Mixers, Pillar Cocks, Bib Cocks, Shower Mixers,
Kitchen Faucets, Accessories.

3 collections with real stories: Opel (modern minimal), Aria (classical),
Lumen (industrial). Each with a 2-paragraph story and a hero image
reference.

40 products spread across those categories, with:
- Real-sounding names, "Opel Basin Mixer", "Aria Wall Mounted Bib Cock"
- SKUs in the format FT-OBM-001
- Prices in paise, realistic for premium Indian bathfittings, roughly
  200000 to 1500000
- 2 to 4 finishes each: Chrome, Matte Black, Rose Gold, Brushed Nickel,
  with swatch hex codes
- 6 to 10 specifications each, using real bathfitting fields: Material,
  Finish, Installation Type, Dimensions, Weight, Cartridge, Flow Rate,
  Warranty, Spout Reach
- Some products deliberately incomplete, missing images or specs, so
  Dev D's "needs attention" dashboard card has something to show
- 5 products marked enquiry-only, so Dev C can build that variant
- 3 archived, 5 draft, the rest published

Also: 6 journal articles, a homepage with 5 sections, a navigation tree.

Make it varied. Every product having 3 finishes and 8 specs is not realistic
and hides edge cases.
```

## Prompt 1.4 - Test harness

```
Set up the integration test harness my modules will use.

- Test database spun up per run, migrated and seeded
- Helpers to create an authenticated request as each role
- Helpers to assert the response envelope and the error envelope shapes
- A fixture factory per entity so tests are readable
- Cleanup between tests so they do not leak into each other

Then write one example integration test end to end, so I can see the pattern
before I write forty of them.
```

---

## ✅ PHASE 1 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Schema review | Findings list sent to Dev A |
| 2 | Publish a draft, then try draft to archived to published | Legal transitions pass, illegal ones are rejected |
| 3 | Create two things with the same name | Slugs are unique, second gets -2 |
| 4 | Reorder 5 items by sending a new id array | Positions are 1 to 5 with no gaps |
| 5 | Seed a clean database | 40 products, 6 categories, 3 collections, varied data |
| 6 | Hand the seed to Dev C and Dev D | They confirm it is realistic enough to build against |
| 7 | Run the example integration test | Passes, and the pattern is clear |

### Send for review

```
Phase 1 done. For review:
- Schema findings sent to Dev A
- The publish state machine and its legal transitions
- A sample of 5 seeded products as JSON
- Confirmation from C and D that the seed data works for them
- Results of checks 1 to 7
```

---

# PHASE 2 - Products, categories, collections (Weeks 3 to 4)

## Prompt 2.1 - Product CRUD

```
Build the products module.

Admin endpoints exactly as docs/03-api-contract.md specifies:
GET /admin/products with search, status filter, category filter, a
"missing" filter for images or specs, and pagination
POST /admin/products
GET /admin/products/:id
PATCH /admin/products/:id
POST /admin/products/:id/publish, unpublish, archive
POST /admin/products/bulk

Every route uses Dev A's AuthGuard and PermissionGuard with the right
permission string. Every write has a DTO with validation. Every publish,
archive and delete writes an audit row.

The "missing" filter powers Dev D's dashboard card, so it must be efficient,
not a full scan with a filter in JavaScript.

SKU is unique. A duplicate returns 422 with the fields object naming sku, so
Dev D can highlight the field.

Archive instead of delete. Hard delete returns 409 when an order or a
warranty record references the product.
```

## Prompt 2.2 - Variants and specifications

```
Build the variants and specifications modules.

Variants:
GET, POST /admin/products/:id/variants
PATCH, DELETE /admin/variants/:id
POST /admin/products/:id/variants/reorder

- skuSuffix unique within a product
- Exactly one variant is default, setting a new default clears the old one
- priceOverride is nullable, resolve to the product price when null
- Deleting the last variant is allowed, a product with no finishes is valid

Specifications, and this is the important one:
GET /admin/products/:id/specifications
PUT /admin/products/:id/specifications

PUT replaces the whole ordered list in one transaction. Dev D sends the
full array on save, so there is no per-row patching and no orphan rows.

- Rows are name, value, unit, type, group, position
- type is text, number, boolean or choice
- A row with an empty value is rejected, never stored. The public page must
  never have an empty spec row to filter.
- Any name is allowed. Staff must be able to add "Spout Reach" without a
  developer. Do not build a fixed allow-list.

Write a test that adds a specification name that does not exist anywhere in
the codebase and confirms it saves and reads back.
```

## Prompt 2.3 - Categories and collections

```
Build the categories and collections modules.

Categories:
GET /categories, public, returns a tree, one level of nesting
GET /categories/:slug, public
GET, POST /admin/categories
PATCH /admin/categories/:id
POST /admin/categories/reorder
DELETE /admin/categories/:id returns 409 when it still has products, with a
message telling Dev D to offer a move instead

Collections:
GET /collections and GET /collections/:slug, public
GET, POST /admin/collections
PATCH /admin/collections/:id
PUT /admin/collections/:id/products with { items: [{ productId, position }] }

The products on a collection are a ranked join. Removing a product from a
collection removes the join row only. The product is untouched. Add a test
asserting that.

Both carry the SEO fields mixin. Both use the publish state machine.
```

## Prompt 2.4 - Public read endpoints

```
Build the public product read endpoints. Dev C builds his entire Phase 2
against these, so match docs/03-api-contract.md exactly.

GET /products with filters for category, collection, finish, price range and
availability, plus sort and pagination
GET /products/:slug
GET /products/:slug/related

Return the ProductCard shape for lists and the ProductDetail shape for the
single product. Both are specified in the contract. Do not invent fields and
do not rename any.

Rules the API enforces, because Dev C must not have to:
- A specification with an empty value never appears in the array
- variants is [] when there are none, never null
- An archived or unavailable product returns isPurchasable false regardless
  of its own flag
- A variant's price is already resolved, override applied
- Only published content is returned, ever

Performance:
- No N+1 queries. Load variants, specs and media in one go.
- Index whatever the filters need before shipping, not after someone
  complains
- Paginate, and cap perPage so nobody can request 10000 rows
```

---

## ✅ PHASE 2 CHECKS

### AT-01, the product test

| # | Check | Pass when |
|---|---|---|
| 1 | Create a product as draft, edit it, publish, archive | Every transition works, audit rows written |
| 2 | **Add a specification called "Spout Reach"** | Saves and reads back, no code change |
| 3 | Save a product with an empty spec value | Rejected |
| 4 | Create a duplicate SKU | 422 with fields.sku set |
| 5 | Archive a product referenced by an order | Blocked with 409 |
| 6 | Remove a product from a collection | Join row gone, product intact |

### Shapes

| # | Check | Pass when |
|---|---|---|
| 7 | Diff your ProductDetail response against the contract | Identical, field for field |
| 8 | A product with no variants | variants is [], not null |
| 9 | A product with an empty weight spec | That row is absent from the response |
| 10 | An archived product via the public endpoint | 404, not a hidden product |
| 11 | An unavailable product | isPurchasable false |

### Performance

| # | Check | Pass when |
|---|---|---|
| 12 | Log queries while loading the product list | No N+1, one query per concern |
| 13 | Request perPage=10000 | Capped |
| 14 | Filter by category and finish together | Uses an index, check the query plan |

### Send for review

```
Phase 2 done. For review:
- One full ProductDetail response, diffed against the contract
- The specification editor accepting a brand new field name
- Query log for the product listing, showing no N+1
- Results of checks 1 to 14
- Confirmation from Dev C that his mocks match my real responses
```

---

# PHASE 3 - Placement and pages (Weeks 5 to 6)

The most important phase in the project. The placement module is what Flowtop is buying.

## Prompt 3.1 - Placement

```
Build the placements module. Read docs/04-data-model.md and the placement
section of docs/03-api-contract.md first.

The concept: one product is showcased in many locations at once. Each
showcase is its own row. Removing one row affects that location and nothing
else.

Table columns: productId, locationType, locationId, position, label,
enabled, activeFrom, activeTo.
locationType is homepage_section, category, collection, campaign_page or
related.
locationId is a section key like "featured" for homepage sections, or a uuid
for the rest.

Endpoints:
GET /admin/products/:id/placements
POST /admin/products/:id/placements
PATCH /admin/placements/:id
DELETE /admin/placements/:id
POST /admin/placements/reorder with { locationType, locationId, ids }
GET /admin/placement-locations, the searchable picker list for Dev D

ABSOLUTE RULES:
- DELETE removes exactly one row. It never touches the product and never
  touches another placement. This is acceptance test AT-02 step 8.
- There is no boolean column on product that duplicates this. The flags
  isFeatured, isNewArrival and isBestseller exist only as inputs to
  rule-based section sources, never as placements.
- Unique on (productId, locationType, locationId), so a product cannot be
  placed twice in one location.

Write tests:
1. Place one product in 3 locations, delete one, assert the other 2 and the
   product still exist
2. Place the same product twice in one location, assert it is rejected
3. Delete a product, assert its placements cascade
4. Delete a placement, assert the product does not cascade
```

## Prompt 3.2 - Placement resolution

```
Build the public placement query. This is the hot path on the homepage, so
it has to be fast and correct.

GET /placements/:locationType/:locationId returns ordered ProductCards.

Filtering, server side, not the frontend's job:
- Disabled placements excluded
- Unpublished or archived products excluded
- Products outside their activeFrom and activeTo window excluded, the column
  exists even though scheduling is deferred
- Ordered by position ascending

The ProductCard carries a badge field. It comes from the placement's label
for THIS location, not from the product. The same product can be "New" on
the homepage and have no badge in its category.

Also build rule-based sources:
- newest in a category
- bestsellers, using the product flag
Keep the rule system small. One rule type ships in the MVP, the shape should
allow more.

Performance: one query, no N+1, indexed on
(locationType, locationId, position). Call Dev A's cache invalidation helper
whenever a placement changes.
```

## Prompt 3.3 - Pages and sections

```
Build the pages and sections modules.

GET /pages/:slug, public. The homepage is the page with slug "".
GET, POST /admin/pages
GET, PATCH /admin/pages/:id
POST /admin/pages/:id/publish
POST /admin/pages/:id/sections
PATCH /admin/sections/:id
DELETE /admin/sections/:id
POST /admin/sections/:id/duplicate
POST /admin/pages/:id/sections/reorder

Section columns: pageId, type, position, visible, config as jsonb.

THE CRITICAL PART: validate the config server side against the preset enums
in docs/03-api-contract.md. The admin UI offers dropdowns, but the API is
what enforces it. Reject any value outside the approved set with 422, even
though the UI would never send it.

Validate per section type. Each of the six types has its own config shape in
the contract. Build a schema per type and validate against it. Reject
unknown keys as well as bad values.

Duplicate copies the config wholesale and appends at the end. The editor
then swaps the content while keeping the layout.

Hidden sections stay saved but are excluded from the public response.

Write a test that posts a section with background "#FF0000" instead of a
preset name and asserts a 422.
```

## Prompt 3.4 - Navigation, journal, analytics

```
Three smaller modules.

1. Navigation:
GET /navigation, public, header and footer
GET, PUT /admin/navigation, replaced wholesale like specifications

Items carry label, linkType (page, category, collection, product, external),
destination, openInNewTab, position, and one level of children. Validate
that an internal destination resolves to something that exists, and warn
when it points at unpublished content.

2. Journal:
GET /journal with category filter and pagination, public
GET /journal/:slug, public
GET, POST /admin/journal
PATCH /admin/journal/:id
POST /admin/journal/:id/publish

Fields: title, slug, author, date, category, heroImage, body as HTML,
related products, SEO. Uses the publish state machine and the SEO mixin.

3. Analytics ingestion:
POST /analytics/events, public, rate limited by Dev A's guard.
Validate the event type against the allowed list in the contract. Store
nothing sensitive. Dev A hardens this in his phase 4, build it clean now.
```

---

## ✅ PHASE 3 CHECKS

### AT-02, the placement test. This is the project.

| Step | Action | Pass when |
|---|---|---|
| 1 | Place a product in Basin Mixers | Row created |
| 2 | Place the same product in Opel Collection at rank 1 | Row created |
| 3 | Place it in Homepage Featured at position 2 | Row created |
| 4 | Query all three locations publicly | Product appears in all three, right order |
| 5 | **DELETE the homepage placement** | **That row only. Other two rows intact. Product intact.** |
| 6 | Query all three again | Gone from homepage, still in the other two |

If step 5 removes anything else, the model is wrong. Stop and fix it before continuing.

### Placement behaviour

| # | Check | Pass when |
|---|---|---|
| 7 | Place the same product twice in one location | Rejected, unique constraint |
| 8 | Disable a placement | Product disappears from that location only |
| 9 | Archive the product | Gone from every location, placements still exist |
| 10 | Delete the product | Placements cascade away |
| 11 | Set a badge on the homepage placement only | Badge appears on the homepage card, not the category card |
| 12 | Query a location with 50 placements | One query, indexed, fast |

### Section validation

| # | Check | Pass when |
|---|---|---|
| 13 | POST a section with background "#FF0000" | 422 |
| 14 | POST a section with spacingTop "huge" | 422 |
| 15 | POST a section with an unknown config key | 422 |
| 16 | POST a hero config into a gallery section | 422 |
| 17 | Duplicate a section | Config copied exactly, appended at the end |
| 18 | Hide a section, fetch the page publicly | Section absent |

### Send for review

```
Phase 3 done. For review:
- Recording or log of AT-02, all 6 steps, especially step 5
- The section config validator, one schema per type
- Proof that a hex colour is rejected
- Query plan for the placement resolution
- Results of checks 1 to 18
```

---

# PHASE 4 - Supporting the frontends (Weeks 7 to 8)

Dev C builds checkout, Dev D builds order admin. You support both and finish the content side.

## Prompt 4.1 - Availability for the cart

```
Dev A's cart calls into my modules to check whether something can be bought.
Build that interface.

- checkPurchasable(productId, variantId) returning a clear result object,
  not a boolean, so the cart can tell the user why
- Reasons: not published, archived, not purchasable, variant unavailable,
  variant does not belong to this product
- getCurrentPrice(productId, variantId) returning the authoritative price in
  paise, override resolved

Dev A's cart recalculates on every call, so these have to be fast. Cache
where sensible, but invalidate on product and variant changes.

Never return a price from anywhere else. This is the single source.
```

## Prompt 4.2 - Related products and search

```
1. Related products:
GET /products/:slug/related, public
Three kinds, all driven by placement rows with locationType "related":
manually chosen related products, Complete the Look, and matching finishes.
Return ProductCards. Fall back to same-category products when nothing is
configured, so the section is never empty.

2. Public search:
GET /search?q= across products, collections and journal articles.
- Match on name, SKU, description and tags
- Weight a SKU match highest, then name, then description
- Typo tolerance if the database supports it cheaply, otherwise skip it
- Grouped results by type
- Paginated, rate limited
- Log the query for analytics, but never log who searched
```

## Prompt 4.3 - Dashboard aggregates and sitemap

```
Two endpoints other people need.

1. For Dev D's dashboard:
GET /admin/dashboard/summary
Counts of draft pages, products missing images, products missing specs,
recently updated content. Cached, cheap, no full scans.

2. For Dev C's sitemap:
GET /sitemap-data
Every published product, category, collection, page and journal article with
its slug and updatedAt. Paginated for when the catalogue grows. Drafts and
archived content excluded.
```

## Prompt 4.4 - Query performance pass

```
Audit every query I have written and fix what is slow.

- Log all queries while walking the whole public site and the whole admin
- Find every N+1 and fix it with a proper include or a batched load
- Check the query plan for the product listing with filters, the placement
  resolution, the collection page and search
- Add any missing index, and remove any index nothing uses
- Confirm every list endpoint is paginated with a capped perPage
- Load test the homepage placement resolution with 500 products

Report before and after numbers.
```

---

## ✅ PHASE 4 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Cart asks about an archived product | Clear reason returned, not just false |
| 2 | Cart asks about a variant from another product | Rejected with a reason |
| 3 | getCurrentPrice for a variant with an override | Override price returned |
| 4 | Related products with nothing configured | Falls back to the same category, never empty |
| 5 | Search for a SKU | That product ranks first |
| 6 | Search returns results grouped by type | Yes, matching the contract |
| 7 | Dashboard summary | Returns in well under a second, cached |
| 8 | Sitemap data | Drafts and archived excluded |
| 9 | Full query log walk | Zero N+1 queries remain |
| 10 | 500 products on the homepage | Placement resolution stays fast |

### Send for review

```
Phase 4 done. For review:
- The checkPurchasable result shapes
- Before and after query numbers from the performance pass
- Results of checks 1 to 10
- Confirmation from Dev A that the cart integration works
```

---

# PHASE 5 - Hardening and launch (Weeks 9 to 10)

No new features. You test Dev A's work while he tests yours.

## Prompt 5.1 - Integration test suite

```
Write the integration test suite for every endpoint I own.

For each endpoint, cover:
- The happy path
- Unauthenticated, expect 401
- Wrong role, expect 403
- Invalid input, expect 422 with the fields object populated
- Not found, expect 404
- The relevant business rule, for example duplicate SKU, illegal transition,
  invalid section config

Plus the scenario tests:
- Full product lifecycle, draft to published to archived
- Full placement lifecycle including the delete-one-keeps-others case
- Page build, reorder, duplicate, publish
- Collection with ranked products, remove one, product survives

Target meaningful coverage on services and repositories, not a percentage
for its own sake.
```

## Prompt 5.2 - Production seed and migrations

```
1. Production seed script. Categories only, with the real Flowtop names.
   No sample products, no sample content. Separate from the dev seed.

2. Review every migration for production safety:
   - No table lock on a large table
   - Every new column either nullable or with a default
   - Index creation concurrent where the database supports it
   - A tested rollback for each

3. Write a data migration guide in backend/README.md covering how to add a
   column, how to backfill safely, and how to roll back.
```

## Prompt 5.3 - API documentation

```
Generate API documentation for every endpoint I own, from the code.

Then diff it against docs/03-api-contract.md and report every difference.
Where my implementation drifted from the contract, say so clearly. Do not
silently update the contract, Dev C and Dev D built against it and a change
needs all four to agree.
```

## Prompt 5.4 - Test Dev A's work

```
Attack Dev A's modules. Do not change his code, produce findings with file,
line and how to reproduce.

Auth:
- Call protected routes with no session, an expired session, a tampered
  cookie
- Try to escalate your own role through any user endpoint
- Replay a used password reset token and a used MFA token
- Check whether login reveals whether an email exists, through message or
  timing

Payments, the important one:
- Craft the gateway success redirect by hand and see if any order becomes
  paid
- Send the same webhook twice, then ten times at once
- Send a webhook with a mismatched amount
- Send a webhook with a tampered signature

Cart:
- Send a price in the request body
- Send a negative quantity, a huge quantity, a non-integer
- Add an archived product by id

Uploads:
- Upload an executable renamed to an image
- Upload something far over the size limit
- Try to fetch a private asset without a signed URL

Report everything, even the things that passed, so we have a record.
```

---

## ✅ PHASE 5 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Integration suite | Every endpoint has a 401, a 403 and a 422 test |
| 2 | Full product lifecycle test | Passes |
| 3 | Full placement lifecycle test | Passes, including delete-one |
| 4 | Contract diff | Every drift reported, nothing silently changed |
| 5 | Migration review | No locking migration, every rollback tested |
| 6 | Production seed on a clean database | Categories only, no sample data |
| 7 | Dev A audit | Findings delivered, including the passing cases |

### Send for review

```
Phase 5 done. For review:
- Integration test results
- The contract diff report
- Findings from attacking Dev A's modules
- Confirmation that every release gate on my side passes
```

---

# Quick reference

| Phase | Prompts | Weeks | The one thing that must work |
|---|---|---|---|
| 0 | 1 | day 1 | You can explain why placement is a table |
| 1 | 1.1 to 1.4 | 1 to 2 | Seed data that C and D call realistic |
| 2 | 2.1 to 2.4 | 3 to 4 | A brand new spec field saves with no code change |
| 3 | 3.1 to 3.4 | 5 to 6 | Deleting one placement leaves the others alone |
| 4 | 4.1 to 4.4 | 7 to 8 | Zero N+1 queries on the public site |
| 5 | 5.1 to 5.4 | 9 to 10 | No drift between the code and the contract |

## You block other people

| You deliver | Who is waiting |
|---|---|
| Seed data | Dev C and Dev D, week 1 |
| Public product endpoints | Dev C, all of Phase 2 |
| Admin product endpoints | Dev D, all of Phase 2 |
| Placement endpoints | Dev D, the placement panel |
| Section config validation | Dev D, the section editor |
| Placement resolution | Dev C, every product carousel |

## Tell the others immediately if

- Dev A's schema has placement as a column on product
- Dev A ships an endpoint of mine without a permission guard available
- Dev C's mock shapes do not match my real responses
- Dev D sends a section config with a value outside the enums
- Anyone asks you to add a fixed list of allowed specification names

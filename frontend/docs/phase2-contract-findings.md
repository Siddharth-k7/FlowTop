# Phase 2 API Contract Review & Findings Report

**Date:** 2026-10-27  
**Reviewer:** Dev C (Frontend)  
**Target:** Dev B (Catalogue & Content APIs)  
**Reference Docs:** `docs/03-api-contract.md`, `docs/04-data-model.md`, `AGENTS.md`, `frontend/AGENTS.md`, `backend/src/products/`, `backend/prisma/schema.prisma`, `backend/prisma/seed-content.ts`

---

## 1. Executive Summary

Dev B recently pushed the initial product administration CRUD (`@Controller('admin/products')` in `backend/src/products/`). 

We audited the backend codebase, Prisma schema, content seed script, and test suites against the Phase 2 frontend requirements and `docs/03-api-contract.md`. 

### Key Takeaway
- **Admin product lifecycle**: Creation, updates, unique SKU constraint validation, publish/unpublish/archive transitions, and order reference protection are **functional and match contract specifications**.
- **Public endpoints for Phase 2**: **None of the public read endpoints required for Phase 2 (`GET /products`, `GET /products/:slug`, `GET /products/:slug/related`, `GET /categories`, `GET /collections`, `GET /placements/:locationType/:locationId`) have been implemented yet.**
- **Serializers**: The current admin controller returns raw Prisma model rows with `_count`. Serializers that shape `ProductCard`, `ProductDetail` (variants array, grouped specifications, resolved media URLs, nested SEO) are currently missing.
- **Contract Drifts**: Several data shapes (e.g. nested `seo` object vs flat `seoTitle` columns; resolved `MediaAsset` objects vs raw `ProductMedia` join records; raw unsanitized HTML descriptions) drift from the contract.

---

## 2. Detailed Contract Review Table

| # | Item | What the Contract Says (`docs/03-api-contract.md`) | What the API / Backend Code Returns | Verdict | Who to Ask |
|---|---|---|---|---|---|
| 1 | **Public Products List (`GET /products`)** | `GET /products?category=&collection=&finish=&minPrice=&maxPrice=&available=&sort=&page=&perPage=`. Returns `{ data: ProductCard[], meta: PageMeta }`. | Route does not exist. `products.controller.ts` only declares `@Controller('admin/products')`. | **missing** | Dev B |
| 2 | **Public Product Detail (`GET /products/:slug`)** | `GET /products/:slug`. Returns `{ data: ProductDetail }` with full descriptions, variants array, specifications array, gallery, documents, SEO. | Route does not exist. Only `GET /admin/products/:id` (by UUID) exists. | **missing** | Dev B |
| 3 | **Public Related Products (`GET /products/:slug/related`)** | `GET /products/:slug/related`. Returns `{ data: ProductCard[] }`. | Route does not exist. `RelatedProduct` table exists in DB, but no controller or service exposes it. | **missing** | Dev B |
| 4 | **Variants Shape & Nullability** | `variants: VariantDetail[]`. `[]` when none, never `null`. Each variant contains `{ id, name, skuSuffix, price, swatchHex, image: { id, url, alt }, isAvailable, isDefault }`. `price` is resolved integer paise (override applied). | Not exposed. Admin `ProductsRepository.findById` only includes `_count.variants`. In DB, `Variant` stores `priceOverride Int?` rather than resolved price. | **missing** | Dev B |
| 5 | **Specifications Structure** | Grouped array: `[ { group: string, items: [ { name, value, unit } ] } ]`. Empty values must be stripped server-side. | Not exposed. `ProductsRepository.findById` only includes `_count.specifications`. DB stores flat rows; no grouping serializer or empty-stripping helper exists. | **missing** | Dev B |
| 6 | **ProductCard Shape** | `{ id, name, slug, sku, price, salePrice, isPurchasable, isAvailable, primaryImage { id, url, alt }, hoverImage { id, url, alt }, finishes [{ id, name, swatchHex }], badge, category }`. | No serializer exists. Admin list returns raw Prisma model with `media: [{ role: 'primary' }]`, lacking `hoverImage`, `finishes` array, and `badge`. | **missing** | Dev B |
| 7 | **MediaAsset Resolution** | `{ id, filename, url, alt, width, height, sizeBytes, mimeType, createdAt, variants: { thumb?, medium?, large? } }`. Blur placeholder is not in contract. | Dev A's media service implements `MediaAsset`. However, `ProductsRepository.PRODUCT_INCLUDE` selects raw `ProductMedia` join records without joining `mediaAsset`. | **drift** | Dev B |
| 8 | **Missing / Archived Slug 404** | Missing or archived slug must return HTTP 404 with `{ error: { code: "NOT_FOUND", message, fields? } }`. | `ApiExceptionFilter` produces the exact contract error envelope. However, public slug lookup and archived product 404 check do not exist yet. | **match** (envelope) / **missing** (route) | Dev B |
| 9 | **List Filters, Sorting & Pagination** | Query params: `category, collection, finish, minPrice, maxPrice, available, sort, page, perPage`. Pagination capped at `perPage=100`. | Admin list only accepts `search, status, category, missing`. Pagination meta matches (`page, perPage, total, totalPages`). Public filter params and `sort` (`newest, price_asc, price_desc, name`) are missing; repository hardcodes `updatedAt: 'desc'`. | **missing** | Dev B |
| 10 | **Facets (Categories, Finishes, Price Min/Max)** | Contract `docs/03-api-contract.md:106-113` does NOT specify facets in `GET /products` (list envelope is strictly `Paginated<ProductCard>`). | No facets are provided or calculated by the backend. | **missing** (if frontend expects backend facets) | Dev B & Dev A |
| 11 | **Rich Text & Sanitization (Description & Story)** | `fullDescription` and `story` are rich text HTML (`<p>...</p>`). | DB stores HTML strings (`@default("")`). `CreateProductDto` accepts raw string without server-side HTML sanitization (zero sanitization in backend). | **drift** | Dev B |
| 12 | **Categories Endpoints** | `GET /categories` (public tree), `GET /categories/:slug`. | No categories controller or service exists in `backend/src/`. Categories exist in DB via `seed-content.ts` but are unserved. | **missing** | Dev B |
| 13 | **Collections Endpoints & Fields** | `GET /collections`, `GET /collections/:slug` with `story` (HTML), `heroImage`, `products` (ordered `ProductCard[]`). | No collections controller or service exists in `backend/src/`. "Shared finishes" and "related collections" do not exist in DB schema or contract. | **missing** | Dev B |
| 14 | **Product Documents (CAD, BIM, Specs)** | `documents: [ { id, name, url, sizeBytes } ]`. | `ProductDocument` model exists in `schema.prisma`, but is not in `PRODUCT_INCLUDE`, has no controller, and is not seeded. | **missing** | Dev B |
| 15 | **SEO Fields Structure** | Nested object: `seo: { title, description, canonical, shareImage: { url } }`. | Stored as flat columns (`seoTitle`, `seoDescription`, `seoCanonical`). `seoShareImage` is omitted from `CreateProductDto` and `PRODUCT_INCLUDE`. Flat fields are not mapped to nested `seo` object. | **drift** | Dev B |
| 16 | **Related Products & "Complete the Look"** | `GET /products/:slug/related`. Placements also support `locationType: "related"`. | `RelatedProduct` model exists in DB, but no endpoint exposes it. "Complete the Look" has no dedicated field/endpoint (uses related products or placement). | **missing** | Dev B |
| 17 | **Availability Message Text** | `isAvailable: boolean`, `availabilityMessage: string \| null` (e.g. `"Ships in 3 working days"`). | `Product` schema has `isAvailable` and `availabilityMessage`. Supported in DTO and seeded in `seed-content.ts`. | **match** | Dev B |
| 18 | **Duplicate SKU Rejection** | Returns 422 `VALIDATION_FAILED` with `fields: { sku: "This SKU is already in use." }`. | Implemented in `ProductsService.ensureSkuAvailable` & `rethrowDuplicateSku`. Unit test passes. | **match** | None (verified) |
| 19 | **Publish & Archive State Machine** | Transitions: `draft -> published -> unpublished -> archived`. Blocked if referenced by orders. | Implemented via `PublishStateService` and `orderReferenceCount`. Unit tests pass. | **match** | None (verified) |
| 20 | **Placements Public Resolution** | `GET /placements/:locationType/:locationId` returns ordered `ProductCard[]` with `badge`. | No placement module or controller exists in `backend/src/`. | **missing** | Dev B |
| 21 | **Live API HTTP Network Execution** | Live server ping on `http://localhost:4000/api/v1/`. | Docker daemon was inactive on local environment; live HTTP responses were verified via code analysis, repository serializers, and Jest unit tests. | **unverified** (live network ping only) | Dev A / Dev B |

---

## 3. Verdict Summary

- **Total Items Audited:** 21
- **MATCH:** 4 (Error envelope format, Availability message fields, Duplicate SKU rejection, Publish/archive state machine)
- **DRIFT:** 3 (MediaAsset join vs raw ProductMedia; flat SEO columns vs nested `seo` object; unsanitized HTML description)
- **MISSING:** 13 (All public read endpoints: `/products`, `/products/:slug`, `/products/:slug/related`, `/categories`, `/collections`, `/placements`; `variants` serializer; `specifications` grouped serializer; `ProductCard` serializer; public query/sort/filter params; facets; `documents` serializer)
- **UNVERIFIED:** 1 (Live HTTP network ping against running daemon on port 4000)

---

## 4. One-Line Action Messages for Dev B

1. **Public endpoints missing:** Please implement the public read routes specified in `docs/03-api-contract.md`: `GET /api/v1/products`, `GET /api/v1/products/:slug`, `GET /api/v1/products/:slug/related`, `GET /api/v1/categories`, `GET /api/v1/collections`, and `GET /api/v1/placements/:locationType/:locationId`.
2. **ProductCard serializer:** Public listings need a `ProductCard` serializer that resolves `primaryImage` and `hoverImage` from `MediaAsset`, formats `finishes: [{ id, name, swatchHex }]`, and attaches placement `badge`.
3. **ProductDetail variants & price resolution:** `GET /products/:slug` must serialize `variants: []` (never null) with resolved integer paise `price` (`priceOverride ?? product.price`), `swatchHex`, `name`, `skuSuffix`, and `image: { id, url, alt }`.
4. **Grouped specifications:** Specifications must be serialized as grouped arrays `[{ group: string, items: [{ name, value, unit }] }]` with empty values stripped server-side.
5. **MediaAsset population:** Update `PRODUCT_INCLUDE` to join the real `MediaAsset` relation instead of raw `ProductMedia` join table IDs.
6. **Nested SEO object:** Transform flat DB columns (`seoTitle`, `seoDescription`, `seoCanonical`, `seoShareImage`) into the contract's nested `{ seo: { title, description, canonical, shareImage: { url } } }` envelope.
7. **Public listing query filters & sort:** `GET /products` query needs to support `collection`, `finish`, `minPrice`, `maxPrice`, `available`, and `sort` (`newest | price_asc | price_desc | name`) rather than hardcoding `updatedAt: 'desc'`.
8. **Server-side HTML sanitization:** Add server-side sanitization for rich text fields (`fullDescription` and collection `story`) before saving to Postgres.
9. **Missing slug & archived 404:** Ensure `GET /products/:slug` throws 404 `NOT_FOUND` if the product does not exist OR if its status is `draft`, `unpublished`, or `archived`.

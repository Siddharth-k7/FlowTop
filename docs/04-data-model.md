# Data Model

**Status:** Draft for kickoff review. Two assumptions flagged below need Flowtop confirmation before the first migration.
**Owner:** Dev A. Dev B proposes changes to content tables through Dev A.

---

## Two assumptions to confirm

| # | Assumption | If wrong |
|---|---|---|
| 1 | **No customer accounts in v1.** Guest checkout only. No `customer` table with credentials. | Adds a customer table, auth for customers, order history. Touches orders and checkout. |
| 2 | **Manual availability, no stock counts.** A product is available or not, set by staff. | Adds stock quantity, reservations on checkout, and a release-on-failure path. |

Both are cheap now and expensive in week 7. Get the answers before the first migration.

---

## Entity overview

```
User ──< UserRole >── Role ──< RolePermission >── Permission
                                                        
Product ──< Variant                                     
   │                                                    
   ├──< Specification                                   
   ├──< ProductMedia >── MediaAsset                     
   ├──< ProductDocument >── MediaAsset                  
   ├──> Category                                        
   ├──< CollectionProduct >── Collection                
   ├──< Placement           ★ the important one         
   └──< RelatedProduct                                  
                                                        
Page ──< Section                                        
                                                        
JournalArticle ──< ArticleProduct >── Product           
                                                        
NavigationItem (self-referencing, one level)            
                                                        
Order ──< OrderItem >── Product + Variant               
                                                        
Submission                                              
Setting                                                 
AuditEvent                                              
```

---

## Core content

### Product

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| sku | text | **unique index** |
| slug | text | unique |
| category_id | uuid | FK, nullable |
| short_description | text | |
| full_description | text | rich text as HTML |
| price | integer | **paise, not rupees.** Never float money. |
| sale_price | integer | nullable |
| tax_class | text | |
| is_purchasable | boolean | false means enquiry-only, no cart button |
| is_available | boolean | manual toggle, see assumption 2 |
| availability_message | text | nullable, "Ships in 3 days" |
| is_featured | boolean | a *hint* for rules, never a placement |
| is_new_arrival | boolean | same |
| is_bestseller | boolean | same |
| status | enum | draft, published, unpublished, archived |
| published_at | timestamptz | nullable |
| seo_title | text | |
| seo_description | text | |
| seo_canonical | text | nullable |
| seo_share_image_id | uuid | FK MediaAsset, nullable |
| model_url | text | **deferred 3D. Column now, feature later.** |
| video_url | text | **deferred. Column now.** |
| created_at, updated_at | timestamptz | |

The three boolean flags are for *rule-based* section sources ("show bestsellers"). They are not placements. A product on the homepage has a Placement row, always.

### Variant

One row per finish.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| product_id | uuid | FK, cascade |
| name | text | "Chrome", "Matte Black" |
| sku_suffix | text | unique within product |
| price_override | integer | nullable paise |
| image_id | uuid | FK MediaAsset, nullable |
| is_available | boolean | |
| is_default | boolean | exactly one true per product |
| position | integer | |

### Specification

**Rows, never columns.** This is what lets staff add "Spout Reach" without a developer.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| product_id | uuid | FK, cascade |
| group | text | nullable, "Technical", "Installation" |
| name | text | "Material" |
| value | text | "Brass" |
| unit | text | nullable, "mm", "LPM" |
| type | enum | text, number, boolean, choice |
| position | integer | |

A row with an empty value is never created. The public page renders only what exists.

### Category

| Column | Type | Notes |
|---|---|---|
| id, name, slug, description | | |
| parent_id | uuid | nullable, self FK, one level |
| image_id | uuid | FK MediaAsset |
| position | integer | drives menu and listing order |
| status | enum | |
| seo_* | | same five SEO fields as Product |

### Collection

Same shape as Category plus a story, hero media, and a join table for ranked products.

**CollectionProduct:** `collection_id`, `product_id`, `position`. Unique on the pair.

---

## Placement

The headline feature. Read this twice.

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| product_id | uuid | FK, cascade |
| location_type | enum | homepage_section, category, collection, campaign_page, related |
| location_id | text | the section key, or a category/collection/page uuid |
| position | integer | order within that location |
| label | text | nullable badge, "New" |
| enabled | boolean | |
| active_from | timestamptz | **nullable. Deferred scheduling. Column now.** |
| active_to | timestamptz | **same** |

Unique on `(product_id, location_type, location_id)`.
Index on `(location_type, location_id, position)` because that is the hot read.

**Why this shape matters.** A product on the homepage, in Basin Mixers and in Opel Collection has three rows. Deleting the homepage row deletes one row. The product and its other two placements are untouched. Acceptance test AT-02 step 8 tests exactly this.

If anyone proposes `product.homepage_position` instead, the feature is broken and a rewrite is coming.

---

## Pages

### Page

`id`, `title`, `slug` (unique), `template`, `status`, `published_at`, the five SEO fields.

### Section

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| page_id | uuid | FK, cascade |
| type | enum | hero, product_carousel, collection_showcase, image_text, gallery, cta |
| position | integer | |
| visible | boolean | hidden keeps it saved but off the page |
| config | jsonb | **validated server-side against the preset enums** |

The `config` shape per type is in `03-api-contract.md`. It is shared by Dev C (renders it) and Dev D (edits it), so changing it needs both.

The homepage is a Page with `slug = ''`.

---

## Media

### MediaAsset

| Column | Type | Notes |
|---|---|---|
| id, filename, mime_type, size_bytes | | |
| bucket | enum | **public or private** |
| storage_key | text | |
| width, height | integer | nullable |
| alt_text | text | |
| variants | jsonb | generated responsive sizes |
| uploaded_by | uuid | FK User |

Two buckets, not one. Product photos are public and CDN-served. Customer documents are private and served by signed URL only. Getting this wrong means invoices become guessable URLs.

Join tables `ProductMedia` and `ProductDocument` carry `position` and a `role` (primary, gallery).

---

## Commerce

### Order

| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| reference | text | unique, human readable, FT-2026-00001 |
| customer_name, customer_email, customer_phone | text | **no account, see assumption 1** |
| delivery_* | text | address lines, city, state, pin, landmark, notes |
| subtotal, shipping, tax, total | integer | **paise** |
| payment_status | enum | pending, paid, failed, refunded |
| payment_gateway_id | text | **unique. This is the idempotency key.** |
| payment_verified_at | timestamptz | nullable. Set only by the verified webhook. |
| order_status | enum | received, confirmed, shipped, cancelled |
| created_at, updated_at | | |

`payment_gateway_id` being unique is what stops a retried webhook creating a second order.

`payment_verified_at` is set by the webhook handler and by nothing else. Not by the redirect, not by the frontend.

### OrderItem

`order_id`, `product_id`, `variant_id`, and **snapshots**: `product_name`, `sku`, `variant_name`, `unit_price`, `quantity`, `line_total`.

Snapshot the name and price at purchase time. If the product is renamed or repriced next month, the old order must still show what was actually bought.

---

## Platform

### User, Role, Permission

Three roles ship in v1: super_admin, marketing_admin, product_manager. The table supports all six from the SRS so adding the rest is configuration.

Permissions are strings like `product:update`, `placement:manage`, `order:status_change`, `settings:write`.

`User` carries `mfa_enabled` and `mfa_secret`. Super admins must have it.

### Setting

`key` (unique), `value` jsonb, `updated_by`, `updated_at`.

Holds email recipients, sender identity, the WhatsApp number and the message templates. These change without a deploy.

### Submission

`type` (contact, dealer), `payload` jsonb, `reference`, `status` (new, read, handled), `email_sent` boolean, `email_error` text.

`email_sent` and `email_error` exist so the UI can tell the truth when a record saved but the email failed.

### AuditEvent

`actor_id`, `action`, `entity_type`, `entity_id`, `metadata` jsonb, `created_at`.

Written on publish, delete, archive, role change, settings change and order status change.

---

## Conventions

- **Money is integer paise.** Never float, never decimal, never rupees.
- **Timestamps are `timestamptz`.** Store UTC, render in Asia/Kolkata.
- **Soft delete via `status = archived`.** Hard delete is blocked where an order references the row.
- **Every table has `created_at` and `updated_at`.**
- **Snake case columns, singular table names.**
- Slugs are unique within their type and generated from the name, editable after.

## Columns present for deferred features

Keep these from day one. Adding them later means a migration across live data.

`product.model_url`, `product.video_url`, `placement.active_from`, `placement.active_to`, `page.scheduled_at`, `section.scheduled_at`.

Build nothing that uses them in v1.

# API Contract

**Status:** Draft for kickoff review. All four developers sign off before any code is written against it.
**Changing this file is a pull request all four review.** Never a unilateral edit.

Base URL: `/api/v1`

---

## Conventions

**Money is integer paise.** `price: 450000` means ₹4,500.00. Never a float, never a string.

**Timestamps are ISO 8601 UTC.** `"2026-10-12T04:30:00Z"`

**Every list response is wrapped:**

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "perPage": 25, "total": 142, "totalPages": 6 }
}
```

**Every single-item response is wrapped:**

```json
{ "data": { ... } }
```

**Every error looks the same:**

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable, safe to show the user",
    "fields": { "sku": "This SKU is already in use" }
  }
}
```

Codes: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `VALIDATION_FAILED` 422, `RATE_LIMITED` 429, `CONFLICT` 409, `SERVER_ERROR` 500.

**Admin endpoints are under `/admin`.** Public read endpoints are not. Everything under `/admin` requires a session and a permission.

---

## Auth (Dev A)

```
POST   /auth/login              { email, password }
                                200 { data: { user, requiresMfa: false } }
                                200 { data: { requiresMfa: true, mfaToken } }
POST   /auth/mfa                { mfaToken, code } or { mfaToken, recoveryCode }
                                Exactly one of code or recoveryCode.
                                recoveryCode is the alternative to code: one of the
                                codes returned once by POST /auth/mfa/verify. Each works once.
                                200, the same two shapes as POST /auth/login
POST   /auth/logout             204, empty body. Clears the session cookie.
GET    /auth/me                 200 { data: { user } }
POST   /auth/password-reset     { email }
                                202 { data: { message } }
                                Status and body are identical whether or not an account
                                exists for that email. The message does not say which.
POST   /auth/password-reset/confirm  { token, password }
                                204, empty body
POST   /auth/mfa/setup          { password }
                                200 { data: { secret, otpauthUri, expiresAt } }
                                Requires the session cookie. Reachable during MFA setup.
POST   /auth/mfa/verify         { code }
                                200 { data: { recoveryCodes: string[] } }
                                Requires the session cookie. Reachable during MFA setup.
                                recoveryCodes is returned once and is not stored in clear text.
```

`secret` is base32, for typing in when a QR code cannot be scanned. `otpauthUri` is an `otpauth://` URI the admin renders as a QR code. `expiresAt` is ISO 8601 UTC. Setup does nothing to the account until verify succeeds.

Session is an httpOnly cookie. No token is ever returned in a body for the frontend to store.

**403 `MFA_SETUP_REQUIRED`.** A super admin who has not finished MFA enrolment gets this on every route behind `AuthGuard`. It is decided from the database on each request, so it lifts as soon as MFA is on. Two routes are exempt, because they are how enrolment happens: `POST /auth/mfa/setup` and `POST /auth/mfa/verify`. Both stay reachable during MFA setup. Every other guarded route, including `GET /auth/me`, answers 403 with this code until enrolment is done.

```json
User {
  "id": "uuid",
  "name": "Priya Nair",
  "email": "priya@flowtop.in",
  "role": "marketing_admin",
  "permissions": ["page:write", "section:write", "journal:write"],
  "mfaEnabled": false,
  "mfaSetupRequired": false
}

`role` is null only for a user with no role assigned yet. `mfaSetupRequired` is true for a super admin who has not finished MFA enrolment: that session reaches only `POST /auth/mfa/setup` and `POST /auth/mfa/verify` until it is false. It is recomputed from the database on every request.
```

`permissions` is for showing and hiding UI only. The server checks again on every call.

---

## Products (Dev B)

### Public

```
GET /products?category=&collection=&finish=&minPrice=&maxPrice=
             &available=&sort=&page=&perPage=
GET /products/:slug
GET /products/:slug/related
```

`sort`: `newest` | `price_asc` | `price_desc` | `name`

**ProductCard** — what listings and carousels return:

```json
{
  "id": "uuid",
  "name": "Opel Basin Mixer",
  "slug": "opel-basin-mixer",
  "sku": "FT-OBM-001",
  "price": 450000,
  "salePrice": 399000,
  "isPurchasable": true,
  "isAvailable": true,
  "primaryImage": { "id": "uuid", "url": "https://...", "alt": "..." },
  "hoverImage": { "id": "uuid", "url": "https://...", "alt": "..." },
  "finishes": [
    { "id": "uuid", "name": "Chrome", "swatchHex": "#C0C0C0" },
    { "id": "uuid", "name": "Matte Black", "swatchHex": "#1A1A1A" }
  ],
  "badge": "New",
  "category": { "id": "uuid", "name": "Basin Mixers", "slug": "basin-mixers" }
}
```

`badge` comes from the Placement row for the location being rendered, not from the product. It is null outside a placement context.

**ProductDetail** — the full product page:

```json
{
  "id": "uuid",
  "name": "Opel Basin Mixer",
  "slug": "opel-basin-mixer",
  "sku": "FT-OBM-001",
  "shortDescription": "...",
  "fullDescription": "<p>...</p>",
  "price": 450000,
  "salePrice": 399000,
  "isPurchasable": true,
  "isAvailable": true,
  "availabilityMessage": "Ships in 3 working days",
  "category": { "id": "uuid", "name": "...", "slug": "..." },
  "collections": [ { "id": "uuid", "name": "...", "slug": "..." } ],
  "variants": [
    {
      "id": "uuid",
      "name": "Matte Black",
      "skuSuffix": "MB",
      "price": 470000,
      "swatchHex": "#1A1A1A",
      "image": { "id": "uuid", "url": "...", "alt": "..." },
      "isAvailable": true,
      "isDefault": false
    }
  ],
  "specifications": [
    {
      "group": "Technical",
      "items": [
        { "name": "Material", "value": "Brass", "unit": null },
        { "name": "Flow Rate", "value": "5.7", "unit": "LPM" }
      ]
    }
  ],
  "gallery": [ { "id": "uuid", "url": "...", "alt": "...", "width": 2000, "height": 2000 } ],
  "documents": [ { "id": "uuid", "name": "Installation Manual", "url": "...", "sizeBytes": 482000 } ],
  "seo": {
    "title": "...", "description": "...", "canonical": null,
    "shareImage": { "url": "..." }
  }
}
```

**Rules the API enforces, not the frontend:**

- A specification with an empty value is never in the array. Dev C renders what arrives and nothing else.
- `variants` is `[]` when a product has no finishes. Never null.
- An archived or unavailable product returns `isPurchasable: false` regardless of its own flag.
- `price` on a variant is the resolved price, override applied. Dev C never computes it.

### Admin

```
GET    /admin/products?search=&status=&category=&missing=&page=
POST   /admin/products
GET    /admin/products/:id
PATCH  /admin/products/:id
POST   /admin/products/:id/publish
POST   /admin/products/:id/unpublish
POST   /admin/products/:id/archive
POST   /admin/products/bulk        { ids: [], action: "publish" }

GET    /admin/products/:id/variants
POST   /admin/products/:id/variants
PATCH  /admin/variants/:id
DELETE /admin/variants/:id
POST   /admin/products/:id/variants/reorder   { ids: [] }

GET    /admin/products/:id/specifications
PUT    /admin/products/:id/specifications     replaces the whole list
```

Specifications are replaced wholesale, not patched row by row. The editor sends the full ordered array on save. Simpler for both sides and avoids orphan rows.

`missing=images|specs` powers the dashboard "needs attention" card.

---

## Placements (Dev B)

The most important endpoints in the project.

```
GET    /admin/products/:id/placements
POST   /admin/products/:id/placements
PATCH  /admin/placements/:id
DELETE /admin/placements/:id
POST   /admin/placements/reorder    { locationType, locationId, ids: [] }

GET    /admin/placement-locations   the searchable list for the picker
GET    /placements/:locationType/:locationId   public, resolved products
```

**Placement:**

```json
{
  "id": "uuid",
  "productId": "uuid",
  "locationType": "homepage_section",
  "locationId": "featured",
  "locationName": "Homepage: Featured Products",
  "position": 2,
  "label": "New",
  "enabled": true
}
```

`locationType`: `homepage_section` | `category` | `collection` | `campaign_page` | `related`

`locationId` for `homepage_section` is a key: `featured`, `new_arrivals`, `bestsellers`, `recommended`. For the others it is a uuid.

**DELETE removes one placement row.** It never touches the product and never touches other placements. This is tested by AT-02 step 8.

**Public placement resolution** returns ordered ProductCards:

```json
{
  "data": {
    "locationType": "homepage_section",
    "locationId": "featured",
    "products": [ ProductCard, ProductCard ]
  }
}
```

Disabled placements and unpublished products are filtered out server-side.

---

## Categories and collections (Dev B)

```
GET    /categories                      public, tree
GET    /categories/:slug
GET    /collections                     public
GET    /collections/:slug

GET    /admin/categories
POST   /admin/categories
PATCH  /admin/categories/:id
POST   /admin/categories/reorder        { ids: [] }
DELETE /admin/categories/:id            409 if it still has products

GET    /admin/collections
POST   /admin/collections
PATCH  /admin/collections/:id
PUT    /admin/collections/:id/products  { items: [{ productId, position }] }
```

Collection detail carries `story` as HTML, `heroImage`, and `products` as ordered ProductCards.

---

## Pages and sections (Dev B, consumed by C and D)

```
GET    /pages/:slug             public. slug "" is the homepage
GET    /admin/pages
POST   /admin/pages
GET    /admin/pages/:id
PATCH  /admin/pages/:id
POST   /admin/pages/:id/publish

POST   /admin/pages/:id/sections
PATCH  /admin/sections/:id
DELETE /admin/sections/:id
POST   /admin/sections/:id/duplicate
POST   /admin/pages/:id/sections/reorder   { ids: [] }
```

**Page:**

```json
{
  "id": "uuid",
  "title": "Opel Launch",
  "slug": "opel-launch",
  "status": "published",
  "sections": [ Section ],
  "seo": { ... }
}
```

**Section:**

```json
{
  "id": "uuid",
  "type": "product_carousel",
  "position": 1,
  "visible": true,
  "config": { ... }
}
```

### Section config shapes

**This is the seam between Dev C and Dev D.** C renders these, D builds the editor for them, B validates them. Changing any shape needs all three.

Every config carries the same `layout` block:

```json
"layout": {
  "background": "white",        // white | pale | deep | black | image
  "spacingTop": "medium",       // none | small | medium | large
  "spacingBottom": "medium",
  "width": "contained",         // contained | wide | full
  "align": "left"               // left | center | right
}
```

Values outside these enums are rejected by the API with 422.

```json
// hero
{
  "headline": "The Opel Collection",
  "subheading": "...",
  "mediaType": "image",              // image | video
  "desktopImageId": "uuid",
  "mobileImageId": "uuid",
  "videoUrl": null,
  "overlay": "medium",               // none | light | medium | strong
  "textPosition": "bottom-left",     // 9-point grid
  "ctas": [ { "label": "Explore", "href": "/collections/opel", "style": "primary" } ],
  "layout": { ... }
}

// product_carousel
{
  "heading": "Featured Products",
  "source": "placement",             // placement | manual | rule
  "placementLocation": "featured",
  "productIds": [],                  // used when source is manual
  "rule": null,                      // { type: "newest", categoryId } when source is rule
  "count": 8,
  "cardStyle": "standard",           // standard | compact | editorial
  "viewAllHref": "/products",
  "layout": { ... }
}

// collection_showcase
{
  "collectionId": "uuid",
  "coverImageId": "uuid",
  "description": "...",
  "productIds": [],
  "variant": "split",                // split | stacked | overlay
  "layout": { ... }
}

// image_text
{
  "heading": "...",
  "body": "<p>...</p>",
  "imageId": "uuid",
  "mobileImageId": "uuid",
  "imageSide": "left",               // left | right
  "ratio": "50-50",                  // 50-50 | 60-40 | 40-60
  "mobileOrder": "image-first",      // image-first | text-first
  "cta": { "label": "...", "href": "..." },
  "layout": { ... }
}

// gallery
{
  "heading": "...",
  "imageIds": ["uuid"],
  "variant": "grid",                 // grid | masonry | slider
  "columns": 3,                      // 2 | 3 | 4
  "showCaptions": true,
  "layout": { ... }
}

// cta
{
  "heading": "...",
  "body": "...",
  "mode": "button",                  // button | download
  "cta": { "label": "...", "href": "..." },
  "documentId": null,
  "layout": { ... }
}
```

---

## Navigation and journal (Dev B)

```
GET    /navigation                  public, header and footer
GET    /admin/navigation
PUT    /admin/navigation            replaces the whole tree

GET    /journal?category=&page=
GET    /journal/:slug
GET    /admin/journal
POST   /admin/journal
PATCH  /admin/journal/:id
POST   /admin/journal/:id/publish
```

Navigation is replaced wholesale, same reasoning as specifications.

---

## Media (Dev A)

```
POST   /admin/media/upload          multipart. { bucket: "public"|"private", altText? }
                                    Requires media:write. 201 { data: MediaAsset }
GET    /admin/media?search=&type=&page=&perPage=
                                    Requires media:read.
GET    /admin/media/:id             Requires media:read. 200 { data: MediaAsset }
PATCH  /admin/media/:id             { altText }. Requires media:write.
DELETE /admin/media/:id             Requires media:delete. 204. 409 if still referenced
```

`media:read` is the permission for the list and for one asset. `media:delete` is the permission for delete. `media:write` is the permission for upload and for editing alt text.

`type` is `image` or `document`. It is not `pdf`. `document` selects PDFs. Any other value, including `pdf`, is 422.

`perPage` is the page size. It defaults to 25. The maximum is 100. A larger `perPage` is 422.

`search` matches the display filename and the alt text.

**MediaAsset:**

```json
{
  "id": "uuid",
  "filename": "opel-basin-mixer.jpg",
  "url": "https://cdn.../opel-basin-mixer.jpg",
  "alt": "Opel Basin Mixer in chrome",
  "width": 2000,
  "height": 2000,
  "sizeBytes": 482000,
  "mimeType": "image/jpeg",
  "createdAt": "2026-10-12T04:30:00.000Z",
  "variants": {
    "thumb": "https://cdn.../thumb.webp",
    "medium": "https://cdn.../medium.webp",
    "large": "https://cdn.../large.webp"
  }
}
```

`width` and `height` are null for anything that is not an image, such as a PDF. `variants` is `{}` until background image processing ships (task 2.1); do not assume thumb, medium or large are present.

`filename` is the cleaned original upload name, for display. It is not the last segment of `url`. That segment is the storage key. `createdAt` is ISO 8601 UTC. The list is newest `createdAt` first.

Private-bucket assets return a signed `url` that expires. Never a permanent public link.

---

## Cart and checkout (Dev A)

```
GET    /cart
POST   /cart/items          { productId, variantId, quantity }
PATCH  /cart/items/:id      { quantity }
DELETE /cart/items/:id
POST   /checkout            { contact, delivery }
POST   /checkout/:orderId/pay
GET    /orders/:reference?email=
```

**The request never contains a price.** Product id, variant id, quantity. That is all. Any price field in a cart request is ignored.

**Cart:**

```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "product": ProductCard,
      "variant": { "id": "uuid", "name": "Matte Black" },
      "quantity": 2,
      "unitPrice": 470000,
      "lineTotal": 940000
    }
  ],
  "subtotal": 940000,
  "shipping": 15000,
  "tax": 169200,
  "total": 1124200,
  "warnings": [
    { "itemId": "uuid", "code": "UNAVAILABLE", "message": "This finish is no longer available" }
  ]
}
```

Every total is computed server-side on every call. Dev C displays them and adds nothing up.

**Checkout returns a gateway handoff:**

```json
{
  "data": {
    "orderId": "uuid",
    "reference": "FT-2026-00001",
    "gateway": { "provider": "...", "orderId": "...", "amount": 1124200, "key": "..." }
  }
}
```

**After the gateway redirect, Dev C polls:**

```
GET /orders/:reference/status
    200 { data: { paymentStatus: "pending" | "paid" | "failed" } }
```

**The redirect parameters are never trusted.** `paymentStatus` becomes `paid` only when the verified webhook has run. Dev C shows a confirming state until then.

---

## Orders admin (Dev A)

```
GET    /admin/orders?status=&paymentStatus=&from=&to=&search=&page=
GET    /admin/orders/:id
PATCH  /admin/orders/:id/status     { status, note }
GET    /admin/orders/export         CSV. Requires order:export
```

Order items carry snapshot fields, so a renamed product does not change an old order.

---

## Forms and settings (Dev A)

```
POST   /submissions                 { type, payload }  rate limited
GET    /admin/submissions?type=&status=&page=
PATCH  /admin/submissions/:id       { status }

GET    /settings/public             public. WhatsApp number and templates only
GET    /admin/settings
PUT    /admin/settings              { key, value }
POST   /admin/settings/test-email
```

**Submission response tells the truth:**

```json
{
  "data": {
    "reference": "CT-2026-0042",
    "saved": true,
    "emailSent": false,
    "message": "We have your message. Our email notification failed, so please also WhatsApp us if urgent."
  }
}
```

If `saved` is false, it is an error response, not a 200. Dev C never shows success on a failure.

**Public settings:**

```json
{
  "data": {
    "whatsapp": {
      "number": "+919876543210",
      "generalTemplate": "Hi, I'd like to know more about Flowtop products.",
      "productTemplate": "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}"
    }
  }
}
```

Dev C fills the placeholders and URL-encodes the result.

---

## Analytics (Dev B)

```
POST /analytics/events   { type, payload }
```

Types: `page_view`, `product_view`, `search`, `filter_applied`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `whatsapp_click`, `form_submit`, `document_download`, `journal_view`, `collection_view`.

Never send passwords, payment details, full addresses or anything identifying a person. A `whatsapp_click` is a click event. It is never recorded as a lead.

---

## Open items

| # | Question | Blocks | Owner |
|---|---|---|---|
| 1 | Customer accounts in v1? Assumed no. | Order shape, checkout | Flowtop |
| 2 | Stock counts or manual availability? Assumed manual. | Product shape, cart | Flowtop |
| 3 | Which payment gateway? | The gateway handoff block | Flowtop |
| 4 | Shipping and tax rules | Cart totals | Flowtop |
| 5 | Are campaign pages a Page with a flag, or their own type? | Placement locationType | The four of us |

Items 1 and 2 change the schema. Settle them before the first migration.

# API Contract

**Status:** Draft for kickoff review. All four developers sign off before any code is written against it.
**Changing this file is a pull request all four review.** Never a unilateral edit.

Base URL: `/api/v1`

Health check, outside the base URL: `GET /health` returns 200 `{ data: { status: "ok", database: "up" } }`, or 503 `SERVICE_UNAVAILABLE` when the database is unreachable. No login.

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

Every list takes `?page=` (default 1) and `?perPage=` (default 25, maximum 100), whether or not its line below repeats them. `perPage` over 100 is a 422, not a silent cap.

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

Each code has exactly one status:

| Code | Status | When |
|---|---|---|
| `BAD_REQUEST` | 400 | The request cannot be read: malformed JSON, a malformed id in the path, a broken multipart upload. |
| `UNAUTHENTICATED` | 401 | No session, or it expired. |
| `FORBIDDEN` | 403 | Signed in, but the role lacks the permission. |
| `MFA_SETUP_REQUIRED` | 403 | A `super_admin` without MFA. Every route that needs a session answers this (including `GET /auth/me`) except `POST /auth/mfa/setup` and `POST /auth/mfa/verify`. Send them to MFA setup. |
| `NOT_FOUND` | 404 | No such record, or one this user may not see (the two are indistinguishable). |
| `CONFLICT` | 409 | A unique value is taken, or the record is still referenced. |
| `PAYLOAD_TOO_LARGE` | 413 | The body is over the limit (uploads: 25 MB). |
| `VALIDATION_FAILED` | 422 | The request was read, but a value is not acceptable. `fields` names each one. Only ever 422. |
| `RATE_LIMITED` | 429 | Too many attempts. The `Retry-After` header gives the seconds to wait. |
| `SERVER_ERROR` | 500 | Our fault. The message is generic; details are in the server log. |
| `SERVICE_UNAVAILABLE` | 503 | A dependency is down, for example the database behind `GET /health`. Retry later. |

A status not in this table keeps its real number and reports `BAD_REQUEST` (4xx) or `SERVER_ERROR` (5xx).

**Admin endpoints are under `/admin`.** Public read endpoints are not. Everything under `/admin` requires a session and a permission.

---

## Auth (Dev A)

```
POST   /auth/login              { email, password }
                                200 { data: { user, requiresMfa: false } }   session cookie set
                                200 { data: { requiresMfa: true, mfaToken } } no cookie yet
POST   /auth/mfa                { mfaToken, code } or { mfaToken, recoveryCode }
                                200 { data: { user, requiresMfa: false } }   session cookie set
POST   /auth/logout             204, no body. Always 204, even without a session.
GET    /auth/me                 200 { data: { user } }
POST   /auth/password-reset     { email }
                                202 { data: { message } } whether or not the account exists
POST   /auth/password-reset/confirm  { token, password }
                                204, no body. Every session of that user is signed out.
```

Session is an httpOnly cookie. No token is ever returned in a body for the frontend to store.

`POST /auth/mfa` takes exactly one of `code` (6 digits from the authenticator app) or `recoveryCode` (one of the codes shown at setup, format `ABCD-EFGH-JKMN-PQRS`; each works once). Both, or neither, is a 422. A wrong code, or an expired or used `mfaToken`, is 401: start again from `/auth/login`. Five wrong codes in 15 minutes lock MFA for that account (429, across every MFA endpoint).

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
```

`permissions` is for showing and hiding UI only. The server checks again on every call.

`role` is `null` for an account that has no role assigned. Such a user has no permissions and can reach nothing behind a permission.

`mfaSetupRequired` is true for a `super_admin` who has not set up MFA. They can sign in, but every route that needs a session answers 403 `MFA_SETUP_REQUIRED` except the two setup routes below. Show them the MFA setup screen and nothing else. (`GET /auth/me` is one of the routes that answers 403, so the admin app learns this from the login response or from that 403.)

### Two-step sign-in (MFA)

For the signed-in user's own account. Responses that carry secrets are sent with `Cache-Control: no-store`.

```
POST   /auth/mfa/setup          { password }
                                200 { data: { secret, otpauthUri, expiresAt } }
POST   /auth/mfa/verify         { code }
                                200 { data: { recoveryCodes: ["ABCD-EFGH-JKMN-PQRS", ...] } }
POST   /auth/mfa/disable        { password, code } or { password, recoveryCode }
                                204, no body
```

- **setup** needs the current password: a session alone cannot enrol an authenticator. A wrong password is 422 with `fields.password`, and counts toward the lockout (5 failures in 15 minutes, then 429). 409 if MFA is already on. `otpauthUri` is rendered as a QR code; `secret` is for typing in by hand. The pending setup expires at `expiresAt`.
- **verify** confirms the first code from the app and turns MFA on. The `recoveryCodes` are shown once and never returned again. Every other session of this user is signed out. 422 with `fields.code` for a wrong or expired code.
- **disable** needs the password and a second factor, and signs out every other session of this user. 403 `FORBIDDEN` for a `super_admin`: their MFA cannot be turned off. 409 if MFA is not on.
- **setup** and **verify** are the only routes open to a user with `mfaSetupRequired: true`.

---

## Admin users (Dev A)

```
GET    /admin/users?search=&page=&perPage=    user:read        200 list of UserSummary, sorted by name
POST   /admin/users/invite    { name, email, role }      user:manage
                                201 { data: { user: UserSummary, inviteSent } }
GET    /admin/users/:id                       user:read_self   200 { data: UserSummary }
POST   /admin/users/:id/role  { role }        user:manage      200 { data: UserSummary }
POST   /admin/users/:id/deactivate            user:manage      200 { data: UserSummary }
```

```json
UserSummary {
  "id": "uuid",
  "name": "Priya Nair",
  "email": "priya@flowtop.in",
  "role": "marketing_admin",
  "isActive": true,
  "mfaEnabled": false,
  "createdAt": "2026-10-12T04:30:00Z"
}
```

`role` is `null` when the account has no role. `role` in requests is one of `super_admin`, `marketing_admin`, `product_manager`.

- There is no registration. Accounts exist only by invitation.
- **invite** creates the account without a usable password and emails a link to `{ADMIN_URL}/accept-invite?token=...`, valid 72 hours. The admin app accepts it with `POST /auth/password-reset/confirm { token, password }`. `inviteSent: false` means the account exists but the email failed: say so, do not show a plain success. 409 with `fields.email` if the email is taken.
- **GET /admin/users/:id**: every role holds `user:read_self`, which lets a user read their own account. Reading anyone else's needs `user:read` (super admin). Someone else's id without it is 404, the same as an id that does not exist.
- **role** and **deactivate**: 403 on your own account (ask another super admin). 409 if it would leave no active super admin. Deactivating ends every session of that user immediately, and is idempotent.

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
POST   /admin/media/upload          multipart: file, bucket ("public"|"private"), altText (optional)
                                    201 { data: MediaAsset }
GET    /admin/media?search=&type=&page=&perPage=
                                    type is "image" or "document". search matches filename or alt text.
GET    /admin/media/:id             200 { data: MediaAsset }
PATCH  /admin/media/:id             { altText }   200 { data: MediaAsset }
DELETE /admin/media/:id             204. 409 if still referenced
```

- One file per upload, at most 25 MB: larger is 413 `PAYLOAD_TOO_LARGE`, cut off while it streams. The type is checked from the file's bytes, not its name or `Content-Type`; an unsupported type is 422 with `fields.file`.
- `altText` is at most 500 characters. It comes back as `alt`.
- Permissions: upload and PATCH need `media:write`, the reads `media:read`, DELETE `media:delete`.

**MediaAsset:**

```json
{
  "id": "uuid",
  "url": "https://cdn.../opel-basin-mixer.jpg",
  "alt": "Opel Basin Mixer in chrome",
  "width": 2000,
  "height": 2000,
  "sizeBytes": 482000,
  "mimeType": "image/jpeg",
  "variants": {
    "thumb": "https://cdn.../thumb.webp",
    "medium": "https://cdn.../medium.webp",
    "large": "https://cdn.../large.webp"
  }
}
```

Private-bucket assets return a signed `url` that expires (15 minutes). Never a permanent public link.

`width` and `height` are `null` for documents. **`variants` is `{}` until resized versions exist (task 2.1).** Until then, use `url` and treat each variant key as optional.

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

**`whatsapp.number` can be `null`**: Flowtop has not set one yet. Hide every WhatsApp button while it is null; never fall back to a hard-coded number. The response is cached for up to 60 seconds.

**Admin settings** (`GET /admin/settings` needs `settings:read`, `PUT` needs `settings:write`):

```json
GET /admin/settings  200
{
  "data": [
    {
      "key": "whatsapp.number",
      "value": "+919876543210",
      "description": "The WhatsApp number every button on the website opens. Empty hides WhatsApp.",
      "public": true,
      "updatedBy": { "id": "uuid", "name": "Priya Nair" },
      "updatedAt": "2026-10-12T04:30:00Z"
    }
  ]
}
```

A plain array of every setting, not paginated. `updatedBy` and `updatedAt` are `null` until someone changes the seed value. `PUT /admin/settings { key, value }` returns 200 `{ data: <the same item> }`. The keys and the shape of `value` for each:

| Key | Value | Public |
|---|---|---|
| `email.senderName` | text, 1 to 100 characters | no |
| `email.senderAddress` | an email address. `null` until first set; cannot be set back to `null` | no |
| `email.recipients.orders` | array of email addresses. `[]` until first set; a PUT needs at least one | no |
| `email.recipients.contact` | as above | no |
| `email.recipients.dealer` | as above | no |
| `whatsapp.number` | international format (`+` and 8 to 15 digits; spaces, dashes and brackets accepted on input and removed), or `null` | yes |
| `whatsapp.generalTemplate` | text, 1 to 500 characters, no placeholders | yes |
| `whatsapp.productTemplate` | text, 1 to 500 characters; placeholders `{productName}` `{sku}` `{finish}` `{url}` only | yes |

An unknown key is 422 with `fields.key`; a value that breaks its key's rule is 422 with `fields.value`. No secret (API keys, passwords) is ever stored or returned as a setting.

---

## Audit log (Dev A)

```
GET    /admin/audit?actorId=&action=&entityType=&entityId=&from=&to=&page=&perPage=
```

Requires `audit:read`, which only `super_admin` holds. Everyone else gets 403.

**Read only, and append only.** There is no endpoint that creates, edits or deletes an audit row. Rows are written as a side effect of the actions they record, and the database itself refuses any update or delete.

**Filters,** all optional, all combinable:

| Param | Value |
|---|---|
| `actorId` | A user's uuid |
| `action` | `create` `update` `delete` `publish` `unpublish` `archive` `reorder` `status_change` `role_change` `settings_change` `invite` `deactivate` `export` |
| `entityType` | Lowercase table name: `product`, `page`, `user`, `media_asset` |
| `entityId` | The record's id, or its key for keyed entities such as settings |
| `from` | Start of the range, **inclusive** |
| `to` | End of the range, **exclusive** |

`from` and `to` are full ISO 8601 timestamps **with a time zone**: `2026-10-14T00:00:00+05:30` or `2026-10-13T18:30:00Z`. A bare date such as `2026-10-14` is a 422, and so is `to` not after `from`. Inclusive `from` with exclusive `to` means consecutive ranges never count a row twice.

Paginated with the standard list envelope, **newest first.**

**AuditEvent:**

```json
{
  "id": "uuid",
  "action": "publish",
  "entityType": "product",
  "entityId": "uuid",
  "metadata": { "from": "draft" },
  "createdAt": "2026-10-14T04:30:00.000Z",
  "actor": { "id": "uuid", "name": "Ravi Kumar", "email": "ravi@flowtop.in" }
}
```

`actor` is `null` for system actions, such as a verified payment webhook. `metadata` is free-form JSON describing the change, and never holds a secret.

> **Dev D: date pickers must send full timestamps with the time zone.** The API refuses a bare date, because "midnight on 14 October" is a different instant in Asia/Kolkata and in UTC, and guessing would silently show the wrong day's rows. For "everything on 14 October" in India, send `from=2026-10-14T00:00:00+05:30` and `to=2026-10-15T00:00:00+05:30`. URL-encode the `+` as `%2B`, or it arrives as a space.

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

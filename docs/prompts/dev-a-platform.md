# Dev A - Platform and Commerce

**Your scope:** `backend/src/{auth,users,media,settings,audit,common}`, `backend/src/{cart,orders,payments,email,submissions}`, `backend/prisma/`, `infra/`, `.github/`

**Not your scope:** `backend/src/{products,variants,specifications,categories,collections,placements,pages,sections,navigation,journal,analytics,search}` is Dev B. `frontend/` is Dev C. `admin/` is Dev D.

**You own the Prisma schema.** Dev B proposes content table changes through you.

> **Phase 1 was reordered** so the things other people wait on come first. See `docs/07-dependency-schedule.md`. If you have an older copy of this file, the old 1.5 and 1.6 are now 1.3 and 1.4.

---

## Phase 1 status

Update this table as you go. It is the fastest way for anyone to see where you are.

| Prompt | What | State |
|---|---|---|
| 0 | Orient | ✅ |
| 1.1 | Scaffold + pagination envelope | ✅ |
| 1.2 | Schema | ✅ |
| 1.3 | Roles, permissions, guard | ⚠️ partial, see below |
| 1.4 | Audit log | ⚠️ partial, see below |
| 1.5 | **Media** | ❌ **Dev D is waiting** |
| 1.6 | Auth endpoints | ✅ |
| 1.7 | MFA | ✅ |
| 1.8 | Settings | ✅ |
| 1.9 | CI, secrets, staging | ⚠️ partial |

**Still open in 1.3:** object-level permission checks, admin user endpoints.
**Still open in 1.4:** `GET /admin/audit`.
**Still open in 1.9:** staging deployment.

Correct this table if it is wrong, then start at 1.5, because Dev D has been waiting on media since week 2.

---

## Git workflow

Claude Code does not branch or push for you.

```
Before each prompt:
  git checkout main && git pull
  git checkout -b dev-a/<type>/<description>

After you have checked the output:
  git add .
  git commit -m "type(scope): message"
  git push -u origin <branch>
  open the PR
```

Never work on main. One branch per prompt or small group of prompts.

---

## How to use this file

Run the prompts in order. After each phase, run the checks, then post the "send for review" block.

You are the critical path in Phase 1. Dev B cannot build content modules without the schema and the permission guard. Dev C and Dev D cannot log in without auth. Dev D cannot build the media library without upload.

**Ship rough and early.** A perfect thing on day 6 costs three other people three days each.

**Publish the signature before the implementation.** The moment you start building something a teammate needs, put its import path and method signature in `backend/AGENTS.md` with a copy-paste example, even if the body throws NotImplemented. They build against it the same day.

---

## PROMPT 0 - Orient

```
Read these before writing any code:
- AGENTS.md at the repo root
- backend/AGENTS.md
- docs/04-data-model.md
- docs/03-api-contract.md
- docs/06-conventions.md
- docs/07-dependency-schedule.md, especially the handoff register
- docs/05-team-split.md, the Dev A sections

Then tell me, in your own words:
1. Which backend modules I own and which belong to Dev B
2. The three rules the docs say must not be got wrong
3. What the placement table looks like and why it is not a column on product
4. Which of my deliverables other developers are blocked on, and by when

Do not write any code yet.
```

---

# PHASE 1 - Foundation (Weeks 1 to 2)

## Prompt 1.1 - Scaffold and the pagination envelope

```
Scaffold the NestJS app in backend/.

- NestJS with TypeScript strict mode
- Prisma as the ORM, PostgreSQL
- Config module reading from environment, with validation that fails fast on
  a missing required variable
- Global validation pipe with whitelist and forbidNonWhitelisted
- Global exception filter producing the error envelope from
  docs/03-api-contract.md exactly: { error: { code, message, fields } }
- Health check at /health
- Swagger at /docs in non-production only
- Module folder structure following backend/AGENTS.md: controller, service,
  repository, dto

Also build the pagination envelope in backend/src/common/dto/pagination.ts.
Dev B needs it from his first list endpoint, so it ships with the scaffold,
not later:
- PaginationQueryDto with page and perPage, defaulting to 25, rejecting over
  100 with 422
- A paginate() helper returning { data, meta: { page, perPage, total,
  totalPages } } exactly as the contract specifies
- A pageToSkipTake() helper for the repository layer

Document the pagination helper in backend/AGENTS.md with a copy-paste
example under a new heading "What Dev B imports from Dev A".

Create .env.example with every variable, no real values.

Do not create any feature modules yet.
```

## Prompt 1.2 - The schema

```
Write backend/prisma/schema.prisma from docs/04-data-model.md.

Create EVERY table in that document, including the ones for deferred
features. Specifically include these columns even though nothing uses them
yet: product.model_url, product.video_url, placement.active_from,
placement.active_to, page.scheduled_at, section.scheduled_at.

Follow the conventions in the doc exactly:
- snake_case columns, singular table names, mapped to camelCase in Prisma
- money as Int, representing paise
- timestamps as DateTime with @db.Timestamptz
- every table has createdAt and updatedAt

Critical constraints, do not skip any:
- product.sku unique
- placement unique on (productId, locationType, locationId)
- placement index on (locationType, locationId, position)
- order.reference unique
- order.paymentGatewayId unique, this is the payment idempotency key
- variant skuSuffix unique within a product

NavigationItem uses linkType + destination, NOT a single href. linkType is
an enum: page, category, collection, product, external. destination holds a
uuid for internal types and a URL for external. Add openInNewTab. The href
is derived at render time, never stored. This is what lets Dev B validate
internal links and warn on unpublished destinations, requirement NAV-02.

Then generate the first migration and run it against the dev database.

Tell Dev B the moment this is pushed. He is blocked until it exists.

Show me the schema and explain any place you deviated from the doc.
```

## Prompt 1.3 - Roles, permissions and the guard

> Moved up from 1.5. Dev B's second prompt needs this.

```
Build the users module and the permission system. This is the most important
thing I will build in Phase 1, because every other module depends on it.

Roles table supports all six roles from docs/01-srs-summary.md. Seed only
three for the MVP: super_admin, marketing_admin, product_manager.

Permissions are strings in the form resource:action, for example
product:update, placement:manage, order:status_change, settings:write.
Derive the full list from the endpoints in docs/03-api-contract.md, keeping
every permission name the contract already uses exactly as written. Seed
them. The list is a proposal until a contract PR is reviewed by all four of
us, so tell me how many you created and which the contract already named.

Build:
- AuthGuard, rejects an unauthenticated request with 401
- PermissionGuard, rejects a user without the required permission with 403
- @RequirePermission('product:update') decorator, accepting only names from
  the seeded list so a typo is a compile error
- Fail closed: a route with the guard but no decorator refuses everyone
- Permissions are checked per request, not baked into the session, so
  removing a permission from a role takes effect on the next request
- A helper for object-level checks, because a user allowed to read orders is
  not allowed to read every order

Admin user endpoints: list, invite, update role, deactivate. All super_admin
only. There is NO public registration route for admins.

Document the guard and the decorator in backend/AGENTS.md under "What Dev B
imports from Dev A", with a copy-paste example. Then write an e2e test that
uses that documented example verbatim, in a module importing nothing else,
so the docs cannot silently drift.

Write tests that call protected routes directly, bypassing any UI, with:
no session, an expired session, a forged cookie, a valid session with the
wrong role. All must be rejected.

Tell Dev B the moment this is pushed.
```

## Prompt 1.4 - Audit log

> Moved up from 1.6. Dev B's second prompt needs this.

```
Build the audit module.

Record actor, action, entityType, entityId, metadata and timestamp for every
sensitive action: publish, unpublish, delete, archive, role change, settings
change, order status change, user invite and deactivate.

Expose a single call Dev B can use in one line from any module:
  audit.record({ actorId, action, entityType, entityId, metadata })

Make the module global so he needs no import wiring. Allow passing a Prisma
transaction so the audit row commits or rolls back with the change it
describes.

Audit rows are append only. No update or delete endpoint exists.

GET /admin/audit, super_admin only, with filters for actor, action, entity
and date range, paginated with the envelope from 1.1.

Document the call in backend/AGENTS.md under "What Dev B imports from Dev
A", with a copy-paste example, and cover it in the same drift test as the
guard.

Tell Dev B the moment this is pushed.
```

## Prompt 1.5 - Media and the two buckets

> Moved up from 1.7. Dev D's media library needs this in week 2.

```
Build the media module.

TWO separate storage buckets, configured independently:
- public: product images and marketing media, CDN served, permanent URLs
- private: customer documents, never public, signed URLs that expire in 15
  minutes

POST /admin/media/upload takes multipart plus a bucket field.

Validation before anything is stored:
- allowed MIME types per bucket, checked by magic bytes, not by extension or
  the client-sent content type
- size limits per type
- reject anything executable
- generate a random storage key, never use the uploaded filename

Also: GET /admin/media with search, type filter and pagination, PATCH for
alt text, DELETE that returns 409 when the asset is still referenced, naming
what references it so Dev D can show a useful message.

Response shape is the MediaAsset object in docs/03-api-contract.md.

Write a test that uploads a .exe renamed to .jpg and confirms it is
rejected.

Tell Dev D the moment this is pushed. He has been waiting on it.
```

## Prompt 1.6 - Auth endpoints

> Moved down from 1.3. Only Dev D needs it, and not until his second prompt.

```
Build the auth module.

Endpoints exactly as docs/03-api-contract.md specifies:
POST /auth/login, POST /auth/mfa, POST /auth/logout, GET /auth/me,
POST /auth/password-reset, POST /auth/password-reset/confirm

Requirements:
- Passwords hashed with argon2id. Never plaintext, never a fast hash.
- Session as an httpOnly, Secure, SameSite=Lax cookie. No token in any
  response body for a frontend to store.
- Login returns { requiresMfa: true, mfaToken } when the user has MFA on.
  The mfaToken is short lived and single use.
- Password reset tokens are single use, expire in 30 minutes, hashed at rest
- Login is rate limited per IP and per email
- Timing-safe comparison, and the same response time and message whether the
  email exists or not

Write tests covering wrong password, unknown email, expired reset token and
a replayed mfaToken.
```

## Prompt 1.7 - MFA

> Moved down from 1.4. Nobody is blocked on it.

```
Add TOTP multi-factor authentication.

- POST /auth/mfa/setup returns a secret and a QR provisioning URI
- POST /auth/mfa/verify confirms the first code and enables MFA
- POST /auth/mfa/disable requires the current password plus a valid code
- Generate 8 single-use recovery codes, show them once, store them hashed
- Super admin accounts cannot disable MFA
- Rate limit code attempts, lock after 5 failures in 15 minutes

The secret is encrypted at rest, never stored in plain text.
```

## Prompt 1.8 - Settings

```
Build the settings module.

Key-value store with jsonb values. Seeds:
- email.senderName, email.senderAddress
- email.recipients.orders, email.recipients.contact, email.recipients.dealer
- whatsapp.number, whatsapp.generalTemplate, whatsapp.productTemplate

Endpoints:
GET /settings/public  - no auth, returns ONLY the whatsapp block
GET /admin/settings   - requires settings:read
PUT /admin/settings   - requires settings:write, writes an audit row

Changing any of these must never require a code deploy. That is the whole
point of this module.

Never expose a secret or an API key through either endpoint.

Tell Dev C and Dev D when this is pushed. C needs the public endpoint for
the WhatsApp number, D needs the admin endpoints for his settings screens.
```

## Prompt 1.9 - CI, secrets and staging

```
Set up the pipeline and the environment.

.github/workflows/ci.yml, running on every PR:
- install, typecheck, lint, test, build, all four apps
- Prisma migration check, fail if the schema and migrations are out of sync
- a secret scan that fails the build on a detected credential

Secrets live in the host's secret storage. Never in the repo, never in a log
line. Add a check that no .env file can be committed.

Deploy the staging environment: managed Postgres, the API, a seeded database
and the two storage buckets. Write infra/README.md covering how to deploy,
how to roll back, and where logs live.

Confirm the health check responds on staging before you call this done.
```

---

## ✅ PHASE 1 CHECKS

### Attack your own work

| # | Check | Pass when |
|---|---|---|
| 1 | `curl` a protected admin route with no session | 401, not a redirect, not a 500 |
| 2 | `curl` the same route as product_manager when it needs settings:write | 403 |
| 3 | `curl` POST /admin/users/:id/role as marketing_admin | 403 |
| 4 | Change a user's role in the database, reuse the same cookie | Next request reflects the new role |
| 5 | A route with the guard but no @RequirePermission | Refuses everyone, fail closed |
| 6 | Log in as a super admin with the right password, no code | Blocked at the MFA step |
| 7 | Replay a used mfaToken | Rejected |
| 8 | Replay a used password reset token | Rejected |
| 9 | Request a reset for an unknown email | Same response and timing as a known one |
| 10 | 20 failed logins in a minute | Rate limited |

### Uploads

| # | Check | Pass when |
|---|---|---|
| 11 | Upload a .exe renamed to .jpg | Rejected on magic bytes |
| 12 | Upload a 200MB file | Rejected on size |
| 13 | Fetch a private-bucket URL after 20 minutes | Expired, denied |
| 14 | Guess a private storage key from a public one | Not possible, keys are random |

### Data

| # | Check | Pass when |
|---|---|---|
| 15 | Insert two products with the same SKU | Unique constraint fires |
| 16 | Insert two placements with the same product, type and location | Unique constraint fires |
| 17 | Check every money column | Int, never Decimal or Float |
| 18 | Check the deferred columns exist | model_url, video_url, active_from, active_to, scheduled_at |
| 19 | Check NavigationItem | linkType + destination + openInNewTab, no href |
| 20 | Publish something, then read the audit table | Row with actor, action, entity, timestamp |

### Handoffs

| # | Check | Pass when |
|---|---|---|
| 21 | Dev B confirms | Guard, audit and pagination all work from his side |
| 22 | Dev D confirms | Login and media upload work from his side |
| 23 | backend/AGENTS.md | "What Dev B imports from Dev A" has a working example for each |
| 24 | The drift test | Uses the documented examples verbatim and passes |

### Send for review

```
Phase 1 done. For review:
- The Prisma schema
- The permission guard and its decorator
- Results of checks 1 to 24, with anything that failed
- The staging URL and its health check response
- Confirmation from Dev B and Dev D that they are unblocked
- How many permission strings I created, and the contract PR link
```

---

# PHASE 2 - Hardening and getting ahead (Weeks 3 to 4)

Dev B owns the catalogue this phase. You harden Phase 1 and get a head start on payments, because payments is the riskiest thing you will build.

## Prompt 2.1 - Image processing

```
Extend the media module to process images on upload.

- Generate thumb, medium and large variants
- Output WebP and AVIF alongside the original
- Strip EXIF, including GPS data
- Store the dimensions so the frontend can set width and height and avoid
  layout shift
- Return the variants map in the MediaAsset response, matching the contract

Processing happens in the background. The upload response returns
immediately with the original, and the variants appear when ready.
```

## Prompt 2.2 - Rate limiting

```
Build a reusable rate limit guard in common/.

Default limits by endpoint class:
- auth: strict, per IP and per account
- public reads: generous
- public writes, meaning forms and cart: moderate, per IP
- admin: generous but present

Backed by Redis if available, in-memory otherwise, with the strategy
configurable.

Return 429 with the standard error envelope and a Retry-After header.

Apply it to every public endpoint. Document the decorator in
backend/AGENTS.md so Dev B applies it to the public content reads.
```

## Prompt 2.3 - Email service

```
Build the email module.

- Provider adapter behind an interface, so swapping providers is a config
  change not a rewrite
- Templates: order confirmation to customer, order notification to Flowtop,
  contact acknowledgement, dealer acknowledgement, password reset, admin
  invite
- Recipients and sender come from the settings module, never from env, never
  hardcoded
- Every send is logged with its result. A failure is recorded, not swallowed.
- sendEmail returns a clear success or failure that the caller can act on,
  because the submissions API has to tell the user the truth

Add POST /admin/settings/test-email so staff can verify routing before
saving.

In development, write emails to a local file instead of sending.
```

## Prompt 2.4 - Payment integration, part one

```
Start the payments module. Sandbox only, no live credentials.

- Gateway adapter behind an interface. Nothing outside this module knows
  which provider we use.
- createPaymentIntent(orderId, amount) returns the handoff object shaped as
  in docs/03-api-contract.md
- Verify webhook signatures. An unsigned or badly signed webhook is rejected
  and logged.
- Store the raw webhook payload for reconciliation

NEVER store card data. Not in the database, not in a log, not in an error
report. Add a test asserting that no card-shaped string reaches the logs.

Stop here. The order flow comes in Phase 3. I want the adapter and signature
verification solid first.
```

## Prompt 2.5 - Review Dev B's endpoints

```
Audit every endpoint Dev B added this phase, without changing his code.

For each one check:
- Does it have AuthGuard and PermissionGuard where it needs them?
- Is the permission string the right one from the seeded list?
- Does it have a DTO with validation?
- Is a public read paginated and rate limited?
- Does a sensitive action write an audit row?
- Can an object be read by someone who should not see it?

Produce a list of findings with file, line, and what is wrong. Do not fix
anything in his folder. I will send him the list.
```

---

## ✅ PHASE 2 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Upload a photo with GPS EXIF | Stripped in every stored variant |
| 2 | Upload returns before processing finishes | Yes, variants fill in after |
| 3 | Hammer a public endpoint | 429 with Retry-After |
| 4 | Send a test email from settings | Arrives at the configured address |
| 5 | Change the recipient in settings, send again | Goes to the new address, no deploy |
| 6 | Kill the email provider, trigger a send | Clear failure, logged, does not throw into the caller |
| 7 | POST an unsigned webhook | Rejected and logged |
| 8 | POST a webhook with a tampered signature | Rejected and logged |
| 9 | grep the logs for card-shaped digit strings | Zero results |
| 10 | Dev B endpoint audit | Findings list sent to Dev B |

### Send for review

```
Phase 2 done. For review:
- The payments adapter interface and signature verification
- The email service interface and the settings wiring
- Results of checks 1 to 10
- The findings list from auditing Dev B's endpoints
```

---

# PHASE 3 - Cart, orders and payments (Weeks 5 to 6)

The most dangerous code in the project. Take your time.

## Prompt 3.1 - Finish the gateway

```
Complete the payment gateway integration from 2.4.

- Full createPaymentIntent flow against the sandbox
- Handoff object exactly as docs/03-api-contract.md specifies
- Error handling for every gateway failure mode: declined, timeout, network
  error, invalid amount
- Reconciliation query: given an order, ask the gateway what it thinks the
  status is

Still no live credentials. Still no order marked paid by anything in this
prompt, that comes in 3.3.
```

## Prompt 3.2 - Cart

```
Build the cart module.

Endpoints: GET /cart, POST /cart/items, PATCH /cart/items/:id,
DELETE /cart/items/:id

THE RULE: the request contains productId, variantId and quantity. Nothing
else. If a price arrives in a request body it is ignored, and a test asserts
that.

Every response recalculates from scratch, reading the current price from the
database. Shipping and tax come from configuration. Return the full Cart
object from docs/03-api-contract.md, totals included.

Validate on every call, not only on add, using Dev B's availability check:
- product published and purchasable
- variant exists and belongs to that product
- product and variant available
- quantity between 1 and a sane maximum

A product that became unavailable while sitting in a cart produces a warning
in the warnings array and is excluded from the total. It does not silently
disappear and it does not block the whole cart.

Cart is keyed by a cookie, no login.

Agree the availability check signature with Dev B before you start, and put
it in backend/AGENTS.md.

Write a test that sends a tampered price in the request and asserts the
server charges the real one.

Tell Dev C the moment this is pushed. All of his Phase 4 is waiting.
```

## Prompt 3.3 - Payment verification and idempotency

```
Finish payments. This is the single most important prompt in my whole
backlog. Read it twice.

RULE ONE: an order becomes paid ONLY when a signature-verified webhook from
the gateway says so. The browser redirect sets nothing. There is no code
path anywhere that marks an order paid from a request originating in a
browser.

RULE TWO: webhook handling is idempotent. Gateways retry. Use the unique
constraint on order.paymentGatewayId so a second delivery of the same event
is a no-op, not a second order and not a second charge. Handle the race
where two retries arrive at the same instant.

Build:
- POST /webhooks/payments, public but signature verified
- Verify the signature before parsing anything else
- Match the webhook to an order, verify the amount matches to the paisa
- Set paymentStatus and paymentVerifiedAt inside a transaction
- Trigger the two emails only after the status is committed
- Log every webhook, processed or ignored, with the reason
- GET /orders/:reference/status for Dev C to poll, returning only
  paymentStatus

Write tests for:
1. A forged success redirect creates no paid order
2. The same webhook delivered twice produces one order and one email
3. A webhook whose amount does not match the order is rejected and alerted
4. Two simultaneous deliveries of the same webhook produce one result
```

## Prompt 3.4 - Caching

```
Add caching for public content reads, which are Dev B's endpoints but my
infrastructure.

- Cache product detail, category listings, collection pages and resolved
  placements
- Invalidate on publish, unpublish, archive and placement change
- Short TTL as a safety net on top of explicit invalidation
- Never cache anything behind auth, and never cache the cart

Expose a simple invalidate helper Dev B can call from his services, and
document it in backend/AGENTS.md.

Prove invalidation works: publish a product, confirm it appears immediately,
not after the TTL.
```

---

## ✅ PHASE 3 CHECKS

### The attacks. Do every one.

| # | Attack | Pass when |
|---|---|---|
| 1 | Send a price in the cart request | Ignored, real price charged |
| 2 | Send quantity -1 | Rejected |
| 3 | Send a variantId belonging to another product | Rejected |
| 4 | Add an unpublished product via the API | Rejected |
| 5 | Craft the gateway success redirect by hand | **No paid order exists** |
| 6 | Deliver the same webhook twice | One order, one email |
| 7 | Deliver 10 copies simultaneously | One order, one email |
| 8 | Webhook with an amount 1 paisa below the order | Rejected and alerted |
| 9 | Webhook with a tampered signature | Rejected |
| 10 | Archive a product mid-checkout, then complete | Clean failure, no broken order |
| 11 | Publish a product, read it immediately | Cache invalidated, no stale read |

### Send for review

```
Phase 3 done. For review:
- The webhook handler, in full
- The idempotency implementation
- Results of attacks 1 to 11, especially 5, 6 and 7
- Proof that no code path marks an order paid from a browser request
```

---

# PHASE 4 - Admin APIs and forms (Weeks 7 to 8)

## Prompt 4.1 - Checkout and order admin API

```
Build checkout and the admin order endpoints.

POST /checkout validates the contact and delivery data, revalidates the
whole cart, creates an order with paymentStatus pending, and returns the
gateway handoff.

The Order and OrderItem shapes are in docs/04-data-model.md. OrderItem
SNAPSHOTS productName, sku, variantName and unitPrice at purchase time, so a
later rename or reprice never changes an old order.

Order reference format: FT-YYYY-NNNNN, generated safely under concurrency.
Status transitions: received, confirmed, shipped, cancelled. Enforce the
legal ones, reject the rest, audit each change.

Indian validation: 6 digit PIN code, 10 digit phone with optional +91.

Admin endpoints for Dev D:
GET /admin/orders with filters for status, paymentStatus, date range and a
search across reference, email and phone. Paginated.
GET /admin/orders/:id with full line items, customer, delivery and payment
state.
PATCH /admin/orders/:id/status with an optional note.
GET /admin/orders/export as CSV, requiring order:export. Log every export.

Status change triggers the customer notification email.

Never expose gateway secrets or raw payment payloads through these
endpoints.

Tell Dev C and Dev D the moment this is pushed.
```

## Prompt 4.2 - Submissions

```
Build the submissions module.

POST /submissions, public, rate limited, for contact and dealer enquiries.
- Validate against a per-type schema
- Honeypot field rejected silently, so bots get a 200 and learn nothing
- Save the record FIRST, then attempt the email

The response tells the truth, exactly as docs/03-api-contract.md specifies:
{ reference, saved: true, emailSent: false, message: "..." }

If the record saved but the email failed, saved is true, emailSent is false,
and the message tells the user to WhatsApp if urgent. If the record did not
save, it is an error response, not a 200. Dev C depends on this being
honest.

Admin: GET /admin/submissions with filters, PATCH to mark handled, CSV
export for authorized roles. Surface the emailSent flag so Dev D can
highlight a customer waiting on a reply nobody saw.
```

## Prompt 4.3 - Email templates

```
Build the real email templates.

- Order confirmation to customer: reference, items with finishes, delivery
  address, totals, what happens next, a WhatsApp link
- Order notification to Flowtop: the same plus a link to the admin order
- Order status update to customer
- Contact and dealer acknowledgements with reference numbers
- Password reset and admin invite

Requirements:
- Responsive HTML with a plain text alternative
- Tested in Gmail, Outlook and Apple Mail
- Flowtop branding, restrained, matching the brand colours
- Money formatted in rupees from paise
- No tracking pixels
- Recipients from settings, never hardcoded

Send one of each to a test inbox and show me screenshots.
```

## Prompt 4.4 - Analytics hardening

```
Harden POST /analytics/events, which Dev B built.

- Rate limit per IP
- Validate the event type against the allowed list
- STRIP anything sensitive from payloads: never store passwords, card data,
  full addresses, or an email outside a hashed form
- Reject an oversized payload

Write a test that posts an event containing a fake card number and asserts
it is not stored.
```

---

## ✅ PHASE 4 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Submit the contact form, email provider down | saved true, emailSent false, honest message |
| 2 | Submit with the honeypot filled | 200, nothing saved |
| 3 | Submit 30 times fast | Rate limited |
| 4 | Change order status | Customer email fires, audit row written |
| 5 | Illegal status transition | Rejected |
| 6 | Export orders as marketing_admin | 403 |
| 7 | Export orders as super_admin | Works, logged |
| 8 | Post an analytics event with a card number | Not stored |
| 9 | Open each email in Gmail, Outlook, Apple Mail | Renders correctly, money in rupees |
| 10 | Read an order detail response | No gateway secret, no raw payload |
| 11 | Rename a product, reopen an old order | Old order shows the snapshot name |

### Send for review

```
Phase 4 done. For review:
- The submissions response in both the success and email-failed cases
- Email screenshots from all three clients
- Results of checks 1 to 11
```

---

# PHASE 5 - Hardening and launch (Weeks 9 to 10)

No new features. You also test Dev B's work while he tests yours.

## Prompt 5.1 - Security review

```
Full security review of the backend. Work through it systematically and give
me a findings report, then fix what you find.

Authorization: every route, every guard, every permission string. Object
level checks where a user could read someone else's record by changing an
id.

Injection: Prisma protects against SQL injection, but check any raw query.
Check for NoSQL and command injection in anything shelling out.

XSS: the API returns JSON, but check anything rendering HTML, especially
emails built from user input.

CSRF: confirm SameSite cookies, and whether any state-changing route could
be triggered cross-origin.

Secrets: scan the full git history, not just the working tree.

Dependencies: audit and update anything with a known high or critical issue.

Headers: HSTS, X-Content-Type-Options, X-Frame-Options, a CSP for the
Swagger page.

Uploads: re-test magic byte checking, size limits, and that stored files
cannot be executed.

Rate limits: confirm every public endpoint has one.

Errors: confirm no stack trace, no SQL and no internal path ever reaches a
client response.
```

## Prompt 5.2 - Backups and restore

```
Set up backups and PROVE they work.

- Automated daily database backups, 30 day retention
- Storage bucket backups
- Point-in-time recovery if the host offers it
- Encrypted at rest, access restricted

Then actually perform a restore:
1. Take a backup
2. Restore it into a fresh database
3. Verify the row counts match
4. Verify the app runs against the restored copy
5. Time how long the whole thing took
6. Write it up in infra/RESTORE.md with the exact commands

A backup nobody has restored is not a backup. This is a release gate, so the
write-up has to show you really did it.
```

## Prompt 5.3 - Production deploy and monitoring

```
Prepare production.

- Production environment with real configuration and secrets in secret
  storage
- Zero downtime deploy, with a documented rollback that you have tested
- Database migration strategy that does not lock tables on deploy
- Monitoring: uptime, error rate, response time, database connections,
  failed payments, failed emails
- Alerts: API down, error rate spike, payment webhook failures, disk
  pressure, failed backup
- Structured logs with correlation ids, retained 30 days, with no PII

Write infra/DEPLOY.md covering deploy, rollback, what to do when a payment
webhook fails, and who to call.
```

## Prompt 5.4 - Load test the money path

```
Load test checkout, because it is where failure costs the most.

- 100 concurrent carts
- 50 concurrent checkouts
- 200 webhooks arriving at once, including duplicates
- Sustained browsing load on the public reads

Measure p50, p95 and p99 response times, error rate and database connection
usage.

The thing I most need to know: under concurrency, does idempotency still
hold? Confirm no duplicate orders and no duplicate charges.

Report the numbers and anything you had to fix.
```

## Prompt 5.5 - Test Dev B's work

```
Attack Dev B's content endpoints. Do not change his code, produce findings.

- Call every admin content endpoint with no session, with the wrong role,
  and with a valid session but an unrelated permission
- Try to read an unpublished product, page or article through a public
  endpoint
- Try to create a section with a config value outside the allowed enums
- Try to delete a placement belonging to a different product by changing ids
- Send oversized payloads, deeply nested JSON, and unicode edge cases to
  every write endpoint
- Check that public lists are paginated and cannot be asked for 10000 rows
- Look for N+1 queries on the product listing and the placement resolution

Give me file, line, what is wrong and how to reproduce.
```

## Prompt 5.6 - Seed and docs

```
Finish the operational work.

1. Production-ready seed script: the three roles, the full permission list,
   the settings keys, and one super admin created from environment variables
   with a forced password change on first login.

2. API documentation generated from the code, matching
   docs/03-api-contract.md. Flag any drift between them.

3. backend/README.md: how to run locally, environment variables, how to add
   a module, how to run tests, how to run a migration.
```

---

## ✅ PHASE 5 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Security review | Zero critical or high findings open |
| 2 | Secret scan across full history | Clean |
| 3 | Dependency audit | No known critical or high issues |
| 4 | **Restore test** | Performed, documented, timed |
| 5 | Rollback | Tested, not just written down |
| 6 | Load test | No duplicate orders under concurrent webhooks |
| 7 | Error responses | No stack trace, SQL or internal path leaks |
| 8 | Dev B audit | Findings delivered |
| 9 | Alerts | Fire correctly when you trigger them deliberately |
| 10 | Seed on a clean database | Produces a working system |

### Send for review

```
Phase 5 done. For review:
- Security findings report, with what was fixed
- infra/RESTORE.md including the timing
- Load test numbers, especially the concurrent webhook result
- Findings sent to Dev B
- Confirmation that every release gate on my side passes
```

---

# Quick reference

| Phase | Prompts | Weeks | The one thing that must work |
|---|---|---|---|
| 0 | 1 | day 1 | You can explain the placement model back to me |
| 1 | 1.1 to 1.9 | 1 to 2 | A wrong-role API call is rejected by the server |
| 2 | 2.1 to 2.5 | 3 to 4 | An unsigned webhook is rejected |
| 3 | 3.1 to 3.4 | 5 to 6 | A forged redirect creates no paid order, and a double webhook creates one |
| 4 | 4.1 to 4.4 | 7 to 8 | A failed email never becomes a reported success |
| 5 | 5.1 to 5.6 | 9 to 10 | A restore actually performed and timed |

## You block other people

| You deliver | Due | Who is waiting |
|---|---|---|
| Pagination envelope | Day 2 | Dev B, every list endpoint |
| Prisma schema | **Day 2** | Dev B, everything |
| Permission guard | **Day 4** | Dev B, every endpoint |
| AuditService | **Day 4** | Dev B, publish state machine |
| Media upload | Week 2 | Dev D, media library |
| Auth endpoints | Week 2 | Dev D, login screen |
| Settings API | Week 2 | Dev C WhatsApp, Dev D settings screens |
| Cart API | Week 7 | Dev C, all of Phase 4 |
| Checkout + payment status | Week 7 | Dev C, checkout |
| Order admin API | Week 7 | Dev D, order screens |

Full picture in `docs/07-dependency-schedule.md`.

## Tell the others immediately if

- Dev B adds an endpoint with no permission guard
- Dev C's cart calls try to send a price
- Dev D's admin screens assume hidden means forbidden
- Anyone proposes a flag column on product instead of a placement row


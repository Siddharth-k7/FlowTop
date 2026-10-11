# backend/

NestJS API over PostgreSQL via Prisma. Two developers work here and never touch the same module.

| Dev A owns | Dev B owns |
|---|---|
| `auth/` `users/` `media/` `settings/` `audit/` `common/` | `products/` `variants/` `specifications/` |
| `cart/` `orders/` `payments/` `email/` `submissions/` | `categories/` `collections/` `placements/` |
| `prisma/` (schema owner) | `pages/` `sections/` `navigation/` `journal/` |
| | `analytics/` `search/` |

Dev A owns `prisma/schema.prisma`. Dev B proposes schema changes through Dev A rather than editing it directly.

## Module shape

Every module looks the same. Follow it.

```
src/<module>/
├── <module>.module.ts
├── <module>.controller.ts      routes, guards, validation
├── <module>.service.ts         business logic
├── <module>.repository.ts      Prisma access
├── dto/                        request and response shapes
└── <module>.spec.ts
```

Controllers do not contain logic. Services do not contain Prisma calls. Keep the layers honest.

## Security rules

These are tested in acceptance. None are optional.

**Every protected route carries the permission guard.** Not some. Every one. A route without a guard is a hole, whether or not the UI links to it.

```ts
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('product:update')
```

**Authorization is checked on the object, not just the action.** A user allowed to read orders is not allowed to read *every* order. Check ownership.

**Validate every input with a DTO.** No raw body access, no trusting a query parameter.

**Rate limit every public endpoint.** Forms, search and the cart above all.

**Uploads:** check type, check size, store outside the web root, never executable. Customer documents go to the private bucket, marketing media to the public one. They are different buckets for a reason.

**Secrets live in environment configuration.** Never in code, never in the repo, never in a log line.

**Log the actor on every sensitive action:** publish, delete, archive, role change, settings change, order status change. Actor, action, target, timestamp.

## Commerce rules

The expensive mistakes all live here.

**Recalculate the price on the server on every cart call.** The browser sends a product ID, a variant ID and a quantity. Nothing else. A price arriving from a client is ignored.

**An order becomes paid only after gateway verification, server to server.** A success redirect is a URL anybody can type. It proves nothing. Wait for the webhook, verify its signature, then mark the order.

**Webhooks are idempotent.** Gateways retry. Put a unique constraint on the gateway payment ID so the second delivery is a no-op, not a second order.

**Never store raw card data.** Not in the database, not in a log, not in an error report. The gateway holds it.

## Content rules

**Placement is its own table.** `product_id`, `location`, `position`, `enabled`, optional `label`, optional date range. Removing a placement deletes that row only. The product and its other placements are untouched. This is the project's headline feature and the most common thing to get wrong.

**Specifications are rows, not columns.** `product_id`, `name`, `value`, `type`, `order`. Staff must be able to add a field like "Spout Reach" from the admin panel with no code change.

**Section config is validated against the preset enums.** The admin UI offers dropdowns, but the API is what enforces it. Reject any value outside the approved set, even if the UI would never send it.

**Publish state is a shared state machine:** draft, published, unpublished, archived. Use the shared helper, do not reimplement it per module.

**Hard delete is blocked when a record is referenced** by an order or a warranty record. Archive instead.

## Public read endpoints

- Return only published content
- Never return a purchasable flag for an archived or unavailable product
- Paginate anything that can grow
- Add the index before the query ships, not after someone notices

## Checklist before opening a PR

- [ ] Every new route has a guard and a permission
- [ ] Every input has a DTO with validation
- [ ] No Prisma calls outside a repository
- [ ] Sensitive actions write an audit row
- [ ] Public endpoints are rate limited and paginated
- [ ] `docs/03-api-contract.md` updated if a shape changed
- [ ] Tests cover the unauthorized case, not only the happy path

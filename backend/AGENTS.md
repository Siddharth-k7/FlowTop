# backend/

NestJS API over PostgreSQL via Prisma. Two developers work here and never touch the same module.

| Dev A owns | Dev B owns |
|---|---|
| `auth/` `users/` `media/` `settings/` `audit/` `common/` | `products/` `variants/` `specifications/` |
| `cart/` `orders/` `payments/` `email/` `submissions/` | `categories/` `collections/` `placements/` |
| `prisma/` (schema owner) | `pages/` `sections/` `navigation/` `journal/` |
| | `analytics/` `search/` `_base/` |

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

## What Dev B imports from Dev A

Five things, all ready. Paths are from inside `src/<module>/`. Nothing needs adding to your module's `imports`: `AuthModule` and `AuditModule` are global.

### 1. Route protection: `../auth`

```ts
import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, PermissionGuard, RequirePermission, CurrentUser } from '../auth';
import type { AuthUser } from '../auth';

@Controller('admin/products')
export class ProductsAdminController {
  @Patch(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:update')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthUser) {
    return this.products.update(id, dto, user.id);
  }
}
```

- `AuthGuard` first, always: no session is 401, then `PermissionGuard` returns 403 when the role lacks the permission.
- Both decorators also work on the controller class, to cover every route in it.
- Several permissions, `@RequirePermission('product:update', 'product:publish')`, means the user needs all of them.
- `PermissionGuard` without `@RequirePermission` refuses everyone. It fails closed, so a forgotten decorator shows up in your first test, not in production.
- `@CurrentUser()` gives the signed-in user: `{ id, name, email, role, permissions, mfaEnabled }`.

### 2. The permission list: `../auth`

```ts
import type { Permission } from '../auth';
```

Every permission string lives in `src/auth/permissions.ts`, with the three roles' grants. `@RequirePermission` only accepts names from that list, so a typo or an invented name is a compile error. Yours: `product:read|create|update|publish|archive`, `category:read|write`, `collection:read|write`, `placement:manage`, `page:read|write|publish`, `section:write`, `navigation:read|write`, `journal:read|write|publish`, `analytics:read`. Need a new one? Ask Dev A: it is a contract change. `npm run db:seed` writes the list and the role grants to the database.

### 3. Audit log: `../audit`

```ts
import { AuditService } from '../audit';

constructor(private readonly audit: AuditService) {}

await this.audit.record({ actorId: user.id, action: 'publish', entityType: 'product', entityId: product.id });
```

- Call it for every publish, unpublish, archive, delete and reorder. `action` takes the verbs in `AUDIT_ACTIONS`; `metadata` is optional JSON describing the change, never a secret.
- When the change runs in a transaction, pass `tx` so the audit row commits or rolls back with it. The service owns the transaction; the repository method takes the `tx` client, so Prisma still stays in the repository:

  ```ts
  // products.service.ts
  await this.prisma.$transaction(async (tx) => {
    await this.repository.publish(id, tx);
    await this.audit.record({ actorId, action: 'publish', entityType: 'product', entityId: id }, tx);
  });

  // products.repository.ts
  async publish(id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.product.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
  }
  ```

- It throws if the row cannot be written. Let it: an unaudited publish should fail, not succeed quietly.

### 4. Pagination: `../common/dto/pagination`

```ts
import { PaginationQueryDto, paginate, pageToSkipTake } from '../common/dto/pagination';
import type { Paginated } from '../common/dto/pagination';

export class ProductListQuery extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
}

@Get()
async list(@Query() query: ProductListQuery): Promise<Paginated<ProductCard>> {
  return this.products.list(query);
}

// in the service
const [rows, total] = await this.repository.list(pageToSkipTake(query), query.search);
return paginate(rows.map(toProductCard), total, query);
```

- Returns `{ data, meta: { page, perPage, total, totalPages } }`, the contract envelope.
- Defaults to `page=1`, `perPage=25`. More than 100 per page is a 422, so no list can be asked for 10,000 rows.
- Import `Paginated` and `AuthUser` with `import type` when they appear in a decorated method's signature. With `isolatedModules` on, a plain import of a type there fails the typecheck.

### 5. Record-level access: `../auth`

The route permission says a user may read orders. This says *which* orders. Use it whenever a record is fetched by an id that came from the request.

```ts
import { requireRecordAccess } from '../auth';
import type { AuthUser } from '../auth';

async get(viewer: AuthUser, id: string) {
  const order = requireRecordAccess(viewer, await this.repository.findById(id), {
    allWith: ['order:read'],                        // these permissions see every record
    ownedBy: (user, record) => record.assignedTo === user.id, // everyone else: only their own or in scope
  });
  return toOrderResponse(order);
}
```

- Returns the record when allowed. Otherwise throws **404**, the same response as a record that does not exist, so changing an id in the URL never reveals that someone else's record is there. Do not turn it into a 403.
- Fails closed: a rule with neither `allWith` nor `ownedBy` allows nobody.
- `canAccessRecord(viewer, record, rule)` gives the same decision as a boolean, for hiding fields.
- **Lists must filter in the query**, not afterwards: put the same scope in the repository's `where`, so out-of-scope rows are never read and the `total` stays honest.
- A route whose access depends on the record (for example "your own account") uses `@UseGuards(AuthGuard)` plus this check, with no `@RequirePermission`. That is the only exception to "every route carries PermissionGuard", and it must always have this check. See `GET /admin/users/:id` in `src/users/` for the reference implementation.

## Security rules

These are tested in acceptance. None are optional.

**Every protected route carries the permission guard.** Not some. Every one. A route without a guard is a hole, whether or not the UI links to it.

```ts
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('product:update')
```

**Authorization is checked on the object, not just the action.** A user allowed to read orders is not allowed to read *every* order. Check ownership with `requireRecordAccess` (see "Record-level access" above), never with a hand-rolled `if`.

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

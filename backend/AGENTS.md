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

Every example below is a real file in `src/_examples/`: it typechecks, the e2e suite `test/dev-b-imports.e2e-spec.ts` runs it against a real database, and a unit test fails if the code here differs from the file by one character. Copy them as they are. Anything marked `DEV B:` is a placeholder for something you own.

### 1. Route protection: `../auth`

<!-- example: src/_examples/route-protection.example.ts -->
```ts
import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';

// DEV B: placeholder. Your real DTO lists every field the admin may change.
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

@Controller('admin/products')
export class ProductsAdminController {
  @Patch(':id')
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): { data: { id: string; changes: UpdateProductDto; updatedBy: string } } {
    // DEV B: call your service here. The route above is already fully protected.
    return { data: { id, changes: dto, updatedBy: user.id } };
  }
}
```

- `AuthGuard` first, always: no session is 401, then `PermissionGuard` returns 403 `FORBIDDEN` when the role lacks the permission.
- A super admin who has not set up MFA gets 403 `MFA_SETUP_REQUIRED` from `AuthGuard` on every route (IAM-04). Test your routes as `product_manager`, or as a super admin with MFA on.
- Both decorators also work on the controller class, to cover every route in it.
- Several permissions, `@RequirePermission('product:update', 'product:publish')`, means the user needs all of them.
- `PermissionGuard` without `@RequirePermission` refuses everyone. It fails closed, so a forgotten decorator shows up in your first test, not in production.
- `@CurrentUser()` gives the signed-in user: `{ id, name, email, role, permissions, mfaEnabled, mfaSetupRequired }`.

### 2. The permission list: `../auth`

<!-- example: src/_examples/permission-list.example.ts -->
```ts
import { ALL_PERMISSIONS } from '../auth';
import type { Permission } from '../auth';

// Only names from the agreed list compile. 'product:edit' here would be a type error.
export const PRODUCT_EDITORS: readonly Permission[] = ['product:update', 'product:publish'];

// The same list at runtime, for example to check a value that arrives as a string.
export function isKnownPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}
```

Every permission string lives in `src/auth/permissions.ts`, with the three roles' grants. `@RequirePermission` only accepts names from that list, so a typo or an invented name is a compile error. Yours: `product:read|create|update|publish|archive`, `category:read|write`, `collection:read|write`, `placement:manage`, `page:read|write|publish`, `section:write`, `navigation:read|write`, `journal:read|write|publish`, `analytics:read`. Need a new one? Ask Dev A: it is a contract change. `npm run db:seed` writes the list and the role grants to the database.

### 3. Audit log: `../audit`

<!-- example: src/_examples/audit.example.ts -->
```ts
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

// products.repository.ts: the only place Prisma is called. Takes the tx client.
@Injectable()
export class ProductsPublishRepository {
  constructor(private readonly prisma: PrismaService) {}

  async publish(id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.product.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
  }
}

// products.service.ts: owns the transaction, so the audit row commits or rolls back with the change.
@Injectable()
export class ProductsPublishService {
  constructor(
    private readonly repository: ProductsPublishRepository,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async publish(actorId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.repository.publish(id, tx);
      await this.audit.record({ actorId, action: 'publish', entityType: 'product', entityId: id }, tx);
    });
  }
}
```

- Call it for every publish, unpublish, archive, delete and reorder. `action` takes the verbs in `AUDIT_ACTIONS`; `metadata` is optional JSON describing the change, never a secret.
- Pass `tx` whenever the change runs in a transaction, as above: the audit row then commits or rolls back with it. The service owns the transaction; the repository takes the `tx` client, so Prisma stays in the repository.
- Outside a transaction it is one line: `await this.audit.record({ actorId, action: 'archive', entityType: 'product', entityId: id });`
- It throws if the row cannot be written. Let it: an unaudited publish should fail, not succeed quietly.

### 4. Pagination: `../common/dto/pagination`

<!-- example: src/_examples/pagination.example.ts -->
```ts
import { Controller, Get, Injectable, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard, PermissionGuard, RequirePermission } from '../auth';
import { pageToSkipTake, paginate, PaginationQueryDto } from '../common/dto/pagination';
import type { Paginated } from '../common/dto/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { Product } from '../generated/prisma/client';

export class ProductListQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

// DEV B: placeholder for the contract's ProductCard and your mapping to it.
export interface ProductCard {
  id: string;
  name: string;
  sku: string;
}
const toProductCard = (product: Product): ProductCard => ({ id: product.id, name: product.name, sku: product.sku });

@Injectable()
export class ProductsListRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(page: { skip: number; take: number }, search?: string): Promise<[Product[], number]> {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, ...page }),
      this.prisma.product.count({ where }),
    ]);
  }
}

@Injectable()
export class ProductsListService {
  constructor(private readonly repository: ProductsListRepository) {}

  async list(query: ProductListQuery): Promise<Paginated<ProductCard>> {
    const [rows, total] = await this.repository.list(pageToSkipTake(query), query.search);
    return paginate(rows.map(toProductCard), total, query);
  }
}

@Controller('admin/products')
export class ProductsListController {
  constructor(private readonly products: ProductsListService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:read')
  list(@Query() query: ProductListQuery): Promise<Paginated<ProductCard>> {
    return this.products.list(query);
  }
}
```

- Returns `{ data, meta: { page, perPage, total, totalPages } }`, the contract envelope.
- Defaults to `page=1`, `perPage=25`. More than 100 per page is a 422, so no list can be asked for 10,000 rows.
- Import `Paginated` and `AuthUser` with `import type` when they appear in a decorated method's signature, as above. With `isolatedModules` on, a plain import of a type there fails the typecheck.

### 5. Record-level access: `../auth`

The route permission says a user may do something to this kind of record. This says *which* records. Use it whenever a record is fetched by an id that came from the request.

<!-- example: src/_examples/record-access.example.ts -->
```ts
import { Injectable } from '@nestjs/common';
import { requireRecordAccess } from '../auth';
import type { AuthUser } from '../auth';
import { PrismaService } from '../common/prisma/prisma.service';
import { MediaAsset } from '../generated/prisma/client';

@Injectable()
export class MediaUploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }
}

// A product manager may remove media they uploaded themselves; media:delete may remove anyone's.
@Injectable()
export class MediaUploadsService {
  constructor(private readonly repository: MediaUploadsRepository) {}

  async findRemovable(viewer: AuthUser, id: string): Promise<MediaAsset> {
    return requireRecordAccess(viewer, await this.repository.findById(id), {
      allWith: ['media:delete'], // these permissions reach every record
      ownedBy: (user, asset) => asset.uploadedBy === user.id, // everyone else: only their own
    });
  }
}
```

- Returns the record when allowed. Otherwise throws **404**, the same response as a record that does not exist, so changing an id in the URL never reveals that someone else's record is there. Do not turn it into a 403.
- Fails closed: a rule with neither `allWith` nor `ownedBy` allows nobody.
- `canAccessRecord(viewer, record, rule)` gives the same decision as a boolean, for hiding fields.
- **Lists must filter in the query**, not afterwards: put the same scope in the repository's `where`, so out-of-scope rows are never read and the `total` stays honest.
- Permission at the route, scope at the object: the route still carries `@RequirePermission`. `GET /admin/users/:id` in `src/users/` is the reference implementation: the route requires `user:read_self` (every role has it), then `requireRecordAccess` allows the viewer's own account, or any account with `user:read`.

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

**Webhooks are idempotent.** Gateways retry. The unique constraint on `order.payment_gateway_id` makes the second delivery a no-op, not a second order.

**Never store raw card data.** Not in the database, not in a log, not in an error report. The gateway holds it.

## Content rules

**Placement is its own table.** `product_id`, `location_type`, `location_id`, `position`, `enabled`, optional `label`, and `active_from` / `active_to` (deferred scheduling: the columns exist, build nothing on them yet). `location_type` is one of `homepage_section`, `category`, `collection`, `campaign_page`, `related`; `location_id` is the section key (`featured`, `new_arrivals`, ...) or the category, collection or page uuid. Unique on (`product_id`, `location_type`, `location_id`), indexed on (`location_type`, `location_id`, `position`). Removing a placement deletes that row only. The product and its other placements are untouched. This is the project's headline feature and the most common thing to get wrong.

**Specifications are rows, not columns.** `product_id`, optional `group`, `name`, `value`, optional `unit`, `type` (`text`, `number`, `boolean`, `choice`), `position`. Staff must be able to add a field like "Spout Reach" from the admin panel with no code change. A row with an empty value is never created.

**Section config is validated against the preset enums.** The admin UI offers dropdowns, but the API is what enforces it. Reject any value outside the approved set, even if the UI would never send it.

**Publish state is a shared state machine:** the `status` column, `draft`, `published`, `unpublished`, `archived`, with `published_at` set on publish. Use the shared helper in `_base/publish-state.service.ts`; do not reimplement it per module.

**Hard delete is blocked when a record is referenced.** The database refuses to delete a product or variant that an order line refers to, and a media asset still used by a product, category, collection, page or article. Archive instead (`status = archived`). Warranty records will block deletes too once that feature is built.

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

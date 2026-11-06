import type { AdminProduct, NavNode, Permission, Placement, PlacementLocation, Specification, Variant } from '@flowtop/types';
import type { Doc } from '@/lib/doc';
import { fail, ok, type Res } from './res';
import { seed, seedNav, seedPages, seedPlacements, seedProducts, seedSettings, seedSpecs, seedVariants } from './seed';

// TODO: swap for real API. This file goes away on swap day, like router.ts.
const store: Record<string, Doc[]> = { ...structuredClone(seed), products: seedProducts.map((p) => structuredClone({ ...p })), pages: seedPages.map((p) => structuredClone({ ...p })) };
let placements: Placement[] = structuredClone(seedPlacements);
let nav: NavNode[] = structuredClone(seedNav);
const variants: Record<string, Variant[]> = structuredClone(seedVariants);
const specs: Record<string, Specification[]> = structuredClone(seedSpecs);
const settings: Record<string, string> = { ...seedSettings };

/** The server is the real guard; the mock mimics it so a 403 is visible during development. Permissions are typed, so a typo does not compile. */
const READ: Record<string, Permission> = { products: 'product:read', variants: 'product:read', categories: 'category:read', collections: 'collection:read', pages: 'page:read', journal: 'journal:read', orders: 'order:read', submissions: 'submission:read', navigation: 'navigation:read', settings: 'settings:read' };
const WRITE: Record<string, Permission> = { products: 'product:update', variants: 'product:update', categories: 'category:write', collections: 'collection:write', pages: 'page:write', sections: 'section:write', journal: 'journal:write', orders: 'order:status_change', submissions: 'submission:update', navigation: 'navigation:write', settings: 'settings:write', placements: 'placement:manage' };
const ACTION: Record<string, Permission> = { publish: 'product:publish', unpublish: 'product:publish', archive: 'product:archive' };
function needed(col: string, id: string | undefined, action: string | undefined, method: string): Permission | undefined {
  if (col === 'orders' && id === 'export') return 'order:export';
  if (method === 'GET') return READ[col] ?? 'page:read';
  if (col === 'pages' && action === 'publish') return 'page:publish';
  if (col === 'products' && id === 'bulk') return 'product:update';
  if (col === 'products' && action === 'placements') return 'placement:manage';
  if (col === 'products' && ACTION[action ?? '']) return ACTION[action ?? ''];
  if (col === 'products' && method === 'POST' && !id) return 'product:create';
  return WRITE[col] ?? 'page:write';
}
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const now = () => new Date().toISOString();
const find = (col: string, id: string) => store[col]?.find((d) => d.id === id);
const FORBID = fail(403, 'FORBIDDEN', 'You do not have permission to do that.');
const INVALID = 'Please fix the highlighted fields.';

function validateProduct(p: Doc, publish: boolean): Record<string, string> {
  const f: Record<string, string> = {};
  if (!p.name) f.name = 'Give the product a name.';
  if (!p.sku) f.sku = 'Add a SKU.';
  if (p.sku && store.products?.some((o) => o.id !== p.id && o.sku === p.sku)) f.sku = 'This SKU is already in use';
  if (p.slug && store.products?.some((o) => o.id !== p.id && o.slug === p.slug)) f.slug = 'This web address is already in use';
  if (publish) {
    if (!(Number(p.price) > 0)) f.price = 'Set a price before publishing.';
    if (!p.categoryId) f.categoryId = 'Choose a category before publishing.';
  }
  return f;
}

function locations(): PlacementLocation[] {
  const home = [['featured', 'Featured Products'], ['new_arrivals', 'New Arrivals'], ['bestsellers', 'Bestsellers'], ['recommended', 'Recommended']]
    .map(([id, n]): PlacementLocation => ({ locationType: 'homepage_section', locationId: id as string, locationName: `Homepage: ${n}` }));
  const m = (locationType: PlacementLocation['locationType'], col: string, label: string): PlacementLocation[] => (store[col] ?? []).map((d) => ({ locationType, locationId: d.id, locationName: `${label}: ${String(d.name)}` }));
  return [...home, ...m('category', 'categories', 'Category'), ...m('collection', 'collections', 'Collection')];
}

const STATUS_FOR = { publish: 'published', unpublish: 'unpublished', archive: 'archived' } as const;

export function adminRoutes(route: string, method: string, raw: unknown, params: URLSearchParams, perms: readonly string[]): Res | null {
  const b = (raw ?? {}) as Record<string, unknown>;
  const parts = route.split('/').filter(Boolean); // ['admin', col, id, action]
  if (parts[0] !== 'admin') return null;
  const [, col = '', id, action] = parts;
  if (col === 'dashboard') return null; // handled by the main mock router
  const need = needed(col, id, action, method);
  if (need && !perms.includes(need)) return FORBID;

  if (col === 'placement-locations') return ok(locations());
  if (col === 'placements') {
    if (id === 'reorder') {
      (b.ids as string[]).forEach((pid, i) => { const p = placements.find((x) => x.id === pid); if (p) p.position = i + 1; });
      return ok({ reordered: true });
    }
    const p = placements.find((x) => x.id === id);
    if (!p) return fail(404, 'NOT_FOUND', 'That placement no longer exists.');
    if (method === 'DELETE') { placements = placements.filter((x) => x.id !== id); return { status: 204, json: null }; } // one row only
    Object.assign(p, b); return ok(p);
  }
  if (col === 'navigation') { if (method === 'PUT') nav = b.tree as NavNode[]; return ok(nav); }
  if (col === 'settings') {
    if (id === 'test-email') return settings.emailFrom ? ok({ sent: true, to: settings.emailFrom }) : fail(422, 'VALIDATION_FAILED', 'Set a sender address first.', { emailFrom: 'Required' });
    if (method === 'PUT') { settings[String(b.key)] = String(b.value); return ok({ key: b.key, value: b.value }); }
    return ok(settings);
  }

  if (col === 'variants' && id) {
    const [pid, list] = Object.entries(variants).find(([, l]) => l.some((v) => v.id === id)) ?? [];
    const v = list?.find((x) => x.id === id);
    if (!pid || !list || !v) return fail(404, 'NOT_FOUND', 'That finish no longer exists.');
    if (method === 'DELETE') { variants[pid] = list.filter((x) => x.id !== id); return { status: 204, json: null }; }
    Object.assign(v, b); return ok(v);
  }
  if (col === 'products' && id && action === 'variants') {
    const list = (variants[id] ??= []);
    if (parts[4] === 'reorder') { variants[id] = (b.ids as string[]).map((i) => list.find((v) => v.id === i)).filter((v): v is Variant => !!v); return ok({ reordered: true }); }
    if (method === 'POST') { const v: Variant = { id: uid('v'), name: '', skuSuffix: '', price: 0, swatchHex: null, image: null, isAvailable: true, isDefault: false, ...b }; list.push(v); return ok(v); }
    return ok(list);
  }
  if (col === 'products' && id && action === 'specifications') {
    if (method === 'PUT') {
      const items = (b.items as Omit<Specification, 'id'>[]) ?? [];
      const bad = items.findIndex((s) => !s.value);
      if (bad >= 0) return fail(422, 'VALIDATION_FAILED', INVALID, { [`items.${bad}.value`]: 'A specification needs a value.' });
      specs[id] = items.map((s, i) => ({ ...s, id: uid('s'), position: i + 1 }));
    }
    return ok(specs[id] ?? []);
  }
  if (col === 'products' && id && action === 'placements') {
    if (method === 'POST') {
      if (placements.some((p) => p.productId === id && p.locationType === b.locationType && p.locationId === b.locationId)) return fail(409, 'CONFLICT', 'This product is already placed there.');
      const loc = locations().find((l) => l.locationType === b.locationType && l.locationId === b.locationId);
      if (!loc) return fail(422, 'VALIDATION_FAILED', INVALID, { locationId: 'That place does not exist.' });
      const n = placements.filter((p) => p.locationType === loc.locationType && p.locationId === loc.locationId).length;
      const p: Placement = { id: uid('pl'), productId: id, ...loc, position: n + 1, label: '', enabled: true };
      placements.push(p); return ok(p);
    }
    return ok(placements.filter((p) => p.productId === id));
  }
  if (col === 'products' && id === 'bulk') {
    const to = STATUS_FOR[b.action as keyof typeof STATUS_FOR];
    (b.ids as string[]).forEach((pid) => { const p = find('products', pid); if (p && to && !Object.keys(validateProduct(p, b.action === 'publish')).length) p.status = to; });
    return ok((b.ids as string[]).map((pid) => find('products', pid)));
  }
  if (col === 'products' && id && action && action in STATUS_FOR) {
    const p = find('products', id); if (!p) return fail(404, 'NOT_FOUND', 'Product not found.');
    const f = validateProduct(p, action === 'publish');
    if (Object.keys(f).length) return fail(422, 'VALIDATION_FAILED', 'This product cannot be published yet.', f);
    p.status = STATUS_FOR[action as keyof typeof STATUS_FOR]; return ok(p);
  }
  if (col === 'pages' && id && action === 'publish') {
    const p = find('pages', id); if (!p) return fail(404, 'NOT_FOUND', 'Page not found.');
    p.status = 'published'; return ok(p);
  }
  if (col === 'categories' && id === 'reorder') { store.categories = (b.ids as string[]).map((i) => find('categories', i)).filter((d): d is Doc => !!d); return ok({ reordered: true }); }
  if (col === 'orders' && id && action === 'status') {
    const o = find('orders', id); if (!o) return fail(404, 'NOT_FOUND', 'Order not found.');
    if (!b.note) return fail(422, 'VALIDATION_FAILED', 'Add a note.', { note: 'Say why the status is changing.' });
    o.status = b.status; (o.timeline as unknown[]).push({ at: now(), status: b.status, note: b.note, by: 'You' }); return ok(o);
  }

  const list = store[col];
  if (!list) return null;
  if (!id) {
    if (method === 'POST') {
      if (col === 'products') { const f = validateProduct(b as Doc, false); if (Object.keys(f).length) return fail(422, 'VALIDATION_FAILED', INVALID, f); }
      const base: Partial<AdminProduct> = col === 'products' ? { ...seedProducts[0], status: 'draft', publishedAt: null, category: null, _count: { specifications: 0, media: 0, variants: 0, placements: 0 } } : {};
      const d: Doc = { ...base, ...b, id: uid(col.slice(0, 2)), createdAt: now(), updatedAt: now() }; list.push(d); return ok(d);
    }
    const q = (params.get('search') ?? '').toLowerCase();
    const miss = params.get('missing');
    const lacks = (d: Doc) => !miss || ((d._count as AdminProduct['_count'])?.[miss === 'images' ? 'media' : 'specifications'] ?? 0) === 0;
    return ok(list.filter((d) => (!q || JSON.stringify(d).toLowerCase().includes(q)) && (col !== 'products' || lacks(d))));
  }
  const d = find(col, id);
  if (!d) return fail(404, 'NOT_FOUND', 'That item no longer exists.');
  if (method === 'PATCH') {
    const next = { ...d, ...b, updatedAt: now() } as Doc;
    if (col === 'products') { const f = validateProduct(next, false); if (Object.keys(f).length) return fail(422, 'VALIDATION_FAILED', INVALID, f); }
    if (col === 'pages' && list.some((o) => o.id !== id && o.slug === next.slug)) return fail(422, 'VALIDATION_FAILED', INVALID, { slug: 'This web address is already in use' });
    Object.assign(d, next); return ok(d);
  }
  if (method === 'DELETE') {
    if (col === 'categories' && (store.products ?? []).some((p) => p.categoryId === id)) return fail(409, 'CONFLICT', 'This category still has products. Move them to another category first.');
    list.splice(list.indexOf(d), 1); return { status: 204, json: null };
  }
  return ok(d);
}

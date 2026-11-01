import type { Doc, NavNode, Page, Placement, PlacementLocation, Product } from '@/types/cms';
import { fail, ok, type Res } from './res';
import { seed, seedNav, seedPlacements, seedSettings } from './seed';

// TODO: swap for real API. This file goes away on swap day, like router.ts.
const store: Record<string, Doc[]> = structuredClone(seed);
let placements: Placement[] = structuredClone(seedPlacements);
let nav: NavNode[] = structuredClone(seedNav);
const settings: Record<string, string> = { ...seedSettings };

/** The server is the real guard; the mock mimics it so a 403 is visible during development. */
const NEEDS: Record<string, string> = { orders: 'order:read', submissions: 'submission:read', settings: 'settings:write', navigation: 'navigation:write' };
const WRITE: Record<string, string> = { products: 'product:write', categories: 'product:write', collections: 'product:write', pages: 'page:write', journal: 'journal:write' };
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
    if (!(p.galleryIds as string[])?.length) f.galleryIds = 'Add at least one image before publishing.';
  }
  return f;
}

function locations(): PlacementLocation[] {
  const home = [['featured', 'Featured Products'], ['new_arrivals', 'New Arrivals'], ['bestsellers', 'Bestsellers'], ['recommended', 'Recommended']]
    .map(([id, n]) => ({ locationType: 'homepage_section', locationId: id as string, locationName: `Homepage: ${n}` }));
  const m = (t: string, col: string, label: string, key: string) => (store[col] ?? []).map((d) => ({ locationType: t, locationId: d.id, locationName: `${label}: ${String(d[key])}` }));
  return [...home, ...m('category', 'categories', 'Category', 'name'), ...m('collection', 'collections', 'Collection', 'name'),
    ...(store.pages ?? []).filter((p) => p.isCampaign).map((p) => ({ locationType: 'campaign_page', locationId: p.id, locationName: `Campaign: ${String(p.title)}` }))];
}

export function adminRoutes(route: string, method: string, raw: unknown, params: URLSearchParams, perms: string[]): Res | null {
  const b = (raw ?? {}) as Record<string, unknown>;
  const parts = route.split('/').filter(Boolean); // ['admin', col, id, action]
  if (parts[0] !== 'admin') return null;
  const [, col = '', id, action] = parts;
  const need = NEEDS[col] ?? (method === 'GET' ? undefined : WRITE[col]);
  if (need && !perms.includes(need)) return FORBID;

  if (col === 'dashboard') {
    const ps = store.products as Product[];
    return ok({
      draftPages: (store.pages ?? []).filter((p) => p.status === 'draft').length,
      productsMissingImages: ps.filter((p) => !p.galleryIds.length).length,
      productsMissingSpecs: ps.filter((p) => !p.specs.length).length,
      recentOrders: (store.orders ?? []).slice(0, 3).map((o) => ({ id: o.id, reference: o.reference, total: o.total, status: o.status })),
      recentSubmissions: (store.submissions ?? []).slice(0, 3).map((s) => ({ id: s.id, name: s.name, type: String(s.type).replace(/_/g, ' '), read: s.status !== 'new' })),
    });
  }
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

  if (col === 'products' && id && action === 'placements') {
    if (method === 'POST') {
      if (placements.some((p) => p.productId === id && p.locationType === b.locationType && p.locationId === b.locationId)) return fail(409, 'CONFLICT', 'This product is already placed there.');
      const loc = locations().find((l) => l.locationType === b.locationType && l.locationId === b.locationId);
      const n = placements.filter((p) => p.locationType === b.locationType && p.locationId === b.locationId).length;
      const p: Placement = { id: uid('pl'), productId: id, locationType: String(b.locationType), locationId: String(b.locationId), locationName: loc?.locationName ?? '', position: n + 1, label: '', enabled: true };
      placements.push(p); return ok(p);
    }
    return ok(placements.filter((p) => p.productId === id));
  }
  if (col === 'products' && id === 'bulk') {
    (b.ids as string[]).forEach((pid) => { const p = find('products', pid); if (p && !Object.keys(validateProduct(p, b.action === 'publish')).length) p.status = b.action === 'publish' ? 'published' : 'draft'; });
    return ok({ done: true });
  }
  if (col === 'products' && id && ['publish', 'unpublish', 'archive'].includes(action ?? '')) {
    const p = find('products', id); if (!p) return fail(404, 'NOT_FOUND', 'Product not found.');
    const f = validateProduct(p, action === 'publish');
    if (Object.keys(f).length) return fail(422, 'VALIDATION_FAILED', 'This product cannot be published yet.', f);
    p.status = action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft'; return ok(p);
  }
  if (col === 'pages' && id && action === 'publish') {
    const p = find('pages', id) as Page | undefined; if (!p) return fail(404, 'NOT_FOUND', 'Page not found.');
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
      const d: Doc = { ...b, id: uid(col.slice(0, 2)), updatedAt: now() }; list.push(d); return ok(d);
    }
    const q = (params.get('search') ?? '').toLowerCase();
    const miss = params.get('missing');
    const need = (d: Doc) => !miss || (miss === 'images' ? !(d.galleryIds as string[]).length : !(d.specs as unknown[]).length);
    return ok(list.filter((d) => (!q || JSON.stringify(d).toLowerCase().includes(q)) && (col !== 'products' || need(d))));
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
    if (col === 'products') placements = placements.filter((p) => p.productId !== id);
    list.splice(list.indexOf(d), 1); return { status: 204, json: null };
  }
  return ok(d);
}

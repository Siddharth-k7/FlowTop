import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adminRoutes } from '@/lib/mocks/admin';
import { permissionsFor } from '@/lib/mocks/roles';

/**
 * S3: a mock must not disagree with the real API. For every route the real controllers protect, the mock
 * must refuse a caller who lacks that route's permission and let one who has it through. The routes and
 * permissions are read from the backend controllers, not typed here.
 */
const root = join(__dirname, '..', '..', '..', 'backend', 'src');
const CONTROLLERS: [file: string, prefix: string][] = [
  ['products/products.controller.ts', '/admin/products'],
  ['settings/settings.controller.ts', '/admin/settings'],
];
const DECORATORS = /@(Get|Post|Patch|Put|Delete)\((?:'([^']*)')?\)\s*\n\s*@RequirePermission\('([^']+)'\)/g;
const ALL = permissionsFor('super_admin');
const body = { ids: [], action: 'publish', key: 'email.senderName', value: 'Flowtop' };

const routes = CONTROLLERS.flatMap(([file, prefix]) => {
  const source = readFileSync(join(root, file), 'utf8');
  // AdminSettingsController is the second controller in settings.controller.ts: the public one has no RequirePermission.
  return [...source.matchAll(DECORATORS)].map(([, verb, path = '', permission]) => ({
    method: (verb as string).toUpperCase(), route: `${prefix}${path ? `/${path.replace(':id', 'p1')}` : ''}`, permission: permission as string,
  }));
});

describe('mock routes enforce the permissions the real controllers declare', () => {
  it('finds the real routes at all, so the checks below are not vacuous', () => expect(routes.length).toBeGreaterThanOrEqual(9));
  it.each(routes.map((r) => [`${r.method} ${r.route}`, r.permission, r] as const))('%s needs %s', (_name, _permission, r) => {
    const { method, route, permission } = r;
    const without = ALL.filter((p) => p !== permission);
    expect(adminRoutes(route, method, body, new URLSearchParams(), without)?.status, 'without it').toBe(403);
    expect(adminRoutes(route, method, body, new URLSearchParams(), [permission])?.status, 'with it').not.toBe(403);
  });
});

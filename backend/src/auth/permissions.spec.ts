import { ALL_PERMISSIONS, PERMISSION_DEFINITIONS, ROLE_PERMISSIONS, ROLES } from './permissions';

describe('permission list', () => {
  it('has unique keys in resource:action form', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
    for (const key of ALL_PERMISSIONS) {
      expect(key).toMatch(/^[a-z]+:[a-z_]+$/);
    }
  });

  it('describes every permission', () => {
    for (const { description } of PERMISSION_DEFINITIONS) {
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('includes every permission string named in the docs, spelled the same way', () => {
    const documented = [
      'product:update',
      'placement:manage',
      'order:status_change',
      'order:export',
      'settings:write',
      'page:write',
      'section:write',
      'journal:write',
    ];
    expect(ALL_PERMISSIONS).toEqual(expect.arrayContaining(documented));
  });

  it('gives super_admin everything and the other roles only known, non-duplicated permissions', () => {
    expect([...ROLE_PERMISSIONS.super_admin].sort()).toEqual([...ALL_PERMISSIONS].sort());
    for (const role of ROLES) {
      const granted = ROLE_PERMISSIONS[role];
      expect(new Set(granted).size).toBe(granted.length);
      expect(ALL_PERMISSIONS).toEqual(expect.arrayContaining([...granted]));
    }
  });

  it('keeps the super_admin-only powers away from the other roles', () => {
    const superAdminOnly = ['user:manage', 'settings:write', 'order:export', 'audit:read'];
    for (const role of ['marketing_admin', 'product_manager'] as const) {
      for (const permission of superAdminOnly) {
        expect(ROLE_PERMISSIONS[role]).not.toContain(permission);
      }
    }
  });
});

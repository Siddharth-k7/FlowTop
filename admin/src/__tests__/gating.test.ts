import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { RoleName, User } from '@flowtop/types';

// Server rendering runs no effects, so the list never loads. The buttons in the page header render at once,
// and those are what a role must not see. Permissions come from the real ROLE_PERMISSIONS (mocks/roles.ts).
vi.mock('@/lib/api', () => ({ api: () => new Promise(() => {}), ApiError: class extends Error {} }));

const { UserContext } = await import('@/hooks/useCurrentUser');
const { ContentList } = await import('@/components/screens/Content');
const { EditorBar } = await import('@/components/ui/EditorBar');
const { CONTENT_TYPES } = await import('@/lib/content-types');
const { permissionsFor } = await import('@/lib/mocks/roles');

const as = (role: RoleName, node: ReturnType<typeof createElement>) => {
  const user: User = { id: 'u', name: role, email: `${role}@example.test`, role, permissions: permissionsFor(role), mfaEnabled: true, mfaSetupRequired: false };
  return renderToStaticMarkup(createElement(UserContext.Provider, { value: user }, node));
};
const collections = CONTENT_TYPES.find((c) => c.section === 'collections');
const journal = CONTENT_TYPES.find((c) => c.section === 'journal');

describe('S1: write controls follow the role (cosmetic; the server enforces)', () => {
  it('"Add collection" shows for product_manager (collection:write) and not for marketing_admin', () => {
    if (!collections) throw new Error('no collections content type');
    expect(as('product_manager', createElement(ContentList, { ct: collections }))).toContain('Add collection');
    expect(as('marketing_admin', createElement(ContentList, { ct: collections }))).not.toContain('Add collection');
  });
  it('"Add article" shows for marketing_admin (journal:write) and not for product_manager', () => {
    if (!journal) throw new Error('no journal content type');
    expect(as('marketing_admin', createElement(ContentList, { ct: journal }))).toContain('Add article');
    expect(as('product_manager', createElement(ContentList, { ct: journal }))).not.toContain('Add article');
  });
  it('the editor bar drops Save and Publish when the screen says the role cannot', () => {
    const noop = () => {};
    const gated = renderToStaticMarkup(createElement(EditorBar, { dirty: true, saving: false, onSave: noop, canSave: false }));
    const open = renderToStaticMarkup(createElement(EditorBar, { dirty: true, saving: false, onSave: noop, onPublish: noop }));
    expect(gated).not.toContain('Save Draft');
    expect(gated).not.toContain('Publish');
    expect(open).toContain('Save Draft');
    expect(open).toContain('Publish');
  });
  it('every content type names a write and a publish permission', () => {
    for (const ct of CONTENT_TYPES) expect([ct.section, ct.write, ct.publish].every(Boolean)).toBe(true);
  });
});

/** Any component that calls a write endpoint must also ask useCan, so a new screen cannot ship an ungated button. */
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const ROOT = join(__dirname, '..', 'components');
const WRITES = /method:\s*'(POST|PUT|PATCH|DELETE)'|method:\s*isNew|bulk\(/;
/** Sign-in and MFA are not permission-gated; media components call lib/media and are gated where they render. */
const EXEMPT = ['auth', join('shell', 'Topbar.tsx')];

describe('S1: no ungated write screen', () => {
  const files = walk(ROOT).filter((f) => /\.tsx$/.test(f) && !EXEMPT.some((e) => f.includes(join('components', e))));
  const writers = files.filter((f) => WRITES.test(readFileSync(f, 'utf8')));
  it('finds the writing screens at all, so the check is not vacuous', () => expect(writers.length).toBeGreaterThanOrEqual(8));
  it.each(writers.map((f) => [f.slice(ROOT.length + 1), f]))('%s uses useCan (or takes canEdit from a screen that does)', (_name, file) => {
    expect(readFileSync(file as string, 'utf8')).toMatch(/useCan|canEdit: boolean/);
  });
});

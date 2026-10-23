import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '@flowtop/types';

// The fetch never settles here: server rendering runs no effects. This test pins the permission
// gate on the two tables. The real-API Playwright check (see docs/reviews/dev-a-fix-dev-d-admin-rebase-2026-10-24.md) stubs a 200 summary with rows.
vi.mock('@/lib/api', () => ({ api: () => new Promise(() => {}), ApiError: class extends Error {} }));

const { Dashboard } = await import('@/components/dashboard/Dashboard');
const { UserContext } = await import('@/hooks/useCurrentUser');
const { mockUsers } = await import('@/lib/mocks/auth');

const userFor = (email: string): User => {
  const u = mockUsers[email];
  if (!u) throw new Error(`no mock user ${email}`);
  return u;
};
const render = (user: User) =>
  renderToStaticMarkup(createElement(UserContext.Provider, { value: user }, createElement(Dashboard)));

describe('Dashboard tables are permission-filtered (cosmetic; the server re-checks)', () => {
  it('super_admin sees Recent orders and Recent submissions', () => {
    const html = render(userFor('admin@example.test'));
    expect(html).toContain('Recent orders');
    expect(html).toContain('Recent submissions');
  });

  it('product_manager sees neither table', () => {
    const user = userFor('products@example.test');
    expect(user.permissions).not.toContain('order:read');
    const html = render(user);
    expect(html).toContain('Quick actions');
    expect(html).not.toContain('Recent orders');
    expect(html).not.toContain('Recent submissions');
  });
});

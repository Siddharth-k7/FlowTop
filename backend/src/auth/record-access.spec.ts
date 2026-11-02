import { ApiException } from '../common/errors/api.exception';
import type { AuthUser } from './auth-user';
import { canAccessRecord, requireRecordAccess } from './record-access';

const priya: AuthUser = {
  id: 'user-priya',
  name: 'Priya',
  email: 'priya@flowtop.in',
  role: 'marketing_admin',
  permissions: ['page:write'],
  mfaEnabled: false,
  mfaSetupRequired: false,
};
const admin: AuthUser = { ...priya, id: 'user-admin', role: 'super_admin', permissions: ['user:read', 'page:write'] };

const ownRecord = { id: 'r1', ownerId: 'user-priya' };
const someoneElses = { id: 'r2', ownerId: 'user-ravi' };
const rule = { allWith: ['user:read'] as const, ownedBy: (u: AuthUser, r: typeof ownRecord) => r.ownerId === u.id };

function expectNotFound(run: () => unknown): void {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiException);
    expect((error as ApiException).code).toBe('NOT_FOUND');
    return;
  }
  throw new Error('expected a NOT_FOUND ApiException');
}

describe('requireRecordAccess', () => {
  it('returns your own record', () => {
    expect(requireRecordAccess(priya, ownRecord, rule)).toBe(ownRecord);
  });

  it("answers someone else's record exactly like a missing one: 404", () => {
    expectNotFound(() => requireRecordAccess(priya, someoneElses, rule));
    expectNotFound(() => requireRecordAccess(priya, null, rule));
  });

  it('lets a holder of an allWith permission read any record', () => {
    expect(requireRecordAccess(admin, someoneElses, rule)).toBe(someoneElses);
  });

  it('still answers 404 for a missing record, even with an allWith permission', () => {
    expectNotFound(() => requireRecordAccess(admin, undefined, rule));
  });

  it('fails closed: a rule with nothing in it allows nobody, not even an admin', () => {
    expectNotFound(() => requireRecordAccess(admin, ownRecord, {}));
    expect(canAccessRecord(priya, ownRecord, {})).toBe(false);
  });

  it('works with an ownership rule alone', () => {
    const ownersOnly = { ownedBy: rule.ownedBy };
    expect(requireRecordAccess(priya, ownRecord, ownersOnly)).toBe(ownRecord);
    expectNotFound(() => requireRecordAccess(admin, ownRecord, ownersOnly));
  });
});

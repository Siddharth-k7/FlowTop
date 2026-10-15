import { generateRecoveryCodes, hashRecoveryCode, normalizeRecoveryCode, RECOVERY_CODE_COUNT } from './recovery-codes';

describe('recovery codes', () => {
  it('generates eight unique codes in XXXX-XXXX-XXXX-XXXX form, without look-alike characters', () => {
    const codes = generateRecoveryCodes();

    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code).not.toMatch(/[01ILOU]/);
    }
  });

  it('treats case, spaces and dashes as irrelevant when typed back in', () => {
    const [code] = generateRecoveryCodes(1);
    const typed = ` ${code.toLowerCase().replace(/-/g, ' ')} `;

    expect(normalizeRecoveryCode(typed)).toBe(code.replace(/-/g, ''));
    expect(hashRecoveryCode(typed)).toBe(hashRecoveryCode(code));
  });

  it('stores a hash that does not contain the code', () => {
    const [code] = generateRecoveryCodes(1);
    const hash = hashRecoveryCode(code);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(normalizeRecoveryCode(code));
  });
});

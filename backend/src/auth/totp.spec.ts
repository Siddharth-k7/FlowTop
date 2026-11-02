import { base32Decode, base32Encode, generateTotp, hotp, matchTotpStep, totpProvisioningUri, verifyTotp } from './totp';

// The shared secret from RFC 4226 and RFC 6238: ASCII "12345678901234567890".
const RFC_KEY = Buffer.from('12345678901234567890');
const RFC_SECRET = base32Encode(RFC_KEY);

describe('hotp (RFC 4226 appendix D)', () => {
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];

  it.each(expected.map((code, counter) => [counter, code]))('counter %i gives %s', (counter, code) => {
    expect(hotp(RFC_KEY, counter)).toBe(code);
  });
});

describe('generateTotp (RFC 6238 appendix B, SHA-1, 8 digits)', () => {
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ])('at %i seconds gives %s', (seconds, code) => {
    expect(generateTotp(RFC_SECRET, seconds * 1000, 8)).toBe(code);
  });
});

describe('verifyTotp', () => {
  const now = 1_760_000_000_000;

  it('accepts the current code and one step of drift either side', () => {
    expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, now), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, now - 30_000), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, now + 30_000), now)).toBe(true);
  });

  it('rejects a code from outside the window', () => {
    expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, now - 90_000), now)).toBe(false);
  });

  it('rejects anything that is not exactly six digits', () => {
    expect(verifyTotp(RFC_SECRET, '', now)).toBe(false);
    expect(verifyTotp(RFC_SECRET, '12345', now)).toBe(false);
    expect(verifyTotp(RFC_SECRET, '12345a', now)).toBe(false);
  });
});

describe('matchTotpStep', () => {
  const now = 1_760_000_000_000;
  const step = Math.floor(now / 30_000);

  it('reports which step a code belongs to, so it can be recorded and refused next time', () => {
    expect(matchTotpStep(RFC_SECRET, generateTotp(RFC_SECRET, now), now)).toBe(step);
    expect(matchTotpStep(RFC_SECRET, generateTotp(RFC_SECRET, now - 30_000), now)).toBe(step - 1);
    expect(matchTotpStep(RFC_SECRET, generateTotp(RFC_SECRET, now + 30_000), now)).toBe(step + 1);
  });

  it('returns null for a wrong or malformed code', () => {
    expect(matchTotpStep(RFC_SECRET, generateTotp(RFC_SECRET, now - 120_000), now)).toBeNull();
    expect(matchTotpStep(RFC_SECRET, 'abcdef', now)).toBeNull();
  });
});

describe('totpProvisioningUri', () => {
  it('builds the otpauth URI authenticator apps scan, with issuer and account', () => {
    const raw = totpProvisioningUri('JBSWY3DPEHPK3PXP', 'priya@flowtop.in', 'Flowtop');
    const uri = new URL(raw);

    expect(raw.startsWith('otpauth://totp/Flowtop%3Apriya%40flowtop.in?')).toBe(true);
    expect(uri.host).toBe('totp');
    expect(Object.fromEntries(uri.searchParams)).toEqual({
      secret: 'JBSWY3DPEHPK3PXP',
      issuer: 'Flowtop',
      algorithm: 'SHA1',
      digits: '6',
      period: '30',
    });
  });
});

describe('base32', () => {
  it('round-trips arbitrary bytes and tolerates padding, spaces and lowercase', () => {
    const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 42]);
    const encoded = base32Encode(bytes);

    expect(base32Decode(encoded)).toEqual(bytes);
    expect(base32Decode(`${encoded.toLowerCase().replace(/(.{4})/g, '$1 ')}====`)).toEqual(bytes);
  });

  it('rejects characters outside the alphabet', () => {
    expect(() => base32Decode('ABC1')).toThrow();
  });
});

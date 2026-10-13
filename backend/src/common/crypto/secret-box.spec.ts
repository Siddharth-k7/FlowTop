import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { Env } from '../../config/env.validation';
import { SecretBox } from './secret-box';

function boxWithKey(key: string): SecretBox {
  const config = { get: () => key } as unknown as ConfigService<Env, true>;
  return new SecretBox(config);
}

describe('SecretBox', () => {
  const box = boxWithKey(randomBytes(32).toString('base64'));

  it('round-trips a secret and never stores it in readable form', () => {
    const sealed = box.seal('JBSWY3DPEHPK3PXP');

    expect(sealed).not.toContain('JBSWY3DPEHPK3PXP');
    expect(box.open(sealed)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('produces a different ciphertext each time', () => {
    expect(box.seal('same')).not.toBe(box.seal('same'));
  });

  it('rejects a tampered ciphertext', () => {
    const [version, iv, tag, ciphertext] = box.seal('JBSWY3DPEHPK3PXP').split('.');
    const flipped = Buffer.from(ciphertext, 'base64url');
    flipped[0] ^= 0xff;

    expect(() => box.open([version, iv, tag, flipped.toString('base64url')].join('.'))).toThrow();
  });

  it('cannot be opened with a different key', () => {
    const other = boxWithKey(randomBytes(32).toString('base64'));

    expect(() => other.open(box.seal('JBSWY3DPEHPK3PXP'))).toThrow();
  });
});

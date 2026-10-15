import { createHash, randomInt } from 'node:crypto';

/** No 0/O, 1/I/L or U: nothing a person can misread when typing it from paper. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const LENGTH = 16;
export const RECOVERY_CODE_COUNT = 8;

/**
 * Eight fresh codes, each 16 characters from a 30-character alphabet (about 78
 * bits of randomness), shown as XXXX-XXXX-XXXX-XXXX.
 */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const raw = Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    return raw.match(/.{4}/g)?.join('-') ?? raw;
  });
}

/** Case, spaces and dashes do not matter when a code is typed back in. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * What the database stores. A fast hash is safe here only because the codes
 * are long and random: 78 bits cannot be guessed back from the hash.
 */
export function hashRecoveryCode(input: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(input)).digest('hex');
}

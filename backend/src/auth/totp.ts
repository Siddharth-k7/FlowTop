import { createHmac, timingSafeEqual } from 'node:crypto';

/** RFC 6238 TOTP as used by authenticator apps: HMAC-SHA1, 30-second steps, 6 digits. */
const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotp(secretBase32: string, timeMs = Date.now(), digits = DIGITS): string {
  return hotp(base32Decode(secretBase32), timeStep(timeMs), digits);
}

/**
 * Accepts the code for the current step and `window` steps either side, to
 * allow for clock drift. Compares in constant time and checks every step.
 */
export function verifyTotp(secretBase32: string, code: string, timeMs = Date.now(), window = 1): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }
  const key = base32Decode(secretBase32);
  const step = timeStep(timeMs);
  const given = Buffer.from(code);

  let matched = false;
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = Buffer.from(hotp(key, step + offset, DIGITS));
    matched = timingSafeEqual(candidate, given) || matched;
  }
  return matched;
}

/** RFC 4226 HOTP. */
export function hotp(key: Buffer, counter: number, digits = DIGITS): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(message).digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return binary.toString().padStart(digits, '0');
}

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/[\s=]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character in TOTP secret');
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function timeStep(timeMs: number): number {
  return Math.floor(timeMs / 1000 / STEP_SECONDS);
}

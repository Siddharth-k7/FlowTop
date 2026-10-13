import { createHash, randomBytes } from 'node:crypto';

export interface SecretToken {
  /** Handed to the client once. Never stored. */
  token: string;
  /** What the database stores and looks up by. */
  tokenHash: string;
}

/** 256 bits of randomness. SHA-256 is enough to hash a token this strong; argon2 is for low-entropy passwords. */
export function newSecretToken(): SecretToken {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

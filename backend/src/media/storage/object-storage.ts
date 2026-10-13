import { randomUUID } from 'node:crypto';
import { MediaBucket } from '../../generated/prisma/client';

/** Private file links stop working after 15 minutes. */
export const PRIVATE_URL_TTL_SECONDS = 15 * 60;

const STORAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/;

/**
 * A fresh random key: a v4 uuid plus the extension of the detected type. Never
 * derived from the uploaded filename, and unrelated to any other key, so a
 * private key cannot be guessed from a public one.
 */
export function newStorageKey(extension: string): string {
  return `${randomUUID()}.${extension}`;
}

/** True only for keys this module generates. Anything else, including a path, is refused. */
export function isStorageKey(key: string): boolean {
  return STORAGE_KEY_PATTERN.test(key);
}

/**
 * Where files live. Two buckets, kept apart by every implementation:
 * public files have permanent URLs, private files only ever get a signed URL
 * valid for PRIVATE_URL_TTL_SECONDS.
 */
export abstract class ObjectStorage {
  abstract put(bucket: MediaBucket, key: string, body: Buffer, contentType: string): Promise<void>;

  abstract remove(bucket: MediaBucket, key: string): Promise<void>;

  /** Public bucket: the permanent URL. Private bucket: a fresh signed URL. */
  abstract url(bucket: MediaBucket, key: string): Promise<string>;
}

export function publicUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${key}`;
}

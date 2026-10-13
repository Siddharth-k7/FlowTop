import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { MediaBucket } from '../../generated/prisma/client';
import { isStorageKey, ObjectStorage, PRIVATE_URL_TTL_SECONDS, publicUrl } from './object-storage';

export interface LocalStorageOptions {
  rootDir: string;
  publicBaseUrl: string;
  privateBaseUrl: string;
  signingKey: Buffer;
}

/**
 * Development and test storage: two separate folders on disk, served by
 * MediaFilesController. Private files are reachable only through a URL signed
 * with HMAC-SHA256 that expires after 15 minutes, mirroring S3 presigned URLs.
 * Refused in production by config validation.
 */
export class LocalObjectStorage extends ObjectStorage {
  private readonly rootDir: string;

  constructor(private readonly options: LocalStorageOptions) {
    super();
    this.rootDir = resolve(options.rootDir);
  }

  async put(bucket: MediaBucket, key: string, body: Buffer): Promise<void> {
    const path = this.pathFor(bucket, key);
    await mkdir(join(this.rootDir, bucket), { recursive: true });
    // wx: never overwrite an existing file.
    await writeFile(path, body, { flag: 'wx' });
  }

  async remove(bucket: MediaBucket, key: string): Promise<void> {
    await rm(this.pathFor(bucket, key), { force: true });
  }

  url(bucket: MediaBucket, key: string): Promise<string> {
    if (bucket === MediaBucket.public) {
      return Promise.resolve(publicUrl(this.options.publicBaseUrl, key));
    }
    const expires = Math.floor(this.now() / 1000) + PRIVATE_URL_TTL_SECONDS;
    return Promise.resolve(this.signedUrl(key, expires));
  }

  /** A private-file URL that stops working at `expires` (Unix seconds). */
  signedUrl(key: string, expires: number): string {
    const url = new URL(publicUrl(this.options.privateBaseUrl, key));
    url.searchParams.set('expires', String(expires));
    url.searchParams.set('signature', this.sign(key, expires));
    return url.toString();
  }

  /** Constant-time signature check, then expiry. */
  verifySignedUrl(key: string, expires: string | undefined, signature: string | undefined): boolean {
    if (!expires || !signature || !/^\d{1,12}$/.test(expires)) {
      return false;
    }
    const expected = Buffer.from(this.sign(key, Number(expires)));
    const given = Buffer.from(signature);
    const signatureValid = expected.length === given.length && timingSafeEqual(expected, given);
    return signatureValid && Number(expires) > Math.floor(this.now() / 1000);
  }

  /** The file's path on disk if it exists in that bucket, otherwise null. */
  async existingPath(bucket: MediaBucket, key: string): Promise<string | null> {
    if (!isStorageKey(key)) {
      return null;
    }
    const path = this.pathFor(bucket, key);
    try {
      return (await stat(path)).isFile() ? path : null;
    } catch {
      return null;
    }
  }

  protected now(): number {
    return Date.now();
  }

  private sign(key: string, expires: number): string {
    return createHmac('sha256', this.options.signingKey).update(`${key}:${expires}`).digest('base64url');
  }

  private pathFor(bucket: MediaBucket, key: string): string {
    if (!isStorageKey(key)) {
      throw new Error('Refusing a storage key this module did not generate');
    }
    return join(this.rootDir, bucket, key);
  }
}

import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalObjectStorage, LocalStorageOptions } from './local-object-storage';
import { newStorageKey, PRIVATE_URL_TTL_SECONDS } from './object-storage';

class ClockedStorage extends LocalObjectStorage {
  time = 1_800_000_000_000;

  protected override now(): number {
    return this.time;
  }
}

function signatureOf(url: string): { expires: string; signature: string; key: string } {
  const parsed = new URL(url);
  return {
    key: parsed.pathname.split('/').pop() ?? '',
    expires: parsed.searchParams.get('expires') ?? '',
    signature: parsed.searchParams.get('signature') ?? '',
  };
}

describe('LocalObjectStorage', () => {
  let rootDir: string;
  let storage: ClockedStorage;
  let options: LocalStorageOptions;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'flowtop-storage-'));
    options = {
      rootDir,
      publicBaseUrl: 'http://localhost:4000/api/v1/files/public',
      privateBaseUrl: 'http://localhost:4000/api/v1/files/private',
      signingKey: randomBytes(32),
    };
    storage = new ClockedStorage(options);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('keeps the two buckets in separate folders', async () => {
    const key = newStorageKey('png');
    await storage.put('private', key, Buffer.from('secret document'));

    expect(await storage.existingPath('private', key)).not.toBeNull();
    expect(await storage.existingPath('public', key)).toBeNull();
    expect(await readFile(join(rootDir, 'private', key), 'utf8')).toBe('secret document');
  });

  it('gives public files a permanent URL with no signature', async () => {
    const key = newStorageKey('jpg');

    expect(await storage.url('public', key)).toBe(`http://localhost:4000/api/v1/files/public/${key}`);
  });

  it('signs private URLs for exactly 15 minutes', async () => {
    const key = newStorageKey('pdf');
    const { expires, signature } = signatureOf(await storage.url('private', key));

    expect(Number(expires)).toBe(storage.time / 1000 + PRIVATE_URL_TTL_SECONDS);
    expect(storage.verifySignedUrl(key, expires, signature)).toBe(true);

    storage.time += (PRIVATE_URL_TTL_SECONDS - 1) * 1000;
    expect(storage.verifySignedUrl(key, expires, signature)).toBe(true);

    storage.time += 1000;
    expect(storage.verifySignedUrl(key, expires, signature)).toBe(false);
  });

  it('Phase 1 check 11: a private URL fetched 20 minutes later is refused', async () => {
    const key = newStorageKey('pdf');
    const { expires, signature } = signatureOf(await storage.url('private', key));

    storage.time += 20 * 60 * 1000;

    expect(storage.verifySignedUrl(key, expires, signature)).toBe(false);
  });

  it('refuses a tampered signature, a moved expiry, another key, or a different signing key', async () => {
    const key = newStorageKey('pdf');
    const { expires, signature } = signatureOf(await storage.url('private', key));
    const lastChar = signature.slice(-1);
    const tampered = `${signature.slice(0, -1)}${lastChar === 'A' ? 'B' : 'A'}`;

    expect(tampered).not.toBe(signature);
    expect(storage.verifySignedUrl(key, expires, tampered)).toBe(false);
    expect(storage.verifySignedUrl(key, String(Number(expires) + 3600), signature)).toBe(false);
    expect(storage.verifySignedUrl(newStorageKey('pdf'), expires, signature)).toBe(false);
    expect(new LocalObjectStorage({ ...options, signingKey: randomBytes(32) }).verifySignedUrl(key, expires, signature)).toBe(false);
    expect(storage.verifySignedUrl(key, undefined, signature)).toBe(false);
    expect(storage.verifySignedUrl(key, 'soon', signature)).toBe(false);
  });

  it('refuses any key it did not generate, including paths', async () => {
    await expect(storage.put('public', '../../escape.png', Buffer.from('x'))).rejects.toThrow();
    expect(await storage.existingPath('public', '../package.json')).toBeNull();
    expect(await storage.existingPath('public', 'photo.png')).toBeNull();
  });

  it('never overwrites an existing file', async () => {
    const key = newStorageKey('png');
    await storage.put('public', key, Buffer.from('first'));

    await expect(storage.put('public', key, Buffer.from('second'))).rejects.toThrow();
  });
});

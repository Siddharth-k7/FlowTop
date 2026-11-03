import { describe, expect, it, vi } from 'vitest';
import type { MediaAsset } from '@flowtop/types';
import { ApiError } from '@/lib/api';
import { assetName, settleUpload, validateFile } from '@/lib/media';

const MB = 1024 * 1024;
const file = (name: string, type: string, size: number) => ({ name, type, size }) as File;
const asset = (over: Partial<MediaAsset>): MediaAsset => ({
  id: 'm1', url: 'http://localhost:4000/media/public/2026/abc%20def.jpg', filename: 'beach.jpg', mimeType: 'image/jpeg',
  sizeBytes: 10, width: 1, height: 1, alt: '', variants: {}, createdAt: '2026-10-24T00:00:00.000Z', ...over,
} as MediaAsset);

describe('validateFile (mirrors backend/src/media/file-types.ts)', () => {
  it('accepts every allowed type at its limit', () => {
    expect(validateFile(file('a.jpg', 'image/jpeg', 15 * MB))).toBeNull();
    expect(validateFile(file('a.avif', 'image/avif', 1))).toBeNull();
    expect(validateFile(file('a.pdf', 'application/pdf', 25 * MB))).toBeNull();
  });
  it('rejects one byte over the limit, naming the file and the limit', () => {
    expect(validateFile(file('big.png', 'image/png', 15 * MB + 1))).toMatch(/^big\.png is .*limit for this type is 15/);
    expect(validateFile(file('big.pdf', 'application/pdf', 25 * MB + 1))).toMatch(/limit for this type is 25/);
  });
  it('rejects types that are not allowed', () => {
    expect(validateFile(file('x.gif', 'image/gif', 1))).toMatch(/x\.gif: this file type is not allowed/);
    expect(validateFile(file('x.svg', 'image/svg+xml', 1))).toMatch(/not allowed/);
  });
});

describe('assetName', () => {
  it('uses filename from the API', () => expect(assetName(asset({}))).toBe('beach.jpg'));
  it('falls back to the decoded URL basename only when filename is empty', () =>
    expect(assetName(asset({ filename: '' }))).toBe('abc def.jpg'));
});

describe('settleUpload', () => {
  const run = (status: number, text: string) => {
    const resolve = vi.fn(); const reject = vi.fn();
    settleUpload(status, text, 'photo.jpg', resolve, reject);
    return { resolve, reject, err: reject.mock.calls[0]?.[0] as ApiError | undefined };
  };
  it('resolves the data of a 201 envelope', () => {
    const { resolve, reject } = run(201, JSON.stringify({ data: asset({}) }));
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
    expect(reject).not.toHaveBeenCalled();
  });
  it('rejects (never hangs) on a non-JSON body', () => {
    const { resolve, err } = run(502, '<html>Bad gateway</html>');
    expect(resolve).not.toHaveBeenCalled();
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 502, code: 'SERVER_ERROR', message: 'photo.jpg: upload failed.' });
  });
  it('rejects on an empty 413', () => expect(run(413, '').err).toMatchObject({ status: 413 }));
  it('rejects a 2xx without data', () => expect(run(200, '{}').err).toMatchObject({ status: 200, code: 'SERVER_ERROR' }));
  it('maps the error envelope', () => {
    const { err } = run(400, JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Bad file', fields: { file: 'Too big' } } }));
    expect(err).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Bad file', fields: { file: 'Too big' } });
  });
});

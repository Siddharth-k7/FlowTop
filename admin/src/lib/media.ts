import { api, ApiError, BASE, handleStatus, toApiError, USE_MOCKS } from '@/lib/api';
import { formatBytes } from '@/lib/utils/formatDate';
import type { MediaAsset } from '@flowtop/types';

// Fast feedback only. Dev A enforces the real limits server side.
// Mirrors backend/src/media/file-types.ts (public bucket).
const MB = 1024 * 1024;
const MAX_BYTES: Record<string, number> = {
  'image/jpeg': 15 * MB, 'image/png': 15 * MB, 'image/webp': 15 * MB, 'image/avif': 15 * MB, 'application/pdf': 25 * MB,
};
export const ALLOWED_TYPES = Object.keys(MAX_BYTES);

export function validateFile(file: File): string | null {
  const max = MAX_BYTES[file.type];
  if (!max) return `${file.name}: this file type is not allowed. Use JPG, PNG, WebP, AVIF or PDF.`;
  if (file.size > max) return `${file.name} is ${formatBytes(file.size)}. The limit for this type is ${formatBytes(max)}. Please compress it and try again.`;
  return null;
}

/**
 * Display name. The API always sends `filename` (PR #11); the URL fallback is only for an
 * empty string, and should never fire against the real API.
 */
export const assetName = (a: MediaAsset) =>
  a.filename || decodeURIComponent(new URL(a.url, 'http://x').pathname.split('/').pop() || 'file');
/** Variants are filled in by background processing and may be empty right after upload. */
export const assetThumb = (a: MediaAsset, size: 'thumb' | 'medium' = 'thumb') => a.variants[size] ?? a.url;

/** The API's type filter values (backend/src/media/dto: 'image' | 'document'). */
export type MediaTypeFilter = '' | 'image' | 'document';

export const listMedia = (search: string, type: MediaTypeFilter) =>
  // ponytail: first 100 only (API max perPage); add paging when the library outgrows it.
  api<MediaAsset[]>(`/admin/media?perPage=100&search=${encodeURIComponent(search)}${type ? `&type=${type}` : ''}`);
export const updateAlt = (id: string, altText: string) =>
  api<MediaAsset>(`/admin/media/${id}`, { method: 'PATCH', body: { altText } });
export const deleteMedia = (id: string) => api<null>(`/admin/media/${id}`, { method: 'DELETE' });

/** Uploads one file with progress (0-100). */
export function uploadFile(file: File, onProgress: (pct: number) => void): Promise<MediaAsset> {
  if (USE_MOCKS) {
    return import('@/lib/mocks/router').then(({ mockAddMedia }) => new Promise((resolve) => {
      let p = 0;
      const t = setInterval(() => {
        p += 20; onProgress(Math.min(p, 100));
        if (p >= 100) { clearInterval(t); resolve(mockAddMedia(file, URL.createObjectURL(file))); }
      }, 150);
    }));
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'public');
    xhr.open('POST', `${BASE}/admin/media/upload`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK', `${file.name}: could not reach the server.`));
    xhr.onload = () => settleUpload(xhr.status, xhr.responseText, file.name, resolve, reject);
    xhr.send(form);
  });
}

/**
 * Settles an upload from the raw XHR result. Never throws: a non-JSON body (a proxy's HTML 502,
 * an empty 413) rejects instead of leaving the promise pending and the upload row stuck.
 */
export function settleUpload(status: number, text: string, name: string,
  resolve: (a: MediaAsset) => void, reject: (e: ApiError) => void) {
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  const data = (json as { data?: MediaAsset } | null)?.data;
  if (status >= 200 && status < 300 && data) return resolve(data);
  const error = status >= 200 && status < 300
    ? new ApiError(status, 'SERVER_ERROR', `${name}: upload failed.`)
    : toApiError(status, json, `${name}: upload failed.`);
  handleStatus(status, error.code, true);
  reject(error);
}

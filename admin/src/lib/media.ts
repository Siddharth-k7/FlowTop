import { api, ApiError, USE_MOCKS } from '@/lib/api';
import { mockAddMedia } from '@/lib/mocks/router';
import { formatBytes } from '@/lib/utils/formatDate';
import type { MediaAsset } from '@/types';

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

/** The contract's MediaAsset has no filename; fall back to the last URL segment. */
export const assetName = (a: MediaAsset) =>
  a.filename ?? decodeURIComponent(new URL(a.url, 'http://x').pathname.split('/').pop() || 'file');
/** Variants are filled in by background processing and may be empty right after upload. */
export const assetThumb = (a: MediaAsset, size: 'thumb' | 'medium' = 'thumb') => a.variants[size] ?? a.url;

export const listMedia = (search: string, type: string) =>
  // ponytail: first 100 only (API max perPage); add paging when the library outgrows it.
  api<MediaAsset[]>(`/admin/media?perPage=100&search=${encodeURIComponent(search)}${type ? `&type=${type}` : ''}`);
export const updateAlt = (id: string, altText: string) =>
  api<MediaAsset>(`/admin/media/${id}`, { method: 'PATCH', body: { altText } });
export const deleteMedia = (id: string) => api<null>(`/admin/media/${id}`, { method: 'DELETE' });

/** Uploads one file with progress (0-100). */
export function uploadFile(file: File, onProgress: (pct: number) => void): Promise<MediaAsset> {
  if (USE_MOCKS) {
    // TODO: swap for real API (POST /admin/media/upload)
    return new Promise((resolve) => {
      let p = 0;
      const t = setInterval(() => {
        p += 20; onProgress(Math.min(p, 100));
        if (p >= 100) { clearInterval(t); resolve(mockAddMedia(file, URL.createObjectURL(file))); }
      }, 150);
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'public');
    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/admin/media/upload`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK', `${file.name}: could not reach the server.`));
    xhr.onload = () => {
      const json = JSON.parse(xhr.responseText || 'null') as { data?: MediaAsset; error?: { code: string; message: string } } | null;
      if (xhr.status >= 200 && xhr.status < 300 && json?.data) return resolve(json.data);
      if (xhr.status === 401) window.location.assign('/login');
      reject(new ApiError(xhr.status, json?.error?.code ?? 'SERVER_ERROR', json?.error?.message ?? `${file.name}: upload failed.`));
    };
    xhr.send(form);
  });
}

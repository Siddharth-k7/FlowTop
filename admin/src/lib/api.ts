import type { ErrorCode, ErrorEnvelope } from '@flowtop/types';

/**
 * Mock mode is opt-in: only NEXT_PUBLIC_USE_MOCKS=true turns it on. next.config.mjs refuses a
 * production build with it on, and the mock router is imported dynamically, so it is never in
 * the bundle path of a real request.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
export const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, public code: ErrorCode | 'NETWORK', message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

/** Fired on 403 so the shell can show a permission toast. */
export const FORBIDDEN_EVENT = 'ft:forbidden';

/** Side effects of a failed response: 401 to login, MFA_SETUP_REQUIRED to setup, 403 toast. */
export function handleStatus(status: number, code: string | undefined, redirect: boolean) {
  if (typeof window === 'undefined') return;
  const here = window.location.pathname;
  if (status === 401 && redirect && here !== '/login') {
    window.location.assign(`/login?next=${encodeURIComponent(here)}`);
  } else if (code === 'MFA_SETUP_REQUIRED') {
    // Super admin signed in without MFA: the API refuses everything until it is set up.
    if (here !== '/mfa-setup') window.location.assign('/mfa-setup');
  } else if (status === 403) window.dispatchEvent(new Event(FORBIDDEN_EVENT));
}

/** Turns a non-2xx status and its (possibly empty or non-JSON) body into an ApiError. */
export function toApiError(status: number, json: unknown, fallback = 'Something went wrong.'): ApiError {
  const err = (json as Partial<ErrorEnvelope> | null)?.error;
  return new ApiError(status, err?.code ?? 'SERVER_ERROR', err?.message ?? fallback, err?.fields);
}

interface Opts { method?: string; body?: unknown; redirectOn401?: boolean }

/** Returns the unwrapped `data` of the contract envelope. Throws ApiError with `fields` on failure. */
export async function api<T>(path: string, { method = 'GET', body, redirectOn401 = true }: Opts = {}): Promise<T> {
  let res: { status: number; json: unknown };
  try {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { mockRequest } = await import('@/lib/mocks/router');
      res = await mockRequest(path, method, body);
    } else {
      const r = await fetch(`${BASE}${path}`, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      res = { status: r.status, json: await r.json().catch(() => null) };
    }
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Your work has not been saved.');
  }
  // 204 (logout, delete, reset confirm) has no body.
  if (res.status >= 200 && res.status < 300) return (res.json as { data: T } | null)?.data as T;
  const error = toApiError(res.status, res.json);
  handleStatus(res.status, error.code, redirectOn401);
  throw error;
}

export interface ListMeta { page: number; perPage: number; total: number; totalPages: number }

/** Like api(), but keeps the pagination meta. A list with no meta is treated as one complete page. */
export async function apiList<T>(path: string): Promise<{ data: T[]; meta: ListMeta }> {
  let res: { status: number; json: unknown };
  try {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { mockRequest } = await import('@/lib/mocks/router');
      res = await mockRequest(path, 'GET', undefined);
    } else {
      const r = await fetch(`${BASE}${path}`, { credentials: 'include' });
      res = { status: r.status, json: await r.json().catch(() => null) };
    }
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Your work has not been saved.');
  }
  if (res.status < 200 || res.status >= 300) {
    const error = toApiError(res.status, res.json);
    handleStatus(res.status, error.code, true);
    throw error;
  }
  const body = res.json as { data?: T[]; meta?: ListMeta } | null;
  const data = body?.data ?? [];
  return { data, meta: body?.meta ?? { page: 1, perPage: data.length || 25, total: data.length, totalPages: data.length ? 1 : 0 } };
}

/** The file name in a Content-Disposition header, or the fallback. */
export const fileNameFrom = (header: string | null, fallback: string) => /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header ?? '')?.[1] ?? fallback;

/**
 * GET a file the server builds (the orders CSV) and return it as a Blob. The body is the file, not the JSON envelope,
 * so an error is read from the envelope only when the status says it failed. Throws ApiError, like api().
 */
export async function apiDownload(path: string, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
  let status: number; let blob: Blob; let filename = fallbackName;
  try {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { mockRequest } = await import('@/lib/mocks/router');
      const r = await mockRequest(path, 'GET', undefined);
      status = r.status; blob = new Blob([typeof (r.json as { csv?: unknown })?.csv === 'string' ? (r.json as { csv: string }).csv : JSON.stringify(r.json)], { type: 'text/csv' });
      if (status >= 400) throw toApiError(status, r.json);
    } else {
      const r = await fetch(`${BASE}${path}`, { credentials: 'include' });
      status = r.status; filename = fileNameFrom(r.headers.get('content-disposition'), fallbackName);
      if (!r.ok) { const error = toApiError(status, await r.json().catch(() => null)); handleStatus(status, error.code, true); throw error; }
      blob = await r.blob();
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Nothing was downloaded.');
  }
  return { blob, filename };
}

/** Hands a Blob to the browser as a download. */
export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

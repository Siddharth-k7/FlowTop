import type { ApiErrorBody } from '@/types';
import { mockRequest } from '@/lib/mocks/router';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

/** Fired on 403 so the shell can show a permission toast. */
export const FORBIDDEN_EVENT = 'ft:forbidden';

function handleStatus(status: number, code: string | undefined, redirect: boolean) {
  if (typeof window === 'undefined') return;
  const here = window.location.pathname;
  if (status === 401 && redirect && here !== '/login') {
    window.location.assign(`/login?next=${encodeURIComponent(here)}`);
  } else if (code === 'MFA_SETUP_REQUIRED') {
    // Super admin signed in without MFA: the API refuses everything until it is set up.
    if (here !== '/mfa-setup') window.location.assign('/mfa-setup');
  } else if (status === 403) window.dispatchEvent(new Event(FORBIDDEN_EVENT));
}

interface Opts { method?: string; body?: unknown; redirectOn401?: boolean }

/** Returns the unwrapped `data` of the contract envelope. Throws ApiError with `fields` on failure. */
export async function api<T>(path: string, { method = 'GET', body, redirectOn401 = true }: Opts = {}): Promise<T> {
  let res: { status: number; json: unknown };
  try {
    if (USE_MOCKS) res = await mockRequest(path, method, body);
    else {
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
  const err = (res.json as { error?: ApiErrorBody } | null)?.error;
  handleStatus(res.status, err?.code, redirectOn401);
  throw new ApiError(res.status, err?.code ?? 'SERVER_ERROR', err?.message ?? 'Something went wrong.', err?.fields);
}

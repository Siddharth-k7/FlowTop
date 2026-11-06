/**
 * The ONLY frontend file allowed to read the visitor's cookies.
 *
 * Calling cookies() opts the route that calls it out of static generation, so
 * only a route that genuinely needs the visitor's session (for example a
 * server-rendered cart page) may import this. Public pages never do: their data
 * comes from cookie-free, ISR-cached reads in lib/api.ts.
 *
 * scripts/check-static-routes.mjs fails `npm test` if any other file imports
 * next/headers or calls cookies(), and fails `npm run build` (postbuild) if a
 * page route outside ALLOWED_DYNAMIC_ROUTES renders dynamically.
 *
 * Usage, in a server component that needs the session:
 *
 *   const cart = await api.getCart(undefined, await sessionInit());
 */
import { cookies } from 'next/headers';
import type { SessionInit } from './api';

export async function sessionInit(): Promise<SessionInit> {
  const cookieHeader = (await cookies()).toString();
  return cookieHeader ? { headers: { Cookie: cookieHeader } } : {};
}

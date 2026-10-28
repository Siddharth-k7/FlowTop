import crypto from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-Demand Cache Revalidation Route
 *
 * Requirements:
 * - POST only.
 * - Requires a secret header compared in constant time to REVALIDATE_SECRET.
 * - Accepts only a tag from the allowed list.
 * - Answers 401 for anything else (invalid secret, disallowed tag).
 */

const ALLOWED_STATIC_TAGS = new Set([
  'navigation',
  'placements',
  'products',
  'categories',
  'collections',
  'settings',
  'journal',
  'pages',
]);

function isAllowedTag(tag: string): boolean {
  if (!tag || typeof tag !== 'string') return false;
  if (ALLOWED_STATIC_TAGS.has(tag)) return true;
  // Allow dynamic tag patterns: page:<slug> and placement:<type>:<id>
  if (/^page:[a-zA-Z0-9_-]*$/.test(tag)) return true;
  if (/^placement:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(tag)) return true;
  if (/^product:[a-zA-Z0-9_-]+$/.test(tag)) return true;
  return false;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.error('[Revalidate] REVALIDATE_SECRET is not configured on the server.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract secret from header (x-revalidate-secret or Authorization Bearer)
  const headerSecret =
    req.headers.get('x-revalidate-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';

  if (!headerSecret || !constantTimeEqual(headerSecret, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tag?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 401 });
  }

  const { tag } = body;
  if (!tag || !isAllowedTag(tag)) {
    return NextResponse.json({ error: 'Unauthorized: tag not allowed' }, { status: 401 });
  }

  try {
    revalidateTag(tag);
    return NextResponse.json({
      revalidated: true,
      tag,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(`[Revalidate] Error revalidating tag "${tag}":`, err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}

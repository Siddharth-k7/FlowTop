import type { Request } from 'express';

/**
 * The caller's IP for rate limiting. Correct behind a load balancer only when
 * TRUST_PROXY_HOPS is set, otherwise every client looks like the proxy.
 */
export function clientIp(request: Request): string {
  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}

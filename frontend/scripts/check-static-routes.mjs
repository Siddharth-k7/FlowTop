// Keeps the public site static (docs/reviews/dev-a-fix-public-static-rendering-2026-10-24.md).
//
//   node scripts/check-static-routes.mjs --source   (npm test)
//     - next/headers, cookies() and headers() appear only in src/lib/api-session.ts
//     - src/lib/api-session.ts is imported only by files listed in ALLOWED_SESSION_IMPORTERS
//     - app/layout.tsx `revalidate` equals PUBLIC_REVALIDATE_SECONDS in lib/api.ts
//
//   node scripts/check-static-routes.mjs --build    (postbuild, after `next build`)
//     - every app page route is prerendered (static or ISR), unless it is in
//       ALLOWED_DYNAMIC_ROUTES; prints the route table it checked
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');

/** Page routes allowed to render per request. Add one only with a reason. */
const ALLOWED_DYNAMIC_ROUTES = [
  // Product catalogue listing reads searchParams (filters, sort, pagination) per request
  '/products',
  // Category product listing reads searchParams (filters, sort, pagination) per request
  '/category/[slug]',
  // Journal listing reads searchParams (category, pagination) per request
  '/journal',
];
/** Files (relative to src/) allowed to import lib/api-session. */
const ALLOWED_SESSION_IMPORTERS = [];
const SESSION_FILE = 'lib/api-session.ts';

const failures = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

function checkSource() {
  for (const file of walk(src)) {
    const rel = path.relative(src, file).split(path.sep).join('/');
    const code = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    if (rel !== SESSION_FILE) {
      if (/['"]next\/headers['"]/.test(code)) failures.push(`${rel}: imports next/headers (only ${SESSION_FILE} may)`);
      if (/\bcookies\s*\(/.test(code)) failures.push(`${rel}: calls cookies() (only ${SESSION_FILE} may)`);
    }
    if (/['"][^'"]*lib\/api-session['"]|['"]\.\/api-session['"]/.test(code) && !ALLOWED_SESSION_IMPORTERS.includes(rel)) {
      failures.push(`${rel}: imports ${SESSION_FILE}; add it to ALLOWED_SESSION_IMPORTERS and its route to ALLOWED_DYNAMIC_ROUTES only if it truly needs the session`);
    }
  }
  const api = fs.readFileSync(path.join(src, 'lib/api.ts'), 'utf8');
  const layout = fs.readFileSync(path.join(src, 'app/layout.tsx'), 'utf8');
  const apiSeconds = api.match(/export const PUBLIC_REVALIDATE_SECONDS = (\d+);/)?.[1];
  const layoutSeconds = layout.match(/^export const revalidate = (\d+);/m)?.[1];
  if (!apiSeconds) failures.push('lib/api.ts: PUBLIC_REVALIDATE_SECONDS literal not found');
  if (!layoutSeconds) failures.push('app/layout.tsx: `export const revalidate = <seconds>;` not found');
  if (apiSeconds && layoutSeconds && apiSeconds !== layoutSeconds) {
    failures.push(`app/layout.tsx revalidate ${layoutSeconds} != lib/api.ts PUBLIC_REVALIDATE_SECONDS ${apiSeconds}`);
  }
  return 'source';
}

function checkBuild() {
  const dist = path.join(root, '.next');
  const appPaths = JSON.parse(fs.readFileSync(path.join(dist, 'app-path-routes-manifest.json'), 'utf8'));
  const prerender = JSON.parse(fs.readFileSync(path.join(dist, 'prerender-manifest.json'), 'utf8'));
  const rows = [];
  for (const [entry, route] of Object.entries(appPaths)) {
    if (!entry.endsWith('/page')) continue; // route handlers are not pages
    const r = prerender.routes[route];
    const d = prerender.dynamicRoutes?.[route];
    let kind;
    if (r) kind = r.initialRevalidateSeconds === false ? 'static' : `ISR ${r.initialRevalidateSeconds}s`;
    else if (d) kind = d.fallbackRevalidate === false ? 'SSG' : 'SSG/ISR';
    else kind = 'DYNAMIC';
    rows.push(`  ${route.padEnd(32)} ${kind}`);
    if (kind === 'DYNAMIC' && !ALLOWED_DYNAMIC_ROUTES.includes(route)) {
      failures.push(`${route} renders per request; it must be static or ISR (did it call cookies()/headers() or use no-store?)`);
    }
  }
  console.log('Page routes after next build:\n' + rows.join('\n'));
  return 'build';
}

const mode = process.argv.includes('--build') ? checkBuild() : checkSource();
if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(1);
}
console.log(`PASS: static-rendering ${mode} checks.`);

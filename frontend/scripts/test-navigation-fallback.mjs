// getNavigation() failure policy (docs/reviews/dev-a-fix-nav-runtime-throw-2026-10-24.md):
// at runtime it must THROW so ISR keeps the last good page; only during
// `next build` (NEXT_PHASE=phase-production-build) may it fall back to the seed.
//
// Runs lib/navigation.ts for real (with lib/api.ts and the seed fixtures),
// transpiled on load with the TypeScript compiler. Only global fetch is stubbed.
import { registerHooks } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

registerHooks({
  resolve(specifier, context, next) {
    if ((specifier.startsWith('.') || specifier.startsWith('/')) && context.parentURL?.startsWith('file:')) {
      const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (/\.tsx?$/.test(url)) {
      const source = fs.readFileSync(fileURLToPath(url), 'utf8');
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: fileURLToPath(url),
      });
      return { format: 'module', source: outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

delete process.env.NEXT_PUBLIC_USE_MOCKS;
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test';

const { mockNavigationData } = await import(path.join(root, 'src/lib/mocks/navigation.ts'));
const { mockSettingsData } = await import(path.join(root, 'src/lib/mocks/settings.ts'));
const { getNavigation } = await import(path.join(root, 'src/lib/navigation.ts'));

const seedLabel = mockNavigationData.header[0].label;
const good = structuredClone(mockNavigationData);
good.header[0].label = 'GoodNavFromApi';

const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const stubs = {
  up: async (url) => json({ data: String(url).includes('/navigation') ? good : mockSettingsData }),
  down: async () => { throw new TypeError('fetch failed'); },
  serverError: async () => new Response(JSON.stringify({ error: { code: 'INTERNAL', message: 'boom' } }), { status: 500, headers: { 'content-type': 'application/json' } }),
  emptyData: async () => json({ data: null }),
};

const warn = console.warn;
let results = 0;
async function check(name, phase, stub, expect) {
  globalThis.fetch = stubs[stub];
  if (phase) process.env.NEXT_PHASE = phase; else delete process.env.NEXT_PHASE;
  console.warn = () => {};
  try {
    if (expect === 'throws') {
      await assert.rejects(getNavigation(), `${name}: getNavigation() must throw at runtime so ISR keeps the last good page`);
    } else {
      const nav = await getNavigation();
      assert.equal(nav.header.items[0].label, expect, `${name}: first header label`);
    }
  } finally {
    console.warn = warn;
  }
  results++;
  console.log(`  ok - ${name}`);
}

await check('runtime, API up: API navigation', undefined, 'up', 'GoodNavFromApi');
await check('runtime, network failure: throws', undefined, 'down', 'throws');
await check('runtime, HTTP 500: throws', undefined, 'serverError', 'throws');
await check('runtime, 200 with data null: throws', undefined, 'emptyData', 'throws');
await check('next start phase, network failure: throws', 'phase-production-server', 'down', 'throws');
await check('build, network failure: seed fallback', 'phase-production-build', 'down', seedLabel);
await check('build, 200 with data null: seed fallback', 'phase-production-build', 'emptyData', seedLabel);
await check('build, API up: API navigation', 'phase-production-build', 'up', 'GoodNavFromApi');

console.log(`PASS: ${results} navigation failure-policy checks.`);

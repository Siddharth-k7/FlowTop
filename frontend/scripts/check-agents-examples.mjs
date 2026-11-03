// Typechecks every ```ts / ```tsx block in frontend/AGENTS.md verbatim
// (docs/10-review-standards.md rule 6). Each block is written to a temporary
// file under src/ so the "@/..." path alias resolves, then `tsc --noEmit` runs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const blocks = [...md.matchAll(/^```(tsx?)\n([\s\S]*?)^```/gm)];
if (blocks.length === 0) {
  console.error('FAIL: no ts/tsx examples found in AGENTS.md');
  process.exit(1);
}
const dir = path.join(root, 'src', '__agents_examples__');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
blocks.forEach(([, lang, body], i) => fs.writeFileSync(path.join(dir, `example-${i + 1}.${lang}`), body));
const tsc = path.join(root, 'node_modules', '.bin', 'tsc');
const bin = fs.existsSync(tsc) ? tsc : path.join(root, '..', 'node_modules', '.bin', 'tsc');
const result = spawnSync(bin, ['--noEmit', '-p', root], { stdio: 'inherit' });
fs.rmSync(dir, { recursive: true, force: true });
if (result.status !== 0) {
  console.error(`FAIL: an AGENTS.md example does not typecheck (${blocks.length} checked)`);
  process.exit(1);
}
console.log(`PASS: ${blocks.length} AGENTS.md example(s) typecheck verbatim.`);

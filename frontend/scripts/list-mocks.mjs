#!/usr/bin/env node

/**
 * Lists all TODO(mock) and TODO(types) tags across the frontend and shared packages.
 *
 * Used to track pending API contract swap tasks and types needing promotion to shared/types.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

const targetDirs = [
  path.join(repoRoot, 'frontend/src'),
  path.join(repoRoot, 'packages/ui/src'),
];

function findFiles(dir, exts = ['.ts', '.tsx', '.mjs', '.js']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'dist'].includes(entry.name)) {
        files.push(...findFiles(full, exts));
      }
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = targetDirs.flatMap((d) => findFiles(d));

const mockTags = [];
const typeTags = [];

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('TODO(mock)')) {
      mockTags.push({ file: rel, line: idx + 1, text: line.trim() });
    }
    if (line.includes('TODO(types)')) {
      typeTags.push({ file: rel, line: idx + 1, text: line.trim() });
    }
  });
}

console.log('=====================================================');
console.log('       Flowtop TODO(mock) & TODO(types) Tracker      ');
console.log('=====================================================\n');

console.log(`📌 TODO(types) Pending Promotion to shared/types (${typeTags.length}):`);
if (typeTags.length === 0) {
  console.log('  None found.');
} else {
  typeTags.forEach((t) => {
    console.log(`  • ${t.file}:${t.line}`);
    console.log(`    ${t.text}`);
  });
}

console.log(`\n📌 TODO(mock) Fixtures for Swap Day (${mockTags.length}):`);
if (mockTags.length === 0) {
  console.log('  None found.');
} else {
  mockTags.forEach((m) => {
    console.log(`  • ${m.file}:${m.line}`);
    console.log(`    ${m.text}`);
  });
}

console.log('\n-----------------------------------------------------');
console.log(`Summary: ${typeTags.length} TODO(types) and ${mockTags.length} TODO(mock) tags indexed.`);
console.log('=====================================================\n');

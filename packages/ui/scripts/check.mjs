#!/usr/bin/env node

/**
 * Flowtop Design System Validation Script
 *
 * Verifies:
 * 1. Colour contrast ratios for token pairs match WCAG AA (>= 4.5:1 text, >= 3:1 focus ring).
 * 2. Zero hex colours exist outside packages/ui/src/tokens.css.
 * 3. Zero `any` types exist in TypeScript files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(uiRoot, '../..');

let hasErrors = false;

console.log('--- Checking Flowtop Design System & Code Quality ---\n');

// 1. Contrast Check
console.log('1. Verifying WCAG contrast ratios for semantic and text pairs...');

function getLuminance(hex) {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const rgb = [0, 2, 4].map(i => parseInt(cleaned.substr(i, 2), 16) / 255);
  const a = rgb.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrast(h1, h2) {
  const l1 = getLuminance(h1);
  const l2 = getLuminance(h2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

// Token values extracted from tokens.css
const tokens = {
  white: '#FFFFFF',
  purpleDeep: '#5B2A86',
  purpleLight: '#9B6FC4',
  purplePale: '#F4EEFA',
  ink: '#16121C',
  surface: '#F8F7FA',
  textMuted: '#635A73',
  success: '#1A6B43',
  successTint: '#E7F4EC',
  warning: '#8A5A00',
  warningTint: '#FCF3E2',
  error: '#B42335',
  errorTint: '#FCECEE',
  info: '#1E5A9E',
  infoTint: '#E8F0FA',
};

const contrastPairs = [
  { fg: tokens.ink, bg: tokens.white, label: 'text-primary on white', min: 4.5 },
  { fg: tokens.ink, bg: tokens.surface, label: 'text-primary on surface', min: 4.5 },
  { fg: tokens.textMuted, bg: tokens.white, label: 'text-muted on white', min: 4.5 },
  { fg: tokens.textMuted, bg: tokens.surface, label: 'text-muted on surface', min: 4.5 },
  { fg: tokens.white, bg: tokens.purpleDeep, label: 'on-primary on primary (white on purple-deep)', min: 4.5 },
  { fg: tokens.white, bg: tokens.ink, label: 'on-surface-inverse on surface-inverse (white on ink)', min: 4.5 },
  { fg: tokens.success, bg: tokens.white, label: 'success on white', min: 4.5 },
  { fg: tokens.success, bg: tokens.successTint, label: 'success on success-tint', min: 4.5 },
  { fg: tokens.warning, bg: tokens.white, label: 'warning on white', min: 4.5 },
  { fg: tokens.warning, bg: tokens.warningTint, label: 'warning on warning-tint', min: 4.5 },
  { fg: tokens.error, bg: tokens.white, label: 'error on white', min: 4.5 },
  { fg: tokens.error, bg: tokens.errorTint, label: 'error on error-tint', min: 4.5 },
  { fg: tokens.info, bg: tokens.white, label: 'info on white', min: 4.5 },
  { fg: tokens.info, bg: tokens.infoTint, label: 'info on info-tint', min: 4.5 },
  { fg: tokens.purpleLight, bg: tokens.white, label: 'focus-ring against white (UI target)', min: 3.0 },
  { fg: tokens.purpleLight, bg: tokens.ink, label: 'focus-ring against ink (UI target)', min: 3.0 },
];

contrastPairs.forEach(({ fg, bg, label, min }) => {
  const ratio = getContrast(fg, bg);
  const passed = ratio >= min;
  const ratioStr = ratio.toFixed(2) + ':1';
  if (!passed) {
    console.error(`  FAIL: ${label} ratio ${ratioStr} < required ${min}:1`);
    hasErrors = true;
  } else {
    console.log(`  PASS: ${label} (${ratioStr} >= ${min}:1)`);
  }
});

// 2. Hex check outside tokens.css
console.log('\n2. Checking for hex colours outside packages/ui/src/tokens.css...');

const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git', 'coverage'].includes(item.name)) {
        continue;
      }
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const checkTargets = [
  path.join(repoRoot, 'packages/ui'),
  path.join(repoRoot, 'frontend'),
];

let scannedFiles = [];
for (const target of checkTargets) {
  scannedFiles.push(...findFiles(target, ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css']));
}

let hexFoundCount = 0;
for (const file of scannedFiles) {
  const relPath = path.relative(repoRoot, file);
  // Exclude tokens.css and this check script itself
  if (relPath === 'packages/ui/src/tokens.css' || relPath === 'packages/ui/scripts/check.mjs') {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Ignore comments mentioning hex or examples if specifically marked
    if (line.includes('eslint-disable') || line.includes('swatchHex')) return;
    const matches = line.match(hexRegex);
    if (matches) {
      console.error(`  FAIL: Hex colour ${matches.join(', ')} in ${relPath}:${idx + 1}`);
      console.error(`    ${line.trim()}`);
      hexFoundCount++;
      hasErrors = true;
    }
  });
}

if (hexFoundCount === 0) {
  console.log(`  PASS: Zero hex colours found across ${scannedFiles.length} files outside tokens.css.`);
}

// 3. Any type check
console.log('\n3. Checking for `any` type usage in TypeScript files...');

const tsFiles = scannedFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const anyRegex = /(\bany\b)/g;

let anyFoundCount = 0;
for (const file of tsFiles) {
  const relPath = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    // Check type annotation usage like `: any`, `<any>`, `as any`, `Array<any>`
    if (/(\bas\s+any\b|:\s*any\b|<\s*any\s*>|Array<\s*any\s*>)/.test(line)) {
      console.error(`  FAIL: Prohibited \`any\` found in ${relPath}:${idx + 1}`);
      console.error(`    ${line.trim()}`);
      anyFoundCount++;
      hasErrors = true;
    }
  });
}

if (anyFoundCount === 0) {
  console.log(`  PASS: Zero \`any\` found across ${tsFiles.length} TypeScript files.`);
}

// 4. Style Guide Component Registry check
console.log('\n4. Checking Style Guide component registry completeness...');
const registryFile = path.join(repoRoot, 'frontend/src/app/style-guide/registry.ts');
if (!fs.existsSync(registryFile)) {
  console.error(`  FAIL: Style Guide registry file not found at ${registryFile}`);
  hasErrors = true;
} else {
  const registryContent = fs.readFileSync(registryFile, 'utf8');
  const registeredNames = new Set();
  const nameMatches = registryContent.matchAll(/name:\s*['"]([A-Za-z0-9_-]+)['"]/g);
  for (const m of nameMatches) {
    registeredNames.add(m[1]);
  }

  const indexFile = path.join(uiRoot, 'src/index.ts');
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  const componentExports = [...indexContent.matchAll(/export\s+\*\s+from\s+['"]\.\/components\/([A-Za-z0-9_-]+)['"]/g)].map(m => m[1]);

  let missingCount = 0;
  for (const compDir of componentExports) {
    const dirPath = path.join(uiRoot, 'src/components', compDir);
    const files = fs.readdirSync(dirPath);
    const tsxFiles = files.filter(f => f.endsWith('.tsx') && !f.includes('.test.') && !f.includes('.spec.'));
    for (const f of tsxFiles) {
      const compName = path.basename(f, '.tsx');
      if (!registeredNames.has(compName)) {
        console.error(`  FAIL: Component \`${compName}\` exported in ${compDir} but missing from Style Guide registry!`);
        missingCount++;
        hasErrors = true;
      }
    }
  }

  if (missingCount === 0) {
    console.log(`  PASS: All exported components (${registeredNames.size}) are present in the Style Guide registry.`);
  }
}

console.log('\n-----------------------------------------------------');
if (hasErrors) {
  console.error('Check failed with errors.');
  process.exit(1);
} else {
  console.log('All checks passed successfully.');
}


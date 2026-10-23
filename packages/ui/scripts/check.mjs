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
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(uiRoot, '..', '..');

/**
 * Normalises any file or directory path to a canonical file URL string.
 * This eliminates all differences in separators (\ vs /) and drive letters.
 */
function toCanonicalUrl(targetPath) {
  return pathToFileURL(path.resolve(targetPath)).href;
}

/**
 * Normalises any file or directory path to a canonical native filesystem path.
 */
function toCanonicalPath(targetPath) {
  return fileURLToPath(pathToFileURL(path.resolve(targetPath)));
}

/**
 * Checks if targetPath is inside dirPath (or equals dirPath)
 * without hardcoding or splitting on path separators.
 */
function isPathInside(targetPath, dirPath) {
  const normTarget = toCanonicalPath(targetPath);
  const normDir = toCanonicalPath(dirPath);
  if (normTarget === normDir) return true;
  const rel = path.relative(normDir, normTarget);
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Checks if any segment in the path hierarchy matches a given directory name
 * (e.g. 'node_modules', '.next', 'dist').
 * Traverses using path.dirname and path.basename so no separator splitting is needed.
 */
function hasDirectorySegment(targetPath, segmentName) {
  let current = toCanonicalPath(targetPath);
  while (true) {
    if (path.basename(current) === segmentName) {
      return true;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return false;
}

/**
 * Specifically checks if a path is inside a 'lib/mocks' directory hierarchy,
 * without splitting or comparing on "/" or "\".
 */
function isInsideLibMocks(targetPath) {
  let current = toCanonicalPath(targetPath);
  while (true) {
    const parent = path.dirname(current);
    if (parent === current) break;
    if (path.basename(current) === 'mocks' && path.basename(parent) === 'lib') {
      return true;
    }
    current = parent;
  }
  return false;
}

/**
 * Checks whether a given file is tokens.css, supporting any path separator.
 */
const tokensCssUrl = toCanonicalUrl(path.resolve(uiRoot, 'src', 'tokens.css'));
function isTokensCss(filePath) {
  return toCanonicalUrl(filePath) === tokensCssUrl;
}

/**
 * Checks whether a given path is inside node_modules, supporting any path separator.
 */
function isInsideNodeModules(filePath) {
  return hasDirectorySegment(filePath, 'node_modules');
}

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
  { fg: tokens.ink, bg: tokens.white, label: 'text-fg on white', min: 4.5 },
  { fg: tokens.ink, bg: tokens.surface, label: 'text-fg on surface', min: 4.5 },
  { fg: tokens.textMuted, bg: tokens.white, label: 'text-fg-muted on white', min: 4.5 },
  { fg: tokens.textMuted, bg: tokens.surface, label: 'text-fg-muted on surface', min: 4.5 },
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

const ignoredDirNames = new Set(['node_modules', '.next', 'dist', '.git', 'coverage']);

function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.resolve(dir, item.name);
    if (item.isDirectory()) {
      if (ignoredDirNames.has(item.name) || isInsideNodeModules(fullPath)) {
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
  path.resolve(repoRoot, 'packages', 'ui'),
  path.resolve(repoRoot, 'frontend'),
];

let scannedFiles = [];
for (const target of checkTargets) {
  scannedFiles.push(...findFiles(target, ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css']));
}

// Exclude files from hex colour validation strictly by PATH, never by line markers:
// 1. packages/ui/src/tokens.css - the design tokens definition file
// 2. packages/ui/scripts/check.mjs - the validation script itself (contains contrast check token fixtures)
// 3. frontend/src/lib/mocks (or any lib/mocks folder) - typed mock fixtures (e.g. finish swatch hex data)
const hexExclusionList = [
  path.resolve(uiRoot, 'src', 'tokens.css'),
  toCanonicalPath(__filename),
  path.resolve(repoRoot, 'frontend', 'src', 'lib', 'mocks'),
];

function isExcludedFromHexCheck(filePath) {
  if (isTokensCss(filePath)) return true;
  for (const excludedPath of hexExclusionList) {
    if (isPathInside(filePath, excludedPath)) {
      return true;
    }
  }
  if (isInsideLibMocks(filePath)) {
    return true;
  }
  return false;
}

let hexFoundCount = 0;
for (const file of scannedFiles) {
  if (isExcludedFromHexCheck(file)) {
    continue;
  }
  const relPath = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
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
const registryFile = path.resolve(repoRoot, 'frontend', 'src', 'app', 'style-guide', 'registry.ts');
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

  const indexFile = path.resolve(uiRoot, 'src', 'index.ts');
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  const componentExports = [...indexContent.matchAll(/export\s+\*\s+from\s+['"]\.\/components\/([A-Za-z0-9_-]+)['"]/g)].map(m => m[1]);

  let missingCount = 0;
  for (const compDir of componentExports) {
    const dirPath = path.resolve(uiRoot, 'src', 'components', compDir);
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

  // 4b. Verify required variants and states are present on the Style Guide page
  const showcaseFile = path.resolve(repoRoot, 'frontend', 'src', 'app', 'style-guide', 'ComponentShowcase.tsx');
  if (!fs.existsSync(showcaseFile)) {
    console.error(`  FAIL: ComponentShowcase.tsx not found at ${showcaseFile}`);
    hasErrors = true;
  } else {
    const showcaseContent = fs.readFileSync(showcaseFile, 'utf8');

    const entryRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"]([\s\S]*?)\},/g;
    let entryMatch;
    let missingCoverageCount = 0;

    while ((entryMatch = entryRegex.exec(registryContent)) !== null) {
      const compId = entryMatch[1];
      const compName = entryMatch[2];
      const rest = entryMatch[3];

      const varMatch = rest.match(/requiredVariants:\s*\[([^\]]*)\]/);
      const stateMatch = rest.match(/requiredStates:\s*\[([^\]]*)\]/);

      const variants = varMatch
        ? varMatch[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean)
        : [];
      const states = stateMatch
        ? stateMatch[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean)
        : [];

      // Check Button variants and states
      if (compId === 'button') {
        for (const v of variants) {
          const varRegex = new RegExp(`variant=['"]${v}['"]`);
          if (!varRegex.test(showcaseContent)) {
            console.error(`  FAIL: ${compName} missing variant "${v}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
        for (const st of states) {
          const [v, stateType] = st.split('-');
          const vStateRegex = new RegExp(`variant=['"]${v}['"][^>]*\\b${stateType}\\b`);
          if (!vStateRegex.test(showcaseContent)) {
            console.error(`  FAIL: ${compName} missing ${st} state on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }

      // Check Table states
      if (compId === 'table') {
        for (const st of states) {
          let found = false;
          if (st === 'sorting-asc') {
            found = /sortDirection=['"]asc['"]/.test(showcaseContent) || /tableSortDir/.test(showcaseContent);
          } else if (st === 'sorting-desc') {
            found = /sortDirection=['"]desc['"]/.test(showcaseContent) || /tableSortDir/.test(showcaseContent);
          } else if (st === 'sorting-none') {
            found = /aria-sort=['"]none['"]/.test(showcaseContent) || /sortColumn=\{undefined\}/.test(showcaseContent);
          } else if (st === 'loading') {
            found = /<Table[\s\S]*?\bloading=\{true\}/.test(showcaseContent);
          } else if (st === 'empty') {
            found = /<Table[\s\S]*?\bemptyState=/.test(showcaseContent);
          }
          if (!found) {
            console.error(`  FAIL: Table missing state "${st}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }

      // Check Tabs states
      if (compId === 'tabs') {
        for (const st of states) {
          let found = false;
          if (st === 'disabled') {
            found = /disabled:\s*true/.test(showcaseContent) || /<Tab[^>]*\bdisabled\b/.test(showcaseContent);
          } else if (st === 'active' || st === 'inactive') {
            found = /defaultValue=['"]specs['"]/.test(showcaseContent) || /<Tab\b/.test(showcaseContent);
          }
          if (!found) {
            console.error(`  FAIL: Tabs missing state "${st}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }

      // Check Card variants
      if (compId === 'card') {
        for (const v of variants) {
          const varRegex = new RegExp(`variant=['"]${v}['"]`);
          if (!varRegex.test(showcaseContent)) {
            console.error(`  FAIL: Card missing variant "${v}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }

      // Check Badge variants
      if (compId === 'badge') {
        for (const v of variants) {
          const varRegex = new RegExp(`variant=['"]${v}['"]`);
          if (!varRegex.test(showcaseContent)) {
            console.error(`  FAIL: Badge missing variant "${v}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }

      // Check Drawer variants
      if (compId === 'drawer') {
        for (const v of variants) {
          const varRegex = new RegExp(`(position|side)=['"]${v}['"]`);
          if (!varRegex.test(showcaseContent)) {
            console.error(`  FAIL: Drawer missing position "${v}" on /style-guide page!`);
            missingCoverageCount++;
            hasErrors = true;
          }
        }
      }
    }

    if (missingCoverageCount === 0) {
      console.log(`  PASS: All documented component variants and states are present on the Style Guide page.`);
    }
  }
}

// 5. Breakpoints Single Source of Truth & Consistency Check
console.log('\n5. Checking Breakpoints single source & consistency...');

const tokensPath = path.resolve(uiRoot, 'src', 'tokens.css');
if (!fs.existsSync(tokensPath)) {
  console.error(`  FAIL: tokens.css not found at ${tokensPath}`);
  hasErrors = true;
} else {
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');
  const cssBreakpoints = {};
  const bpRegex = /--breakpoint-([a-z0-9]+):\s*([0-9]+)px;/g;
  let bpMatch;
  while ((bpMatch = bpRegex.exec(tokensContent)) !== null) {
    cssBreakpoints[bpMatch[1]] = parseInt(bpMatch[2], 10);
  }

  const REQUIRED_BREAKPOINTS = ['xs', 'md', 'lg', 'xl'];
  const missingInCss = REQUIRED_BREAKPOINTS.filter(bp => !(bp in cssBreakpoints));
  if (missingInCss.length > 0) {
    console.error(`  FAIL: Missing required breakpoint(s) in tokens.css: ${missingInCss.join(', ')}`);
    hasErrors = true;
  } else {
    console.log(`  PASS: tokens.css defines all required breakpoints (${REQUIRED_BREAKPOINTS.join(', ')}).`);
  }

  // Verify preset loads screens from tokens.css and matches exactly
  try {
    const presetPath = path.resolve(uiRoot, 'tailwind-preset.cjs');
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const preset = require(presetPath);
    const presetScreens = preset.theme?.extend?.screens ?? preset.theme?.screens;
    if (!presetScreens) {
      console.error('  FAIL: Preset screens not defined in theme.extend or theme.');
      hasErrors = true;
    } else {
      let presetMatches = true;
      for (const [bp, val] of Object.entries(cssBreakpoints)) {
        if (presetScreens[bp] !== `${val}px`) {
          console.error(`  FAIL: Preset screen mismatch for ${bp}: expected ${val}px, got ${presetScreens[bp]}`);
          presetMatches = false;
          hasErrors = true;
        }
      }
      if (presetMatches) {
        console.log('  PASS: tailwind-preset.cjs screens match tokens.css exactly.');
      }
    }

    // Verify preset throws a clear error if a breakpoint is missing
    let threwOnMissing = false;
    try {
      preset.getBreakpoints('--breakpoint-xs: 360px;');
    } catch (e) {
      if (e.message.includes('Missing required breakpoint(s) in tokens.css')) {
        threwOnMissing = true;
      }
    }
    if (threwOnMissing) {
      console.log('  PASS: tailwind-preset.cjs throws clear error on missing breakpoint.');
    } else {
      console.error('  FAIL: tailwind-preset.cjs did not throw when a required breakpoint was missing.');
      hasErrors = true;
    }
  } catch (err) {
    console.error(`  FAIL: Error testing tailwind-preset.cjs screens: ${err.message}`);
    hasErrors = true;
  }

  // Verify index.ts BREAKPOINTS export matches tokens.css
  const indexPath = path.resolve(uiRoot, 'src', 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('export const BREAKPOINTS')) {
      const matchObj = indexContent.match(/export const BREAKPOINTS = \{([^}]+)\}/s);
      if (matchObj) {
        const bpLines = matchObj[1].split('\n');
        const tsBreakpoints = {};
        for (const line of bpLines) {
          const m = line.match(/([a-z0-9]+):\s*([0-9]+)/);
          if (m) {
            tsBreakpoints[m[1]] = parseInt(m[2], 10);
          }
        }

        let tsMatches = true;
        for (const [bp, val] of Object.entries(cssBreakpoints)) {
          if (tsBreakpoints[bp] !== val) {
            console.error(`  FAIL: index.ts BREAKPOINTS.${bp} (${tsBreakpoints[bp]}) does not match tokens.css (${val})`);
            tsMatches = false;
            hasErrors = true;
          }
        }
        for (const bp of Object.keys(tsBreakpoints)) {
          if (!(bp in cssBreakpoints)) {
            console.error(`  FAIL: index.ts BREAKPOINTS has unexpected breakpoint "${bp}" not in tokens.css`);
            tsMatches = false;
            hasErrors = true;
          }
        }
        if (tsMatches) {
          console.log('  PASS: index.ts BREAKPOINTS equals tokens.css.');
        }
      }
    }
  }
}

console.log('\n-----------------------------------------------------');
if (hasErrors) {
  console.error('Check failed with errors.');
  process.exit(1);
} else {
  console.log('All checks passed successfully.');
}



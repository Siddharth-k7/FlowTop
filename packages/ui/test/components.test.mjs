import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(uiRoot, '..', '..');

const componentsMdPath = path.resolve(uiRoot, 'COMPONENTS.md');
const cacheDir = path.resolve(uiRoot, 'node_modules', '.cache', 'components-docs-test');

function extractSnippets() {
  const content = fs.readFileSync(componentsMdPath, 'utf8');
  const lines = content.split('\n');

  const snippets = [];
  let currentHeading = 'Top-level';
  let inBlock = false;
  let blockStartLine = 0;
  let blockLines = [];
  let snippetCount = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!inBlock && trimmed.startsWith('## ')) {
      currentHeading = trimmed;
    }

    if (trimmed === '```tsx') {
      inBlock = true;
      blockStartLine = lineNum;
      blockLines = [];
    } else if (inBlock && trimmed === '```') {
      inBlock = false;
      snippetCount++;
      snippets.push({
        index: snippetCount,
        filename: `snippet_${snippetCount}.tsx`,
        heading: currentHeading,
        lineNumber: blockStartLine,
        code: blockLines.join('\n'),
      });
      blockLines = [];
    } else if (inBlock) {
      blockLines.push(line);
    }
  });

  return snippets;
}

describe('COMPONENTS.md Code Snippets Validation', () => {
  const snippets = extractSnippets();
  const errorsByFile = new Map();

  before(() => {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Read real packages/ui tsconfig settings
    const uiTsConfig = JSON.parse(
      fs.readFileSync(path.resolve(uiRoot, 'tsconfig.json'), 'utf8')
    );

    // Build temporary tsconfig with exact compilerOptions plus required path mappings
    const testTsConfig = {
      compilerOptions: {
        ...uiTsConfig.compilerOptions,
        noEmit: true,
        paths: {
          '@flowtop/ui': [path.resolve(uiRoot, 'src', 'index.ts')],
          'next/link': [path.resolve(repoRoot, 'frontend', 'node_modules', 'next', 'link.d.ts')],
        },
      },
      include: ['*.tsx'],
    };

    fs.writeFileSync(
      path.join(cacheDir, 'tsconfig.json'),
      JSON.stringify(testTsConfig, null, 2)
    );

    // Write each snippet to its own isolated module file
    for (const snippet of snippets) {
      fs.writeFileSync(path.join(cacheDir, snippet.filename), snippet.code);
    }

    // Execute tsc --noEmit
    const tscBin = path.resolve(uiRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    try {
      execSync(`node "${tscBin}" -p "${path.join(cacheDir, 'tsconfig.json')}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err) {
      const output = String(err.stdout || err.stderr || err.message || '');
      // Group errors by file
      const errorLines = output.split('\n');
      for (const line of errorLines) {
        for (const snippet of snippets) {
          if (line.includes(snippet.filename)) {
            const existing = errorsByFile.get(snippet.filename) || '';
            errorsByFile.set(snippet.filename, existing ? `${existing}\n${line}` : line);
          }
        }
      }
      // If output exists but was not mapped to a specific snippet, record in a global key
      if (errorsByFile.size === 0 && output.trim()) {
        errorsByFile.set('__all__', output.trim());
      }
    }
  });

  after(() => {
    // Clean up temporary files
    try {
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  it('verifies that snippets were found in COMPONENTS.md', () => {
    assert.ok(snippets.length > 0, 'No ```tsx code blocks found in COMPONENTS.md');
  });

  for (const snippet of snippets) {
    it(`${snippet.heading} (COMPONENTS.md:${snippet.lineNumber})`, () => {
      const error = errorsByFile.get(snippet.filename) || errorsByFile.get('__all__');
      if (error) {
        assert.fail(
          `\nSnippet failed TypeScript check:\n` +
          `  Heading: ${snippet.heading}\n` +
          `  Location: packages/ui/COMPONENTS.md:${snippet.lineNumber}\n` +
          `  Error:\n${error}\n`
        );
      }
    });
  }
});

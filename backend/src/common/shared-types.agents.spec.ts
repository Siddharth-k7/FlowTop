import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * shared/types/AGENTS.md shows Dev C and Dev D a working example. This test
 * typechecks that block exactly as written, against shared/types/src/index.ts,
 * so the documentation cannot describe a type that is not there.
 */
const sharedDir = join(__dirname, '..', '..', '..', 'shared', 'types');
const sharedIndex = join(sharedDir, 'src', 'index.ts');
const agents = readFileSync(join(sharedDir, 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n');

function documentedExample(name: string): string {
  const marker = `<!-- example: ${name} -->\n\`\`\`ts\n`;
  const start = agents.indexOf(marker);
  if (start === -1) {
    throw new Error(`shared/types/AGENTS.md has no "${marker.trim()}" block`);
  }
  const codeStart = start + marker.length;
  return agents.slice(codeStart, agents.indexOf('\n```', codeStart));
}

/** Typechecks `source` as if it were a file in an app that depends on @flowtop/types. */
function diagnosticsFor(source: string): string[] {
  const fileName = join(sharedDir, 'example.ts');
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  host.readFile = (name) => (name === fileName ? source : readFile(name));
  host.fileExists = (name) => name === fileName || fileExists(name);
  host.getSourceFile = (name, languageVersion) => {
    const text = host.readFile(name);
    return text === undefined ? undefined : ts.createSourceFile(name, text, languageVersion, true);
  };
  host.resolveModuleNameLiterals = (literals) =>
    literals.map((literal) =>
      literal.text === '@flowtop/types'
        ? { resolvedModule: { resolvedFileName: sharedIndex, extension: ts.Extension.Ts } }
        : { resolvedModule: undefined },
    );

  const program = ts.createProgram([fileName], options, host);
  return ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

describe('shared/types/AGENTS.md example', () => {
  it('typechecks exactly as written', () => {
    expect(diagnosticsFor(documentedExample('catalog'))).toEqual([]);
  });

  it('is not vacuous: a field that does not exist is reported', () => {
    const wrong = `import type { ProductCard } from '@flowtop/types';\nexport const x = (card: ProductCard) => card.categorySlug;\n`;

    expect(diagnosticsFor(wrong)).toEqual([expect.stringContaining("Property 'categorySlug' does not exist")]);
  });
});

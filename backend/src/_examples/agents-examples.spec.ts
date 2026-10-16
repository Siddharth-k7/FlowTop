import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * backend/AGENTS.md shows Dev B five examples. Each one is a real file in this
 * folder: typechecked, linted and exercised by test/dev-b-imports.e2e-spec.ts.
 * This test makes the documentation itself the thing under test: if a code
 * block in AGENTS.md differs from its file by one character, it fails.
 *
 * To change an example, edit the file here, then paste it into AGENTS.md
 * under its <!-- example: ... --> marker.
 */
const backendDir = join(__dirname, '..', '..');
const agents = readFileSync(join(backendDir, 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n');
const exampleFiles = readdirSync(__dirname).filter((name) => name.endsWith('.example.ts'));

function documentedBlock(file: string): string | undefined {
  const marker = `<!-- example: src/_examples/${file} -->\n\`\`\`ts\n`;
  const start = agents.indexOf(marker);
  if (start === -1) {
    return undefined;
  }
  const codeStart = start + marker.length;
  return agents.slice(codeStart, agents.indexOf('\n```', codeStart));
}

describe('AGENTS.md examples', () => {
  it('documents all five examples and nothing that is not a real file', () => {
    expect(exampleFiles.sort()).toEqual([
      'audit.example.ts',
      'pagination.example.ts',
      'permission-list.example.ts',
      'record-access.example.ts',
      'route-protection.example.ts',
    ]);
    const markers = [...agents.matchAll(/<!-- example: src\/_examples\/([^ ]+) -->/g)].map((match) => match[1]);
    expect(markers.sort()).toEqual(exampleFiles.sort());
  });

  it.each(exampleFiles)('shows %s exactly as the file is', (file) => {
    const source = readFileSync(join(__dirname, file), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');

    expect(documentedBlock(file)).toBe(source);
  });
});

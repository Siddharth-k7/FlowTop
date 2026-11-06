import { csvCell, toCsv } from './csv';

describe('orders CSV', () => {
  it('prefixes formula characters so a spreadsheet does not execute them', () => {
    expect(csvCell('=cmd')).toBe(`"'=cmd"`);
    expect(csvCell('+1')).toBe(`"'+1"`);
    expect(csvCell('safe')).toBe('"safe"');
    const csv = toCsv(['name'], [['=cmd']]);
    expect(csv.startsWith('"name"\n"\'=cmd"')).toBe(true);
  });
});

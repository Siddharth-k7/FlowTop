/** RFC 4180 cell. A leading = + - or @ is prefixed so a spreadsheet does not treat it as a formula. */
export function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
}

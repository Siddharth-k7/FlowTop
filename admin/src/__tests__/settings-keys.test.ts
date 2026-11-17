import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seedSettings } from '@/lib/mocks/seed';

const root = join(__dirname, '..', '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
/** The keys of SETTING_DEFINITIONS, in order, read from the backend's own file. */
const backendKeys = [...read('backend/src/settings/setting-definitions.ts').matchAll(/^ {2}'([\w.]+)': define/gm)].map((m) => m[1] as string);

describe('settings keys (B2)', () => {
  it('finds the backend keys at all, so the checks below are not vacuous', () => expect(backendKeys.length).toBeGreaterThanOrEqual(8));
  it('mock settings carry exactly the backend keys, in the backend order', () => expect(seedSettings.map((s) => s.key)).toEqual(backendKeys));
  it('the Settings screen lists no key by hand: it renders what GET /admin/settings returns', () => {
    const screen = read('admin/src/components/screens/Settings.tsx');
    const PREVIEW_ONLY = ['whatsapp.number', 'whatsapp.productTemplate']; // read for the message preview, not to build the form
    for (const key of backendKeys.filter((k) => !PREVIEW_ONLY.includes(k))) expect(screen).not.toContain(`'${key}'`);
    for (const invented of ['emailFrom', 'orderRecipients', 'whatsappNumber', 'purchaseAssistanceRecipients']) expect(screen).not.toContain(invented);
  });
});

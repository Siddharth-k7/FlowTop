import { describe, expect, it } from 'vitest';
import { LAYOUT_FIELDS, SECTIONS, getPath, setPath } from '@/lib/sections';
import { CONTENT_TYPES } from '@/lib/content-types';

describe('page builder sections', () => {
  it('offers the 12 section types from the audit report', () => expect(Object.keys(SECTIONS)).toHaveLength(12));
  it('has no free-text styling: every layout option is a dropdown of presets', () => {
    expect(LAYOUT_FIELDS.every((f) => f.type === 'select' && (f.options?.length ?? 0) > 1)).toBe(true);
    const all = [...Object.values(SECTIONS).flatMap((s) => s.fields), ...CONTENT_TYPES.flatMap((c) => c.fields)];
    for (const f of all.filter((f) => f.key !== 'styleTags' && /style|css|class|colou?r/i.test(f.key))) expect(f.type).toBe('select'); // cardStyle etc: presets only. styleTags is content (room tags), not styling
  });
  it('writes dotted keys into the nested config the contract defines', () => {
    const c = setPath({ layout: { width: 'wide' } }, 'layout.align', 'center');
    expect(getPath(c, 'layout.align')).toBe('center');
    expect(getPath(c, 'layout.width')).toBe('wide');
    expect(getPath(setPath({}, 'cta.label', 'Go'), 'cta.label')).toBe('Go');
  });
});

import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '@flowtop/types';

vi.mock('@/lib/api', () => ({
  api: () => new Promise(() => {}),
  ApiError: class extends Error {},
  USE_MOCKS: false,
}));

const { SectionEditor } = await import('@/components/builder/SectionEditor');
const { errorsForSection } = await import('@/lib/section-errors');
const { numberInputValue, selectInputValue } = await import('@/components/ui/SchemaForm');
const { pageBody } = await import('@/lib/page-body');

const hero: Section = {
  id: 'sec-hero',
  type: 'hero',
  position: 1,
  visible: true,
  config: { headline: 'Hi', videoUrl: 'javascript:alert(1)', layout: { background: 'white' } },
};

describe('section editor field errors', () => {
  it('shows the videoUrl error next to the video link input', () => {
    const html = renderToStaticMarkup(createElement(SectionEditor, {
      section: hero,
      errors: { videoUrl: 'Use a site path or an https, mailto or tel link.' },
      onChange: () => undefined,
    }));
    expect(html).toContain('Video link');
    expect(html).toContain('Use a site path or an https, mailto or tel link.');
    expect(html).toContain('role="alert"');
  });

  it('does not send null when How many is cleared, or an empty string when Choose is picked', () => {
    expect(numberInputValue('')).toBeUndefined();
    expect(numberInputValue('8')).toBe(8);
    expect(selectInputValue('', false)).toBeUndefined();
    expect(selectInputValue('image', false)).toBe('image');
    expect(selectInputValue('3', true)).toBe(3);
    const source = readFileSync(new URL('../components/ui/SchemaForm.tsx', import.meta.url), 'utf8');
    expect(source).toContain('onChange={(e) => onChange(f.key, numberInputValue(e.target.value))}');
    expect(source).toContain('onChange={(e) => onChange(f.key, selectInputValue(e.target.value, f.numeric))}');
    expect(source).not.toContain("e.target.value === '' ? null : Number(e.target.value)");
  });

  it('maps a create-page field path onto that section only', () => {
    const errors = {
      'sections[1].videoUrl': 'Use a site path or an https, mailto or tel link.',
      slug: 'This web address is already in use.',
    };
    expect(errorsForSection(errors, 1)).toEqual({ videoUrl: 'Use a site path or an https, mailto or tel link.' });
    expect(errorsForSection(errors, 0)).toEqual({});
    expect(errorsForSection({ videoUrl: 'Bad link.', title: 'Give the page a title.' }, 0)).toEqual({ videoUrl: 'Bad link.' });
  });

  it('sends sections only on the first save of a new page', () => {
    const page = { id: 'new', title: 'Launch', slug: 'launch', status: 'draft' as const, seo: { title: '', description: '', canonical: null, shareImage: null }, sections: [{ id: 'temp', type: 'hero', position: 1, visible: true, config: { headline: 'Hi' } }] };
    expect(pageBody(page).sections).toEqual([{ type: 'hero', visible: true, config: { headline: 'Hi' } }]);
    expect(pageBody({ ...page, id: 'page-1' }).sections).toBeUndefined();
  });
});

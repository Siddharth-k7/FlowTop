import { ApiException } from '../common/errors/api.exception';

const ONE_OF: Record<string, readonly string[]> = {
  'layout.background': ['white', 'pale', 'deep', 'black', 'image'],
  'layout.spacingTop': ['none', 'small', 'medium', 'large'],
  'layout.spacingBottom': ['none', 'small', 'medium', 'large'],
  'layout.width': ['contained', 'wide', 'full'],
  'layout.align': ['left', 'center', 'right'],
  mediaType: ['image', 'video'],
  overlay: ['none', 'light', 'medium', 'strong'],
  textPosition: ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'],
  imageSide: ['left', 'right'],
  ratio: ['50-50', '60-40', '40-60'],
  mobileOrder: ['image-first', 'text-first'],
  source: ['placement', 'manual', 'rule'],
  cardStyle: ['standard', 'compact', 'editorial'],
  variant: ['split', 'stacked', 'overlay', 'grid', 'masonry', 'slider'],
  mode: ['button', 'download'],
};

const walk = (value: unknown, path: string, fields: Record<string, string>) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key;
    const allowed = ONE_OF[here] ?? ONE_OF[key];
    const text = typeof inner === 'string' || typeof inner === 'number' ? String(inner) : '';
    if (allowed && text && !allowed.includes(text)) fields[here] = `Choose one of: ${allowed.join(', ')}.`;
    if (key === 'columns' && text && ![2, 3, 4].includes(Number(text))) fields[here] = 'Columns are 2, 3 or 4.';
    if (key === 'style' && text && !['primary', 'secondary'].includes(text)) fields[here] = 'Choose primary or secondary.';
    if (inner && typeof inner === 'object') walk(inner, here, fields);
  }
};

/** Rejects preset values outside the contract. Unknown keys are kept; enums are not. */
export function assertSectionConfig(config: unknown): void {
  const fields: Record<string, string> = {};
  walk(config, '', fields);
  if (Object.keys(fields).length) throw new ApiException('VALIDATION_FAILED', 'That layout is not one of the approved presets.', fields);
}

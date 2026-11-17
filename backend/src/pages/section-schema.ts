import { isSafeLink } from '../common/safe-href';

type Node =
  | { t: 'text' }
  | { t: 'enum'; values: readonly string[] }
  | { t: 'url' }
  | { t: 'bool' }
  | { t: 'columns' }
  | { t: 'count' }
  | { t: 'strings' }
  | { t: 'object'; fields: Record<string, Node> }
  | { t: 'list'; of: Node };

const text: Node = { t: 'text' };
const url: Node = { t: 'url' };
const layout: Node = {
  t: 'object',
  fields: {
    background: { t: 'enum', values: ['white', 'pale', 'deep', 'black', 'image'] },
    spacingTop: { t: 'enum', values: ['none', 'small', 'medium', 'large'] },
    spacingBottom: { t: 'enum', values: ['none', 'small', 'medium', 'large'] },
    width: { t: 'enum', values: ['contained', 'wide', 'full'] },
    align: { t: 'enum', values: ['left', 'center', 'right'] },
  },
};
const button: Node = {
  t: 'object',
  fields: {
    label: text,
    href: url,
    style: { t: 'enum', values: ['primary', 'secondary'] },
  },
};
const buttons: Node = { t: 'list', of: button };

/** Keys of each section, in the same set as the shared config types. URL fields are `href`, `videoUrl`, and `viewAllHref` only. */
export const SECTION_FIELDS = {
  hero: ['headline', 'subheading', 'mediaType', 'desktopImageId', 'mobileImageId', 'videoUrl', 'overlay', 'textPosition', 'ctas', 'layout'],
  product_carousel: ['heading', 'source', 'placementLocation', 'productIds', 'rule', 'count', 'cardStyle', 'viewAllHref', 'layout'],
  collection_showcase: ['collectionId', 'coverImageId', 'description', 'productIds', 'variant', 'layout'],
  image_text: ['heading', 'body', 'imageId', 'mobileImageId', 'imageSide', 'ratio', 'mobileOrder', 'cta', 'layout'],
  gallery: ['heading', 'imageIds', 'variant', 'columns', 'showCaptions', 'layout'],
  cta: ['heading', 'body', 'mode', 'cta', 'documentId', 'layout'],
} as const;

const position = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;

export const SECTION_SCHEMA: Record<keyof typeof SECTION_FIELDS, Node> = {
  hero: { t: 'object', fields: {
    headline: text, subheading: text, mediaType: { t: 'enum', values: ['image', 'video'] }, desktopImageId: text, mobileImageId: text,
    videoUrl: url, overlay: { t: 'enum', values: ['none', 'light', 'medium', 'strong'] }, textPosition: { t: 'enum', values: position }, ctas: buttons, layout,
  } },
  product_carousel: { t: 'object', fields: {
    heading: text, source: { t: 'enum', values: ['placement', 'manual', 'rule'] }, placementLocation: text, productIds: { t: 'strings' },
    rule: { t: 'object', fields: { type: { t: 'enum', values: ['newest'] }, categoryId: text } }, count: { t: 'count' },
    cardStyle: { t: 'enum', values: ['standard', 'compact', 'editorial'] }, viewAllHref: url, layout,
  } },
  collection_showcase: { t: 'object', fields: {
    collectionId: text, coverImageId: text, description: text, productIds: { t: 'strings' },
    variant: { t: 'enum', values: ['split', 'stacked', 'overlay'] }, layout,
  } },
  image_text: { t: 'object', fields: {
    heading: text, body: text, imageId: text, mobileImageId: text, imageSide: { t: 'enum', values: ['left', 'right'] },
    ratio: { t: 'enum', values: ['50-50', '60-40', '40-60'] }, mobileOrder: { t: 'enum', values: ['image-first', 'text-first'] }, cta: button, layout,
  } },
  gallery: { t: 'object', fields: {
    heading: text, imageIds: { t: 'strings' }, variant: { t: 'enum', values: ['grid', 'masonry', 'slider'] }, columns: { t: 'columns' }, showCaptions: { t: 'bool' }, layout,
  } },
  cta: { t: 'object', fields: { heading: text, body: text, mode: { t: 'enum', values: ['button', 'download'] }, cta: button, documentId: text, layout } },
};

export function checkSection(type: string, config: unknown, fields: Record<string, string>): void {
  const schema = SECTION_SCHEMA[type as keyof typeof SECTION_FIELDS];
  if (!schema) {
    fields.type = 'That section type is not one of the six.';
    return;
  }
  check(schema, config, '', fields);
}

function check(node: Node, value: unknown, path: string, fields: Record<string, string>): void {
  if (value === undefined) return;
  if (value === null || value === '') {
    if (node.t === 'url' || node.t === 'text' || node.t === 'object') return;
    fields[path || 'config'] = 'That value is not allowed.';
    return;
  }
  if (node.t === 'text') {
    if (typeof value !== 'string') fields[path] = 'That value is not allowed.';
    return;
  }
  if (node.t === 'enum') {
    if (typeof value !== 'string' || !node.values.includes(value)) fields[path] = `Choose one of: ${node.values.join(', ')}.`;
    return;
  }
  if (node.t === 'url') {
    if (!isSafeLink(value, true)) fields[path] = 'Use a site path or an https, mailto or tel link.';
    return;
  }
  if (node.t === 'bool') {
    if (typeof value !== 'boolean') fields[path] = 'That value is not allowed.';
    return;
  }
  if (node.t === 'columns') {
    if (typeof value !== 'number' || !Number.isInteger(value) || ![2, 3, 4].includes(value)) fields[path] = 'Columns are 2, 3 or 4.';
    return;
  }
  if (node.t === 'count') {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) fields[path] = 'That value is not allowed.';
    return;
  }
  if (node.t === 'strings') {
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) fields[path] = 'That value is not allowed.';
    return;
  }
  if (node.t === 'list') {
    if (!Array.isArray(value)) { fields[path] = 'That value is not allowed.'; return; }
    value.forEach((item, index) => check(node.of, item, `${path}[${index}]`, fields));
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fields[path || 'config'] = 'That value is not allowed.';
    return;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const child = node.fields[key];
    const here = path ? `${path}.${key}` : key;
    if (!child) { fields[here] = 'That field is not part of this section.'; continue; }
    check(child, record[key], here, fields);
  }
}

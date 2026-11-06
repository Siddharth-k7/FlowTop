import { opts, type Field } from '@/lib/fields';

/**
 * The six section types in docs/03-api-contract.md (Section config shapes), field for field.
 * Changing a shape is a contract PR that Dev B, C and D review, not a commit here.
 *
 * Styling is ONLY ever a dropdown of approved presets. There is no colour, CSS or class-name field.
 * Keys with a dot ("layout.width", "cta.label") write into the nested object the contract defines.
 */
export const LAYOUT_FIELDS: Field[] = [
  { key: 'layout.background', label: 'Background', type: 'select', options: opts('white', 'pale', 'deep', 'black', 'image') },
  { key: 'layout.spacingTop', label: 'Space above', type: 'select', options: opts('none', 'small', 'medium', 'large') },
  { key: 'layout.spacingBottom', label: 'Space below', type: 'select', options: opts('none', 'small', 'medium', 'large') },
  { key: 'layout.width', label: 'Width', type: 'select', options: opts('contained', 'wide', 'full') },
  { key: 'layout.align', label: 'Alignment', type: 'select', options: opts('left', 'center', 'right') },
];
export const DEFAULT_LAYOUT = { background: 'white', spacingTop: 'medium', spacingBottom: 'medium', width: 'contained', align: 'left' };

const POS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const heading: Field = { key: 'heading', label: 'Heading', type: 'text' };

export interface SectionDef { label: string; hint: string; fields: Field[] }
export const SECTIONS: Record<string, SectionDef> = {
  hero: { label: 'Hero banner', hint: 'Large image or video with a headline and buttons.', fields: [
    { key: 'headline', label: 'Headline', type: 'text', required: true }, { key: 'subheading', label: 'Sub-heading', type: 'text' },
    { key: 'mediaType', label: 'Media', type: 'select', options: opts('image', 'video') }, { key: 'desktopImageId', label: 'Desktop image', type: 'media' }, { key: 'mobileImageId', label: 'Mobile image', type: 'media' },
    { key: 'videoUrl', label: 'Video link', type: 'text' }, { key: 'overlay', label: 'Darkening over image', type: 'select', options: opts('none', 'light', 'medium', 'strong') },
    { key: 'textPosition', label: 'Text position', type: 'select', options: opts(...POS) }, { key: 'ctas', label: 'Buttons', type: 'ctas' }] },
  image_text: { label: 'Image and text', hint: 'Editorial block with a picture beside text.', fields: [
    heading, { key: 'body', label: 'Text', type: 'textarea' }, { key: 'imageId', label: 'Image', type: 'media' }, { key: 'mobileImageId', label: 'Mobile image', type: 'media' },
    { key: 'imageSide', label: 'Image side', type: 'select', options: opts('left', 'right') }, { key: 'ratio', label: 'Image to text ratio', type: 'select', options: [{ value: '50-50', label: '50 / 50' }, { value: '60-40', label: '60 / 40' }, { value: '40-60', label: '40 / 60' }] },
    { key: 'mobileOrder', label: 'On phones show', type: 'select', options: opts('image-first', 'text-first') }, { key: 'cta.label', label: 'Button label', type: 'text' }, { key: 'cta.href', label: 'Button link', type: 'text' }] },
  product_carousel: { label: 'Product carousel', hint: 'A scrolling row of products.', fields: [
    heading, { key: 'source', label: 'Products come from', type: 'select', options: [{ value: 'placement', label: 'A placement (set per product)' }, { value: 'manual', label: 'Hand-picked' }, { value: 'rule', label: 'A rule' }] },
    { key: 'placementLocation', label: 'Placement', type: 'select', options: opts('featured', 'new_arrivals', 'bestsellers', 'recommended') }, { key: 'productIds', label: 'Hand-picked products', type: 'refList', of: 'products' },
    { key: 'rule.type', label: 'Rule', type: 'select', options: opts('newest') }, { key: 'rule.categoryId', label: 'Limit to category', type: 'ref', of: 'categories' },
    { key: 'count', label: 'How many', type: 'number' }, { key: 'cardStyle', label: 'Card style', type: 'select', options: opts('standard', 'compact', 'editorial') }, { key: 'viewAllHref', label: '"View all" link', type: 'text' }] },
  collection_showcase: { label: 'Collection showcase', hint: 'Spotlight on one collection.', fields: [
    { key: 'collectionId', label: 'Collection', type: 'ref', of: 'collections', required: true }, { key: 'coverImageId', label: 'Cover image', type: 'media' }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'productIds', label: 'Featured products', type: 'refList', of: 'products' }, { key: 'variant', label: 'Style', type: 'select', options: opts('split', 'stacked', 'overlay') }] },
  gallery: { label: 'Gallery', hint: 'Grid, masonry or slider of images.', fields: [
    heading, { key: 'imageIds', label: 'Images', type: 'mediaList' }, { key: 'variant', label: 'Style', type: 'select', options: opts('grid', 'masonry', 'slider') },
    { key: 'columns', label: 'Columns', type: 'select', numeric: true, options: opts('2', '3', '4') }, { key: 'showCaptions', label: 'Show captions', type: 'toggle', hint: 'Show each image caption' }] },
  cta: { label: 'Call to action', hint: 'A prompt with a button, a download or a form.', fields: [
    heading, { key: 'body', label: 'Text', type: 'textarea' }, { key: 'mode', label: 'Action', type: 'select', options: opts('button', 'download') },
    { key: 'cta.label', label: 'Button label', type: 'text' }, { key: 'cta.href', label: 'Button link', type: 'text' }, { key: 'documentId', label: 'File to download', type: 'media' }] },
};
export const SECTION_TYPES = Object.keys(SECTIONS);

export const defaultConfig = (type: string): Record<string, unknown> => ({ layout: { ...DEFAULT_LAYOUT }, ...(type === 'product_carousel' ? { source: 'placement', placementLocation: 'featured', count: 8, cardStyle: 'standard' } : {}) });

export const TEMPLATES: { id: string; label: string; types: string[] }[] = [
  { id: 'blank', label: 'Blank page', types: [] },
  { id: 'campaign', label: 'Campaign launch (hero, products, call to action)', types: ['hero', 'product_carousel', 'cta'] },
  { id: 'collection', label: 'Collection story (hero, showcase, gallery)', types: ['hero', 'collection_showcase', 'gallery'] },
];

/** Dotted-path helpers so the editor can write into nested config (layout.*, cta.*, rule.*). */
export function getPath(o: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), o);
}
export function setPath(o: Record<string, unknown>, path: string, v: unknown): Record<string, unknown> {
  const [k, ...rest] = path.split('.') as [string, ...string[]];
  if (!rest.length) return { ...o, [k]: v };
  return { ...o, [k]: setPath((o[k] as Record<string, unknown>) ?? {}, rest.join('.'), v) };
}

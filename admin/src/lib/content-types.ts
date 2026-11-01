import type { Field } from '@/components/ui/SchemaForm';
import { opts } from '@/components/ui/SchemaForm';

/**
 * Every simple content screen is described here once: list columns, form fields, wording.
 * The PDF-driven types (resources, inspiration, exhibitions, FAQs, synonyms, style finder,
 * finish care, filter attributes) are PROPOSED shapes. See admin/SECTION-SHAPES.md.
 */
export interface ContentType {
  section: string; title: string; singular: string; titleKey: string; emptyText: string;
  columns: { key: string; label: string }[]; fields: Field[]; hasStatus?: boolean; deleteNote: string; permission: string; group: 'catalogue' | 'content' | 'discovery';
}
const slug: Field = { key: 'slug', label: 'Web address', type: 'text', required: true, hint: 'Lowercase letters and dashes, e.g. opel-basin-mixer' };

export const CONTENT_TYPES: ContentType[] = [
  { section: 'collections', title: 'Collections', singular: 'collection', titleKey: 'name', group: 'catalogue', permission: 'product:write', hasStatus: true,
    emptyText: 'No collections yet. A collection groups products that belong together, like Opel.',
    columns: [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The collection page disappears from the site. The products in it are not deleted and keep their other placements.',
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }, slug, { key: 'heroImageId', label: 'Hero image', type: 'media' },
      { key: 'story', label: 'Story', type: 'textarea', hint: 'Shown on the collection page.' },
      { key: 'productIds', label: 'Products (order = ranking)', type: 'refList', of: 'products' }] },
  { section: 'journal', title: 'Journal', singular: 'article', titleKey: 'title', group: 'content', permission: 'journal:write', hasStatus: true,
    emptyText: 'No articles yet. Write the first one to share a story or a how-to.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The article is removed from the Journal. Products it mentions are not affected.',
    fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, slug, { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'coverImageId', label: 'Cover image', type: 'media', required: true }, { key: 'excerpt', label: 'Short summary', type: 'textarea' }, { key: 'body', label: 'Article', type: 'textarea', required: true }] },
  { section: 'resources', title: 'Resource library', singular: 'resource', titleKey: 'title', group: 'content', permission: 'page:write',
    emptyText: 'No downloads yet. Add manuals, brochures and CAD files visitors can download.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }],
    deleteNote: 'The download disappears from the Resource Library and from any page section that lists it. The file stays in Media.',
    fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'category', label: 'Category', type: 'select', required: true, options: opts('Manuals', 'Brochures', 'CAD / BIM', 'Specifications', 'Care guides') },
      { key: 'fileId', label: 'File', type: 'media', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'productIds', label: 'Related products', type: 'refList', of: 'products' }] },
  { section: 'inspiration', title: 'Inspiration', singular: 'inspiration look', titleKey: 'title', group: 'content', permission: 'page:write', hasStatus: true,
    emptyText: 'No looks yet. Add a styled room and tag the products visitors can shop.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The look disappears from Inspiration. The tagged products are not affected.',
    fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'imageId', label: 'Room photo', type: 'media', required: true },
      { key: 'styleTags', label: 'Style tags', type: 'stringList' }, { key: 'hotspots', label: 'Shop this look: tagged products', type: 'hotspots' }] },
  { section: 'exhibitions', title: 'Exhibitions', singular: 'exhibition', titleKey: 'title', group: 'content', permission: 'page:write', hasStatus: true,
    emptyText: 'No exhibitions yet. Add an upcoming show with its dates and booth.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'startDate', label: 'Starts' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The exhibition page is removed. Showcased products are not affected.',
    fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'startDate', label: 'Starts', type: 'date', required: true }, { key: 'endDate', label: 'Ends', type: 'date', required: true },
      { key: 'venue', label: 'Venue', type: 'text' }, { key: 'hall', label: 'Hall', type: 'text' }, { key: 'booth', label: 'Booth', type: 'text' },
      { key: 'coverImageId', label: 'Cover image', type: 'media' }, { key: 'productIds', label: 'Showcased products', type: 'refList', of: 'products' }] },
  { section: 'faqs', title: 'FAQs', singular: 'question', titleKey: 'question', group: 'content', permission: 'page:write',
    emptyText: 'No questions yet. Add the answers your customers keep asking for.',
    columns: [{ key: 'question', label: 'Question' }, { key: 'category', label: 'Category' }],
    deleteNote: 'The question is removed from the Support page and from any page section that shows it.',
    fields: [{ key: 'question', label: 'Question', type: 'text', required: true }, { key: 'category', label: 'Category', type: 'select', required: true, options: opts('Care', 'Warranty', 'Installation', 'Orders', 'Products') },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true }, { key: 'productIds', label: 'Link to products', type: 'refList', of: 'products' }] },
  { section: 'synonyms', title: 'Search synonyms', singular: 'synonym', titleKey: 'term', group: 'discovery', permission: 'page:write',
    emptyText: 'No synonyms yet. Teach search that "faucet" means "mixer".',
    columns: [{ key: 'term', label: 'When visitors type' }, { key: 'mapsTo', label: 'Also search for' }],
    deleteNote: 'Search stops treating this word as a match for the other. Products are not affected.',
    fields: [{ key: 'term', label: 'When visitors type', type: 'text', required: true }, { key: 'mapsTo', label: 'Also search for', type: 'text', required: true }, { key: 'featured', label: 'Suggest this term in search', type: 'toggle', hint: 'Featured search term' }] },
  { section: 'style-rules', title: 'Style Finder', singular: 'question rule', titleKey: 'question', group: 'discovery', permission: 'page:write',
    emptyText: 'No rules yet. Each rule links a quiz answer to a product attribute.',
    columns: [{ key: 'question', label: 'Question' }, { key: 'answerLabel', label: 'Answer' }, { key: 'weight', label: 'Weight' }],
    deleteNote: 'The quiz stops using this answer. Recommendations change at once, no deploy needed.',
    fields: [{ key: 'question', label: 'Question shown to visitors', type: 'text', required: true }, { key: 'answerLabel', label: 'Answer label', type: 'text', required: true },
      { key: 'attributeKey', label: 'Matches attribute', type: 'ref', of: 'attributes', required: true, hint: 'Pick a product attribute' }, { key: 'attributeValue', label: 'Attribute value', type: 'text', required: true },
      { key: 'weight', label: 'Weight (1 to 5)', type: 'number', required: true }, { key: 'order', label: 'Question order', type: 'number' }] },
  { section: 'finish-care', title: 'Finishes and care', singular: 'finish', titleKey: 'finish', group: 'discovery', permission: 'page:write',
    emptyText: 'No finishes yet. Describe each finish and how to look after it.',
    columns: [{ key: 'finish', label: 'Finish' }],
    deleteNote: 'The finish page and its care do and dont lists are removed. Products in this finish are not affected.',
    fields: [{ key: 'finish', label: 'Finish name', type: 'text', required: true }, { key: 'macroImageId', label: 'Close-up photo', type: 'media' }, { key: 'story', label: 'About this finish', type: 'textarea', required: true },
      { key: 'patina', label: 'How it ages', type: 'textarea' }, { key: 'dos', label: 'Care: do', type: 'stringList' }, { key: 'donts', label: 'Care: do not', type: 'stringList' }] },
  { section: 'attributes', title: 'Product filters', singular: 'attribute', titleKey: 'name', group: 'discovery', permission: 'product:write',
    emptyText: 'No attributes yet. Add one to make it a filter on the product listing.',
    columns: [{ key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'filterable', label: 'Filter' }],
    deleteNote: 'Visitors lose this filter. Values already entered on products are kept.',
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'key', label: 'Key', type: 'text', required: true, hint: 'Lowercase with underscores, e.g. spout_height' },
      { key: 'type', label: 'Type', type: 'select', required: true, options: opts('number', 'choice', 'text') }, { key: 'unit', label: 'Unit', type: 'text' }, { key: 'filterable', label: 'Show as a filter', type: 'toggle', hint: 'Visitors can filter by this' }] },
];
export const contentType = (section: string) => CONTENT_TYPES.find((c) => c.section === section);

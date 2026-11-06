import type { Permission } from '@flowtop/types';
import type { Field } from '@/lib/fields';
import type { Doc } from '@/lib/doc';

/**
 * Every simple content screen is described here once: list columns, form fields, wording.
 * Only content types with a contract in docs/03-api-contract.md live here. A new type starts as a
 * contract PR that Dev A, B, C and D review, not as an admin screen.
 */
export interface ContentType {
  section: string; title: string; singular: string; titleKey: string; emptyText: string;
  columns: { key: string; label: string }[]; fields: Field[]; hasStatus?: boolean; deleteNote: string; permission: Permission; /** Create, edit and delete. */ write: Permission; /** Publish. */ publish: Permission; group: 'catalogue' | 'content';
  /** Journal uses POST .../publish. Collections send status on PATCH. */
  publishVia?: 'post' | 'status';
  toBody?: (doc: Doc) => unknown;
}
const slug: Field = { key: 'slug', label: 'Web address', type: 'text', required: true, hint: 'Lowercase letters and dashes, e.g. opel-basin-mixer' };

export const CONTENT_TYPES: ContentType[] = [
  { section: 'collections', title: 'Collections', singular: 'collection', titleKey: 'name', group: 'catalogue', permission: 'collection:read', write: 'collection:write', publish: 'collection:write', hasStatus: true,
    emptyText: 'No collections yet. A collection groups products that belong together, like Opel.',
    columns: [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The collection page disappears from the site. The products in it are not deleted and keep their other placements.',
    publishVia: 'status',
    toBody: (d) => ({ name: d.name, slug: d.slug, story: d.story ?? '', description: d.description ?? null, heroMediaId: d.heroMediaId || null, ...(d.status ? { status: d.status } : {}) }),
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }, slug, { key: 'heroMediaId', label: 'Hero image', type: 'media' },
      { key: 'story', label: 'Story', type: 'textarea', hint: 'Shown on the collection page.' },
      { key: 'productIds', label: 'Products (order = ranking)', type: 'refList', of: 'products' }] },
  { section: 'journal', title: 'Journal', singular: 'article', titleKey: 'title', group: 'content', permission: 'journal:read', write: 'journal:write', publish: 'journal:publish', hasStatus: true,
    emptyText: 'No articles yet. Write the first one to share a story or a how-to.',
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' }],
    deleteNote: 'The article is removed from the Journal. Products it mentions are not affected.',
    publishVia: 'post',
    toBody: (d) => ({ title: d.title, slug: d.slug, category: d.category || null, excerpt: d.excerpt ?? '', body: d.body ?? '', heroImageId: d.heroImageId || null }),
    fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, slug, { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'heroImageId', label: 'Cover image', type: 'media', required: true }, { key: 'excerpt', label: 'Short summary', type: 'textarea' }, { key: 'body', label: 'Article', type: 'textarea', required: true }] },
];
export const contentType = (section: string) => CONTENT_TYPES.find((c) => c.section === section);

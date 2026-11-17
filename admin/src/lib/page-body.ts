import type { CreatePageBody, Page, SectionTypeName } from '@flowtop/types';

/** The page fields the API accepts. A new page also sends its sections, so one request creates both. */
export function pageBody(page: Page): CreatePageBody {
  const body: CreatePageBody = {
    title: page.title,
    slug: page.slug,
    seoTitle: page.seo.title,
    seoDescription: page.seo.description,
    seoCanonical: page.seo.canonical,
  };
  if (page.id !== 'new') return body;
  body.sections = page.sections.map((section) => ({
    type: section.type as SectionTypeName,
    visible: section.visible,
    config: section.config,
  }));
  return body;
}

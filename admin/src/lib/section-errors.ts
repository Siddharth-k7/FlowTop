const PAGE_FIELDS = new Set(['title', 'slug', 'seoTitle', 'seoDescription', 'seoCanonical', 'status']);

/**
 * Field errors for one section.
 * A page create prefixes them `sections[0].videoUrl`. A single-section save uses `videoUrl`.
 * Page fields (title, slug) stay on the page settings form.
 */
export function errorsForSection(errors: Record<string, string>, index: number): Record<string, string> {
  const prefix = `sections[${index}].`;
  const indexed = Object.keys(errors).some((key) => key.startsWith('sections['));
  const out: Record<string, string> = {};
  if (indexed) {
    for (const [key, message] of Object.entries(errors)) {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = message;
    }
    return out;
  }
  for (const [key, message] of Object.entries(errors)) {
    if (!PAGE_FIELDS.has(key)) out[key] = message;
  }
  return out;
}

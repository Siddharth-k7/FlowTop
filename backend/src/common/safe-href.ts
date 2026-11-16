/** External menu destinations. Section button links use this, plus a same-site path. */
export const EXTERNAL_HREF = /^(https?:\/\/\S+|mailto:\S+|tel:\+?[0-9 ()-]+)$/i;

/** A path on this site, such as /collections/opel. Not a protocol-relative URL. */
const SITE_PATH = /^\/(?!\/)\S*$/;

/**
 * A section href may be an external link or a site path.
 * `javascript:` and `data:` are rejected, including with whitespace before the colon.
 */
export function isSafeSectionHref(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (/javascript\s*:/i.test(value) || /data\s*:/i.test(value)) return false;
  return EXTERNAL_HREF.test(value) || SITE_PATH.test(value);
}

import { ApiException } from '../common/errors/api.exception';
import { checkSection } from './section-schema';

/**
 * The summary is the line the editor shows in the save bar. It has to name the
 * field that failed. A single sentence about layouts was wrong for videoUrl,
 * count, mediaType and every other field.
 */
export function sectionFailureSummary(fields: Record<string, string>): string {
  const entries = Object.entries(fields);
  if (entries.length === 0) return 'That section could not be saved.';
  const [only] = entries;
  if (entries.length === 1 && only) {
    const [path, message] = only;
    return `${path}: ${message}`;
  }
  return `Check ${entries.map(([path]) => path).join(', ')}.`;
}

/** Checks a section config against that type's schema. Unknown keys are rejected. */
export function assertSectionConfig(type: string, config: unknown): void {
  const fields: Record<string, string> = {};
  checkSection(type, config, fields);
  if (Object.keys(fields).length) throw new ApiException('VALIDATION_FAILED', sectionFailureSummary(fields), fields);
}

/**
 * Checks every section on a new page before any row is written.
 * Field paths are `sections[0].videoUrl` so the editor can put the message on that input.
 */
export function assertPageSections(sections: { type: string; config: unknown }[]): void {
  const fields: Record<string, string> = {};
  sections.forEach((section, index) => {
    const one: Record<string, string> = {};
    checkSection(section.type, section.config, one);
    for (const [key, message] of Object.entries(one)) fields[`sections[${index}].${key}`] = message;
  });
  if (Object.keys(fields).length) throw new ApiException('VALIDATION_FAILED', sectionFailureSummary(fields), fields);
}

/** Creating sections needs section:write. page:write alone is not enough. */
export function assertCanAttachSections(permissions: readonly string[], count: number): void {
  if (count > 0 && !permissions.includes('section:write')) {
    throw new ApiException('FORBIDDEN', 'You do not have permission to add sections.');
  }
}

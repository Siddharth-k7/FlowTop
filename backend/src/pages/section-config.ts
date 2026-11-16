import { ApiException } from '../common/errors/api.exception';
import { checkSection } from './section-schema';

/**
 * Checks a section config against that type's schema. Unknown keys are rejected.
 * Preset fields are the schema's enums, so a value inside an array is checked the
 * same way as one at the top. URL fields are href, videoUrl, and viewAllHref.
 */
export function assertSectionConfig(type: string, config: unknown): void {
  const fields: Record<string, string> = {};
  checkSection(type, config, fields);
  if (Object.keys(fields).length) throw new ApiException('VALIDATION_FAILED', 'That layout is not one of the approved presets.', fields);
}

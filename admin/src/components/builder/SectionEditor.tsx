'use client';
import { SchemaForm, type Values } from '@/components/ui/SchemaForm';
import { LAYOUT_FIELDS, SECTIONS, getPath, setPath } from '@/lib/sections';
import type { Section } from '@/types/cms';

/** Content fields per section type, then layout presets. Every layout option is a dropdown. */
export function SectionEditor({ section, onChange }: { section: Section; onChange: (config: Record<string, unknown>) => void }) {
  const def = SECTIONS[section.type];
  if (!def) return <p className="text-sm">This section type is not known to the editor. It will be kept as it is.</p>;
  const fields = [...def.fields, ...LAYOUT_FIELDS];
  const flat: Values = Object.fromEntries(fields.map((f) => [f.key, getPath(section.config, f.key)]));
  return (
    <div className="flex flex-col gap-3">
      <div><h3 className="font-semibold">{def.label}</h3><p className="text-xs text-grey-500">{def.hint}</p></div>
      <SchemaForm compact key={section.id} idPrefix={`s-${section.id}`} fields={fields} value={flat} onChange={(k, v) => onChange(setPath(section.config, k, v))} />
    </div>
  );
}

// Plain module (no 'use client') so server code, like the nav, can read the field definitions.
export type FieldType = 'text' | 'textarea' | 'number' | 'price' | 'select' | 'toggle' | 'date' | 'media' | 'mediaList' | 'ref' | 'refList' | 'stringList' | 'hotspots' | 'ctas';
export interface Field {
  key: string; label: string; type: FieldType; required?: boolean; hint?: string;
  options?: { value: string; label: string }[]; of?: string; placeholder?: string; numeric?: boolean;
}
export const opts = (...v: string[]) => v.map((value) => ({ value, label: value.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase()) }));
export type Values = Record<string, unknown>;


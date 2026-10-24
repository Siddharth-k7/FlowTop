import type { ReactNode } from 'react';

/** Label + control + field-level error tied together with aria-describedby. */
export function FormField({ id, label, error, hint, children }: {
  id: string; label: string; error?: string; hint?: string;
  children: (a: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}) {
  const descId = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children({ id, 'aria-describedby': descId, 'aria-invalid': error ? true : undefined })}
      {descId && <p id={descId} className={`text-sm ${error ? 'text-error' : 'text-grey-500'}`}>{error ?? hint}</p>}
    </div>
  );
}

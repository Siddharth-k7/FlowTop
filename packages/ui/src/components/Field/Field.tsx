import React, { useId } from 'react';

export interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode | ((props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    required?: boolean;
  }) => React.ReactNode);
}

export function getFieldDescribedBy(
  id: string,
  hint?: React.ReactNode,
  error?: string
): string | undefined {
  const parts: string[] = [];
  if (hint) parts.push(`${id}-hint`);
  if (error) parts.push(`${id}-error`);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

export const Field: React.FC<FieldProps> = ({
  id: explicitId,
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}) => {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const describedBy = getFieldDescribedBy(id, hint, error);

  return (
    <div className={`flex flex-col gap-space-1 w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-small font-medium text-primary flex items-center gap-space-1 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {typeof children === 'function'
        ? children({
            id,
            'aria-describedby': describedBy,
            'aria-invalid': Boolean(error),
            required,
          })
        : children}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="text-caption text-error font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

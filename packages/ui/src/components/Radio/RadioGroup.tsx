import React, { useId, useState } from 'react';
import { RadioGroupContext } from './RadioGroupContext';

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name: explicitName,
  value: controlledValue,
  defaultValue,
  onChange,
  label,
  hint,
  error,
  orientation = 'vertical',
  disabled = false,
  required = false,
  className = '',
  children,
}) => {
  const generatedId = useId();
  const name = explicitName || generatedId;
  const labelId = label ? `${generatedId}-label` : undefined;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;

  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (val: string) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onChange?.(val);
  };

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-required={required}
      aria-invalid={Boolean(error)}
      className={`flex flex-col gap-space-2 ${className}`}
    >
      {(label || hint) && (
        <div className="flex flex-col gap-space-1">
          {label && (
            <span id={labelId} className="text-small font-medium text-text-primary">
              {label}
              {required && <span className="text-error ml-space-1" aria-hidden="true">*</span>}
            </span>
          )}
          {hint && (
            <span id={hintId} className="text-caption text-text-muted">
              {hint}
            </span>
          )}
        </div>
      )}

      <div
        className={
          orientation === 'horizontal'
            ? 'flex flex-row flex-wrap gap-space-5'
            : 'flex flex-col gap-space-2'
        }
      >
        <RadioGroupContext.Provider
          value={{
            name,
            value: currentValue,
            onChange: handleValueChange,
            disabled,
          }}
        >
          {children}
        </RadioGroupContext.Provider>
      </div>

      {error && (
        <p id={errorId} className="text-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

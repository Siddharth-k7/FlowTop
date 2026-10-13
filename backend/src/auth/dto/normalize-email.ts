import { Transform } from 'class-transformer';

/** Emails are stored lowercase, so every lookup trims and lowercases the input first. */
export function NormalizeEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
}

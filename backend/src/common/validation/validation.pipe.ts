import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiException } from '../errors/api.exception';
import { ErrorFields } from '../errors/error-code';

/**
 * Global DTO validation. Unknown properties are rejected, not silently dropped,
 * and failures come back as 422 VALIDATION_FAILED with a message per field.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new ApiException('VALIDATION_FAILED', 'Some fields need attention.', flattenValidationErrors(errors)),
  });
}

/** Flattens nested class-validator errors into { "delivery.pin": "message" }, first message per field. */
export function flattenValidationErrors(errors: ValidationError[], parentPath = ''): ErrorFields {
  const fields: ErrorFields = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const [firstMessage] = Object.values(error.constraints ?? {});

    if (firstMessage) {
      fields[path] = firstMessage;
    }
    if (error.children?.length) {
      Object.assign(fields, flattenValidationErrors(error.children, path));
    }
  }

  return fields;
}

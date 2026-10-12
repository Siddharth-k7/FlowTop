import { HttpException } from '@nestjs/common';
import { ERROR_STATUS, ErrorCode, ErrorFields } from './error-code';

/**
 * Throw this from any service to return a contract error envelope.
 *
 *   throw new ApiException('CONFLICT', 'This SKU is already in use', { sku: 'This SKU is already in use' });
 *
 * The message is shown to the user, so keep it human and free of internals.
 */
export class ApiException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: ErrorFields,
  ) {
    super(message, ERROR_STATUS[code]);
  }
}

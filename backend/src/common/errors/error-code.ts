import { HttpStatus } from '@nestjs/common';

/** The error codes from docs/03-api-contract.md, and the one status each carries. */
export const ERROR_STATUS = {
  /** The request could not be read: malformed JSON, a malformed id, a broken upload. */
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  /** Signed in, but must finish MFA setup before anything else (super admins, IAM-04). */
  MFA_SETUP_REQUIRED: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  /** The body is over the size limit (uploads: 25 MB). */
  PAYLOAD_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  /** The request was read, but a field's value is not acceptable. 422 only. */
  VALIDATION_FAILED: HttpStatus.UNPROCESSABLE_ENTITY,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  /** A dependency is down, for example the database behind /health. */
  SERVICE_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type ErrorFields = Record<string, string>;

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: ErrorFields;
  };
}

import { HttpStatus } from '@nestjs/common';

/** The error codes from docs/03-api-contract.md, and the status each one carries. */
export const ERROR_STATUS = {
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  /** Signed in, but must finish MFA setup before anything else (super admins, IAM-04). */
  MFA_SETUP_REQUIRED: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  VALIDATION_FAILED: HttpStatus.UNPROCESSABLE_ENTITY,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  CONFLICT: HttpStatus.CONFLICT,
  SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
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

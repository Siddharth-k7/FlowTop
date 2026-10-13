import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiException } from './api.exception';
import { ErrorBody, ErrorCode, ErrorFields } from './error-code';
import { RateLimitedException } from './rate-limited.exception';

const GENERIC_SERVER_MESSAGE = 'Something went wrong on our side. Please try again.';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

export interface ErrorResponse {
  status: number;
  body: ErrorBody;
  headers?: Record<string, string>;
}

/**
 * Turns anything thrown into the contract envelope { error: { code, message, fields } }.
 * Unknown errors become a generic 500: no stack, no SQL, no internal path reaches the client.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body, headers } = toErrorResponse(exception);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const response = host.switchToHttp().getResponse<Response>();
    if (headers) {
      response.set(headers);
    }
    response.status(status).json(body);
  }
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof RateLimitedException) {
    return {
      ...envelope(exception.getStatus(), exception.code, exception.message),
      headers: { 'Retry-After': String(exception.retryAfterSeconds) },
    };
  }

  if (exception instanceof ApiException) {
    return envelope(exception.getStatus(), exception.code, exception.message, exception.fields);
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return envelope(status, codeForStatus(status), exception.message);
  }

  return (
    fromPrismaError(exception) ??
    envelope(HttpStatus.INTERNAL_SERVER_ERROR, 'SERVER_ERROR', GENERIC_SERVER_MESSAGE)
  );
}

function codeForStatus(status: number): ErrorCode {
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  // The contract has no code for other 4xx (malformed JSON, payload too large),
  // so they keep their real status and report as a validation failure.
  return CODE_BY_STATUS[status] ?? 'VALIDATION_FAILED';
}

/**
 * Maps the Prisma errors a repository can reasonably hit. Duck-typed so this
 * file does not depend on the generated client.
 */
function fromPrismaError(exception: unknown): ErrorResponse | undefined {
  if (!isPrismaKnownError(exception)) {
    return undefined;
  }

  switch (exception.code) {
    case 'P2002': {
      const message = 'This value is already in use.';
      const target = exception.meta?.target;
      const fields = Array.isArray(target)
        ? Object.fromEntries(target.map((field) => [String(field), message]))
        : undefined;
      return envelope(HttpStatus.CONFLICT, 'CONFLICT', message, fields);
    }
    case 'P2003':
      return envelope(HttpStatus.CONFLICT, 'CONFLICT', 'This record is still referenced elsewhere.');
    case 'P2025':
      return envelope(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'The requested record was not found.');
    default:
      return undefined;
  }
}

interface PrismaKnownError {
  code: string;
  meta?: { target?: unknown };
}

function isPrismaKnownError(value: unknown): value is PrismaKnownError {
  return (
    value instanceof Error &&
    value.name === 'PrismaClientKnownRequestError' &&
    typeof (value as Partial<PrismaKnownError>).code === 'string'
  );
}

function envelope(status: number, code: ErrorCode, message: string, fields?: ErrorFields): ErrorResponse {
  return { status, body: { error: { code, message, ...(fields ? { fields } : {}) } } };
}

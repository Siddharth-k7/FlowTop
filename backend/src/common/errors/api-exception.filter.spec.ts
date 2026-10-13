import { BadRequestException, ForbiddenException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiException } from './api.exception';
import { toErrorResponse } from './api-exception.filter';
import { RateLimitedException } from './rate-limited.exception';

function prismaError(code: string, meta?: Record<string, unknown>): Error {
  const error = new Error('Raw Prisma message with SQL and internals');
  error.name = 'PrismaClientKnownRequestError';
  return Object.assign(error, { code, meta });
}

describe('toErrorResponse', () => {
  it('passes an ApiException through with its code, message and fields', () => {
    const result = toErrorResponse(new ApiException('CONFLICT', 'This SKU is already in use', { sku: 'Taken' }));

    expect(result).toEqual({
      status: 409,
      body: { error: { code: 'CONFLICT', message: 'This SKU is already in use', fields: { sku: 'Taken' } } },
    });
  });

  it('maps Nest HTTP exceptions to the contract codes', () => {
    expect(toErrorResponse(new NotFoundException()).body.error.code).toBe('NOT_FOUND');
    expect(toErrorResponse(new ForbiddenException()).body.error.code).toBe('FORBIDDEN');
    expect(toErrorResponse(new HttpException('Slow down', HttpStatus.UNAUTHORIZED)).body.error.code).toBe(
      'UNAUTHENTICATED',
    );
    expect(toErrorResponse(new HttpException('Slow down', HttpStatus.TOO_MANY_REQUESTS)).body.error.code).toBe(
      'RATE_LIMITED',
    );
  });

  it('adds a Retry-After header to a rate limit', () => {
    const result = toErrorResponse(new RateLimitedException(42));

    expect(result.status).toBe(429);
    expect(result.body.error.code).toBe('RATE_LIMITED');
    expect(result.headers).toEqual({ 'Retry-After': '42' });
  });

  it('keeps the real status for a 4xx the contract does not name', () => {
    const result = toErrorResponse(new BadRequestException('Malformed JSON'));

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('hides the details of an unknown error behind a generic 500', () => {
    const result = toErrorResponse(new Error('connect ECONNREFUSED 10.0.0.5:5432 at /srv/app/dist/main.js'));

    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe('SERVER_ERROR');
    expect(JSON.stringify(result.body)).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|\/srv\/app/);
  });

  it('never leaks a thrown non-Error value', () => {
    const result = toErrorResponse('SELECT * FROM "user"');

    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain('SELECT');
  });

  it('maps a Prisma unique violation to 409 with the offending fields', () => {
    const result = toErrorResponse(prismaError('P2002', { target: ['sku'] }));

    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe('CONFLICT');
    expect(result.body.error.fields).toEqual({ sku: 'This value is already in use.' });
    expect(JSON.stringify(result.body)).not.toContain('SQL');
  });

  it('maps a Prisma foreign key violation to 409 and a missing record to 404', () => {
    expect(toErrorResponse(prismaError('P2003')).status).toBe(409);
    expect(toErrorResponse(prismaError('P2025')).status).toBe(404);
  });

  it('treats an unmapped Prisma error as a generic 500', () => {
    const result = toErrorResponse(prismaError('P1001'));

    expect(result.status).toBe(500);
    expect(result.body.error.message).not.toContain('Prisma');
  });
});

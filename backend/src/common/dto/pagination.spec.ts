import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { pageToSkipTake, paginate, PaginationQueryDto } from './pagination';

function parse(query: Record<string, string>) {
  const dto = plainToInstance(PaginationQueryDto, query);
  return { dto, errors: validateSync(dto).map((error) => error.property) };
}

describe('PaginationQueryDto', () => {
  it('defaults to page 1 of 25', () => {
    expect(parse({}).dto).toEqual({ page: 1, perPage: 25 });
  });

  it('converts query strings to numbers', () => {
    const { dto, errors } = parse({ page: '3', perPage: '50' });

    expect(errors).toEqual([]);
    expect(dto).toEqual({ page: 3, perPage: 50 });
  });

  it('refuses more than 100 per page, page 0 and non-numbers', () => {
    expect(parse({ perPage: '10000' }).errors).toEqual(['perPage']);
    expect(parse({ page: '0' }).errors).toEqual(['page']);
    expect(parse({ page: 'abc' }).errors).toEqual(['page']);
  });
});

describe('paginate', () => {
  it('builds the contract envelope', () => {
    expect(paginate(['a', 'b'], 142, { page: 1, perPage: 25 })).toEqual({
      data: ['a', 'b'],
      meta: { page: 1, perPage: 25, total: 142, totalPages: 6 },
    });
  });

  it('reports 0 pages for an empty list and keeps the total past the last page', () => {
    expect(paginate([], 0, { page: 1, perPage: 25 }).meta.totalPages).toBe(0);
    expect(paginate([], 30, { page: 9, perPage: 25 }).meta).toEqual({ page: 9, perPage: 25, total: 30, totalPages: 2 });
  });
});

describe('pageToSkipTake', () => {
  it('maps a page to Prisma skip and take', () => {
    expect(pageToSkipTake({ page: 1, perPage: 25 })).toEqual({ skip: 0, take: 25 });
    expect(pageToSkipTake({ page: 3, perPage: 10 })).toEqual({ skip: 20, take: 10 });
  });
});

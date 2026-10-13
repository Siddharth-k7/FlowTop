import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const DEFAULT_PER_PAGE = 25;
/** The ceiling for any list. Nobody, public or admin, can ask for 10,000 rows. */
export const MAX_PER_PAGE = 100;

/**
 * ?page=&perPage= for any list endpoint. Extend it to add filters:
 *
 *   export class ProductListQuery extends PaginationQueryDto {
 *     @IsOptional() @IsString() search?: string;
 *   }
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PER_PAGE, default: DEFAULT_PER_PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage: number = DEFAULT_PER_PAGE;
}

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** The list envelope from docs/03-api-contract.md. */
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/** The Prisma skip/take for a page. */
export function pageToSkipTake({ page, perPage }: PaginationQueryDto): { skip: number; take: number } {
  return { skip: (page - 1) * perPage, take: perPage };
}

/**
 * Wraps one page of rows in the contract envelope.
 *
 *   const [rows, total] = await this.repository.list(pageToSkipTake(query), filters);
 *   return paginate(rows.map(toProductCard), total, query);
 *
 * A page past the end returns empty data with the real total, not an error.
 * An empty list has totalPages 0.
 */
export function paginate<T>(data: T[], total: number, { page, perPage }: PaginationQueryDto): Paginated<T> {
  return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
}

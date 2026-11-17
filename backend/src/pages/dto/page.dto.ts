import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination';
import { ReorderIdsDto } from '../../products/dto/variant.dto';

const SECTION_TYPES = ['hero', 'product_carousel', 'collection_showcase', 'image_text', 'gallery', 'cta'] as const;

export class PageListQuery extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsIn(['draft', 'published', 'unpublished', 'archived']) status?: 'draft' | 'published' | 'unpublished' | 'archived';
}

export class WritePageDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) slug?: string;
  @IsOptional() @IsString() @MaxLength(70) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(160) seoDescription?: string;
  @IsOptional() @IsString() seoCanonical?: string | null;
}

export class CreatePageDto {
  @IsString() @MaxLength(200) title!: string;
  @IsString() @MaxLength(200) slug!: string;
  @IsOptional() @IsString() @MaxLength(70) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(160) seoDescription?: string;
  @IsOptional() @IsString() seoCanonical?: string | null;
}

export class CreateSectionDto {
  @IsIn(SECTION_TYPES) type!: (typeof SECTION_TYPES)[number];
  @IsObject() config!: Record<string, unknown>;
  @IsOptional() @IsBoolean() visible?: boolean;
}

export class UpdateSectionDto {
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsOptional() @IsBoolean() visible?: boolean;
}

export { ReorderIdsDto };

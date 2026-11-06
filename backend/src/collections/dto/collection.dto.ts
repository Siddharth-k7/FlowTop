import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination';

export class CollectionListQuery extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsIn(['draft', 'published', 'unpublished', 'archived']) status?: 'draft' | 'published' | 'unpublished' | 'archived';
}

export class WriteCollectionDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) slug?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() story?: string;
  @IsOptional() @IsUUID() heroMediaId?: string | null;
  @IsOptional() @IsIn(['draft', 'published', 'unpublished', 'archived']) status?: 'draft' | 'published' | 'unpublished' | 'archived';
}

export class CreateCollectionDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(200) slug!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() story?: string;
  @IsOptional() @IsUUID() heroMediaId?: string | null;
}

export class RankItemDto {
  @IsUUID() productId!: string;
  @IsInt() @Min(1) position!: number;
}

export class CollectionProductsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => RankItemDto) items!: RankItemDto[];
}

import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination';

export class ProductListQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsIn(['draft', 'published', 'unpublished', 'archived']) status?: 'draft' | 'published' | 'unpublished' | 'archived';
  @IsOptional() @IsUUID() category?: string;
  @IsOptional() @IsIn(['images', 'specs']) missing?: 'images' | 'specs';
}

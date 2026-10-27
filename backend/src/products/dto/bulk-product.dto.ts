import { ArrayNotEmpty, IsArray, IsIn, IsUUID } from 'class-validator';

export class BulkProductDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) ids!: string[];
  @IsIn(['publish', 'unpublish', 'archive']) action!: 'publish' | 'unpublish' | 'archive';
}

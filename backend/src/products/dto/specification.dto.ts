import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class SpecificationItemDto {
  @IsOptional() @IsString() @MaxLength(100) group?: string | null;
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(500) value!: string;
  @IsOptional() @IsString() @MaxLength(40) unit?: string | null;
  @IsIn(['text', 'number', 'boolean', 'choice']) type!: 'text' | 'number' | 'boolean' | 'choice';
  @IsInt() @Min(1) position!: number;
}

export class ReplaceSpecificationsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SpecificationItemDto) items!: SpecificationItemDto[];
}

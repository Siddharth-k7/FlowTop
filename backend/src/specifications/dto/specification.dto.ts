import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { SpecificationType } from '../../generated/prisma/client';

export class SpecificationInputDto {
  @IsOptional() @IsString() @MaxLength(100) group?: string | null;
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(500) value!: string;
  @IsOptional() @IsString() @MaxLength(30) unit?: string | null;
  @IsEnum(SpecificationType) type: SpecificationType = SpecificationType.text;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class ReplaceSpecificationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationInputDto)
  items!: SpecificationInputDto[];
}

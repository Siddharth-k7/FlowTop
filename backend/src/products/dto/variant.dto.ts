import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

export class WriteVariantDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(40) skuSuffix!: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/) swatchHex?: string | null;
  @IsBoolean() isAvailable!: boolean;
  @IsBoolean() isDefault!: boolean;
}

export class ReorderIdsDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) ids!: string[];
}

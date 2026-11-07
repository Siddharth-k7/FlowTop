import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateVariantDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(50) skuSuffix!: string;
  @IsOptional() @IsInt() @Min(0) priceOverride?: number | null;
  @IsOptional() @IsString() @MaxLength(20) swatchHex?: string | null;
  @IsOptional() @IsUUID() imageId?: string | null;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

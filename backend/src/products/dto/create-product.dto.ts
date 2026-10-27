import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(100) sku!: string;
  @IsString() @MaxLength(200) slug!: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(500) shortDescription?: string;
  @IsOptional() @IsString() fullDescription?: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsInt() @Min(0) salePrice?: number;
  @IsOptional() @IsString() @MaxLength(50) taxClass?: string;
  @IsOptional() @IsBoolean() isPurchasable?: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsString() @MaxLength(200) availabilityMessage?: string;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isNewArrival?: boolean;
  @IsOptional() @IsBoolean() isBestseller?: boolean;
  @IsOptional() @IsString() @MaxLength(70) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(160) seoDescription?: string;
  @IsOptional() @IsString() @MaxLength(2048) seoCanonical?: string;
}

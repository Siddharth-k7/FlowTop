import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SeoFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(70)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  canonical?: string;

  @IsOptional()
  @IsUUID()
  shareImageId?: string;
}

/** Base class for DTOs that need the standard SEO fields. */
export class SeoFieldsMixin extends SeoFieldsDto {}

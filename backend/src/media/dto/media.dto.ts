import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination';
import { MediaBucket } from '../../generated/prisma/client';

/** The text fields sent alongside the file in POST /admin/media/upload. */
export class UploadMediaDto {
  @ApiProperty({ enum: MediaBucket, description: 'public: product and marketing media. private: customer documents.' })
  @IsEnum(MediaBucket)
  bucket!: MediaBucket;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}

export class UpdateMediaDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  altText!: string;
}

export class ListMediaQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Matches filename or alt text' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: ['image', 'document'] })
  @IsOptional()
  @IsIn(['image', 'document'])
  type?: 'image' | 'document';
}

/** The MediaAsset object from docs/03-api-contract.md. */
export interface MediaAssetResponse {
  id: string;
  /** Public bucket: a permanent CDN URL. Private bucket: a signed URL that expires in 15 minutes. */
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  /** Resized versions, filled in by background processing (task 2.1). Empty until then. */
  variants: { thumb?: string; medium?: string; large?: string };
}

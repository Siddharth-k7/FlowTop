import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const TYPES = ['homepage_section', 'category', 'collection', 'campaign_page', 'related'] as const;

export class CreatePlacementDto {
  @IsIn(TYPES) locationType!: (typeof TYPES)[number];
  @IsString() locationId!: string;
}

export class UpdatePlacementDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
}

export class ReorderPlacementsDto {
  @IsIn(TYPES) locationType!: (typeof TYPES)[number];
  @IsString() locationId!: string;
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) ids!: string[];
}

import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MaxLength(200) name!: string;
  @IsString() @MaxLength(200) slug!: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) slug?: string;
  @IsOptional() @IsString() description?: string;
}

export class ReorderDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) ids!: string[];
}

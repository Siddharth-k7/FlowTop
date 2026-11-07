import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderVariantsDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('4', { each: true }) ids!: string[];
}

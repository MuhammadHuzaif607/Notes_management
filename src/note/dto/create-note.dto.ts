// create-note.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Visibility } from '@prisma/client';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(Visibility)
  @IsNotEmpty() // Add this
  visibility: Visibility = Visibility.PRIVATE;

  @IsArray()
  @IsOptional()
  tagIds?: string[];

  @IsArray()
  @IsOptional()
  customUserIds?: number[];
}

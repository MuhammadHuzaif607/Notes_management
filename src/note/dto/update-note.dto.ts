import { IsOptional, IsEnum, IsString, IsArray,IsUUID } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  customUserIds?: number[];
}

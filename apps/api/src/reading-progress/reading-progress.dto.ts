import { createZodDto } from 'nestjs-zod';
import {
  ContinueReadingResponseSchema,
  ReadingProgressSchema,
  TitleReadingProgressResponseSchema,
  UpdateReadingProgressRequestSchema,
} from '@tanuki/contracts';

export class ReadingProgressDto extends createZodDto(ReadingProgressSchema) {}

export class TitleReadingProgressResponseDto extends createZodDto(
  TitleReadingProgressResponseSchema,
) {}

export class UpdateReadingProgressRequestDto extends createZodDto(
  UpdateReadingProgressRequestSchema,
) {}

export class ContinueReadingResponseDto extends createZodDto(ContinueReadingResponseSchema) {}

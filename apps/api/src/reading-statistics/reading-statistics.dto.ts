import { createZodDto } from 'nestjs-zod';
import {
  ChapterReadRequestSchema,
  ProfileStatisticsResponseSchema,
  ReadingActivityRequestSchema,
} from '@tanuki/contracts';

export class ChapterReadRequestDto extends createZodDto(ChapterReadRequestSchema) {}

export class ReadingActivityRequestDto extends createZodDto(ReadingActivityRequestSchema) {}

export class ProfileStatisticsResponseDto extends createZodDto(ProfileStatisticsResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import {
  ChaptersResponseSchema,
  MangaDetailsResponseSchema,
  PagesResponseSchema,
} from '@tanuki/contracts';

export class MangaDetailsResponseDto extends createZodDto(MangaDetailsResponseSchema) {}
export class ChaptersResponseDto extends createZodDto(ChaptersResponseSchema) {}
export class PagesResponseDto extends createZodDto(PagesResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import {
  ChaptersResponseSchema,
  TitleDetailsResponseSchema,
  PagesResponseSchema,
} from '@tanuki/contracts';

export class TitleDetailsResponseDto extends createZodDto(TitleDetailsResponseSchema) {}
export class ChaptersResponseDto extends createZodDto(ChaptersResponseSchema) {}
export class PagesResponseDto extends createZodDto(PagesResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { MangaLinkRequestSchema, MangaMatchesResponseSchema } from '@tanuki/contracts';

export class MangaMatchesResponseDto extends createZodDto(MangaMatchesResponseSchema) {}

export class MangaLinkRequestDto extends createZodDto(MangaLinkRequestSchema) {}

import { createZodDto } from 'nestjs-zod';
import { TitleLinkRequestSchema, TitleMatchesResponseSchema } from '@tanuki/contracts';

export class TitleMatchesResponseDto extends createZodDto(TitleMatchesResponseSchema) {}

export class TitleLinkRequestDto extends createZodDto(TitleLinkRequestSchema) {}

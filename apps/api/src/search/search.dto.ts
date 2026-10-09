import { createZodDto } from 'nestjs-zod';
import { SearchHistoryResponseSchema, SearchResponseSchema } from '@tanuki/contracts';

export class SearchResponseDto extends createZodDto(SearchResponseSchema) {}

export class SearchHistoryResponseDto extends createZodDto(SearchHistoryResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { SearchHistoryResponseSchema } from '@tanuki/contracts';

export class SearchHistoryResponseDto extends createZodDto(SearchHistoryResponseSchema) {}

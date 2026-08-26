import { createZodDto } from 'nestjs-zod';
import { SearchResponseSchema } from '@tanuki/contracts';

export class SearchResponseDto extends createZodDto(SearchResponseSchema) {}

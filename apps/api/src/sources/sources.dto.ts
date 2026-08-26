import { createZodDto } from 'nestjs-zod';
import { SourceSchema, SourcesResponseSchema } from '@tanuki/contracts';

export class SourceDto extends createZodDto(SourceSchema) {}
export class SourcesResponseDto extends createZodDto(SourcesResponseSchema) {}

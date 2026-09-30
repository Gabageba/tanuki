import { createZodDto } from 'nestjs-zod';
import {
  SourceSchema,
  SourcesResponseSchema,
  UpdateSourceEnabledRequestSchema,
  UpdateSourcesOrderRequestSchema,
} from '@tanuki/contracts';

export class SourceDto extends createZodDto(SourceSchema) {}
export class SourcesResponseDto extends createZodDto(SourcesResponseSchema) {}
export class UpdateSourceEnabledRequestDto extends createZodDto(UpdateSourceEnabledRequestSchema) {}
export class UpdateSourcesOrderRequestDto extends createZodDto(UpdateSourcesOrderRequestSchema) {}

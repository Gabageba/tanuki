import { createZodDto } from 'nestjs-zod';
import {
  SelectionsResponseSchema,
  SelectionsSectionQuerySchema,
  SelectionsSectionResponseSchema,
} from '@tanuki/contracts';

export class SelectionsResponseDto extends createZodDto(SelectionsResponseSchema) {}

export class SelectionsSectionQueryDto extends createZodDto(SelectionsSectionQuerySchema) {}

export class SelectionsSectionResponseDto extends createZodDto(SelectionsSectionResponseSchema) {}

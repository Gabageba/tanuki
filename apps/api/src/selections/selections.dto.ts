import { createZodDto } from 'nestjs-zod';
import { SelectionsResponseSchema } from '@tanuki/contracts';

export class SelectionsResponseDto extends createZodDto(SelectionsResponseSchema) {}

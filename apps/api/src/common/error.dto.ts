import { createZodDto } from 'nestjs-zod';
import { ApiErrorSchema } from '@tanuki/contracts';

export class ApiErrorDto extends createZodDto(ApiErrorSchema) {}

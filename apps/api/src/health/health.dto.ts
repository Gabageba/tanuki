import { createZodDto } from 'nestjs-zod';
import { HealthResponseSchema } from './models';

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { UpdateProfileRequestSchema } from '@tanuki/contracts';

export class UpdateProfileRequestDto extends createZodDto(UpdateProfileRequestSchema) {}

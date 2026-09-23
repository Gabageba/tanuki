import { createZodDto } from 'nestjs-zod';
import { ReaderSettingsSchema, UpdateReaderSettingsRequestSchema } from '@tanuki/contracts';

export class ReaderSettingsDto extends createZodDto(ReaderSettingsSchema) {}

export class UpdateReaderSettingsRequestDto extends createZodDto(
  UpdateReaderSettingsRequestSchema,
) {}

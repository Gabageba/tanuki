import { createZodDto } from 'nestjs-zod';
import { UserSettingsSchema, UpdateUserSettingsRequestSchema } from '@tanuki/contracts';

export class UserSettingsDto extends createZodDto(UserSettingsSchema) {}

export class UpdateUserSettingsRequestDto extends createZodDto(UpdateUserSettingsRequestSchema) {}

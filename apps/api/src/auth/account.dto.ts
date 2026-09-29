import { createZodDto } from 'nestjs-zod';
import {
  ChangeEmailRequestSchema,
  ChangePasswordRequestSchema,
  ConfirmEmailChangeRequestSchema,
  DeleteAccountRequestSchema,
  SessionsResponseSchema,
} from '@tanuki/contracts';

export class ChangeEmailRequestDto extends createZodDto(ChangeEmailRequestSchema) {}

export class ConfirmEmailChangeRequestDto extends createZodDto(ConfirmEmailChangeRequestSchema) {}

export class ChangePasswordRequestDto extends createZodDto(ChangePasswordRequestSchema) {}

export class DeleteAccountRequestDto extends createZodDto(DeleteAccountRequestSchema) {}

export class SessionsResponseDto extends createZodDto(SessionsResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import {
  CreateInviteRequestSchema,
  CreateInviteResponseSchema,
  InvitesResponseSchema,
} from '@tanuki/contracts';

export class CreateInviteRequestDto extends createZodDto(CreateInviteRequestSchema) {}

export class CreateInviteResponseDto extends createZodDto(CreateInviteResponseSchema) {}

export class InvitesResponseDto extends createZodDto(InvitesResponseSchema) {}

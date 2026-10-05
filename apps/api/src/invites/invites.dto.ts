import { createZodDto } from 'nestjs-zod';
import {
  CreateInviteRequestSchema,
  CreateInviteResponseSchema,
  InviteSchema,
  InvitesQuerySchema,
  InvitesResponseSchema,
} from '@tanuki/contracts';

export class CreateInviteRequestDto extends createZodDto(CreateInviteRequestSchema) {}

export class CreateInviteResponseDto extends createZodDto(CreateInviteResponseSchema) {}

export class InvitesResponseDto extends createZodDto(InvitesResponseSchema) {}

export class InvitesQueryDto extends createZodDto(InvitesQuerySchema) {}

export class InviteDto extends createZodDto(InviteSchema) {}

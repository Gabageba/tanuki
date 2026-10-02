import { createZodDto } from 'nestjs-zod';
import {
  BlockUserRequestSchema,
  ChangeUserRoleRequestSchema,
  ManagedUserSchema,
  ManagedUsersQuerySchema,
  ManagedUsersResponseSchema,
  UpdateProfileRequestSchema,
} from '@tanuki/contracts';

export class UpdateProfileRequestDto extends createZodDto(UpdateProfileRequestSchema) {}

export class ManagedUsersQueryDto extends createZodDto(ManagedUsersQuerySchema) {}

export class ManagedUserDto extends createZodDto(ManagedUserSchema) {}

export class ManagedUsersResponseDto extends createZodDto(ManagedUsersResponseSchema) {}

export class ChangeUserRoleRequestDto extends createZodDto(ChangeUserRoleRequestSchema) {}

export class BlockUserRequestDto extends createZodDto(BlockUserRequestSchema) {}

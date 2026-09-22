import { createZodDto } from 'nestjs-zod';
import {
  CheckUsernameResponseSchema,
  CurrentUserSchema,
  ForgotPasswordRequestSchema,
  InviteCheckResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  ResendVerificationRequestSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
} from '@tanuki/contracts';

export class RegisterRequestDto extends createZodDto(RegisterRequestSchema) {}

export class LoginRequestDto extends createZodDto(LoginRequestSchema) {}

export class VerifyEmailRequestDto extends createZodDto(VerifyEmailRequestSchema) {}

export class ResendVerificationRequestDto extends createZodDto(ResendVerificationRequestSchema) {}

export class ForgotPasswordRequestDto extends createZodDto(ForgotPasswordRequestSchema) {}

export class ResetPasswordRequestDto extends createZodDto(ResetPasswordRequestSchema) {}

export class CurrentUserDto extends createZodDto(CurrentUserSchema) {}

export class CheckUsernameResponseDto extends createZodDto(CheckUsernameResponseSchema) {}

export class InviteCheckResponseDto extends createZodDto(InviteCheckResponseSchema) {}

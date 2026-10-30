import { createZodDto } from 'nestjs-zod';
import {
  ConfirmLibSocialLoginRequestSchema,
  LinkLibSocialAccountRequestSchema,
  LibSocialLoginSourceRequestSchema,
  LibSocialLoginStepSchema,
  LinkLibSocialTokenRequestSchema,
  LinkSourceAccountRequestSchema,
  LinkSourceSessionRequestSchema,
  SourceAccountsResponseSchema,
} from '@tanuki/contracts';

export class LinkSourceAccountRequestDto extends createZodDto(LinkSourceAccountRequestSchema) {}

export class LinkLibSocialAccountRequestDto extends createZodDto(
  LinkLibSocialAccountRequestSchema,
) {}

export class LibSocialLoginSourceRequestDto extends createZodDto(
  LibSocialLoginSourceRequestSchema,
) {}

export class LibSocialLoginStepDto extends createZodDto(LibSocialLoginStepSchema) {}

export class ConfirmLibSocialLoginRequestDto extends createZodDto(
  ConfirmLibSocialLoginRequestSchema,
) {}

export class LinkLibSocialTokenRequestDto extends createZodDto(LinkLibSocialTokenRequestSchema) {}

export class LinkSourceSessionRequestDto extends createZodDto(LinkSourceSessionRequestSchema) {}

export class SourceAccountsResponseDto extends createZodDto(SourceAccountsResponseSchema) {}

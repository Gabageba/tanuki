import { createZodDto } from 'nestjs-zod';
import {
  LinkLibSocialTokenRequestSchema,
  LinkSourceAccountRequestSchema,
  LinkSourceSessionRequestSchema,
  SourceAccountsResponseSchema,
} from '@tanuki/contracts';

export class LinkSourceAccountRequestDto extends createZodDto(LinkSourceAccountRequestSchema) {}

export class LinkLibSocialTokenRequestDto extends createZodDto(LinkLibSocialTokenRequestSchema) {}

export class LinkSourceSessionRequestDto extends createZodDto(LinkSourceSessionRequestSchema) {}

export class SourceAccountsResponseDto extends createZodDto(SourceAccountsResponseSchema) {}

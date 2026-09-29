import { createZodDto } from 'nestjs-zod';
import {
  LinkLibSocialTokenRequestSchema,
  LinkSourceAccountRequestSchema,
  SourceAccountsResponseSchema,
} from '@tanuki/contracts';

export class LinkSourceAccountRequestDto extends createZodDto(LinkSourceAccountRequestSchema) {}

export class LinkLibSocialTokenRequestDto extends createZodDto(LinkLibSocialTokenRequestSchema) {}

export class SourceAccountsResponseDto extends createZodDto(SourceAccountsResponseSchema) {}

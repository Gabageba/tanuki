import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

export const API_ERROR_CODE = {
  SOURCE_UNAVAILABLE: 'sourceUnavailable',
  SOURCE_BLOCKED: 'sourceBlocked',
  SOURCE_AUTH_REQUIRED: 'sourceAuthRequired',
  SOURCE_TOKEN_EXPIRED: 'sourceTokenExpired',
  PARSER_FAILED: 'parserFailed',
  NOT_FOUND: 'notFound',
  RATE_LIMITED: 'rateLimited',
  INVALID_SIGNATURE: 'invalidSignature',
} as const;
export type ApiErrorCode = EnumLiteralsOf<typeof API_ERROR_CODE>;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODE);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    sourceId: z.string().optional(),
    retryAfter: z.number().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

export const API_ERROR_CODE = {
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE',
  SOURCE_BLOCKED: 'SOURCE_BLOCKED',
  SOURCE_AUTH_REQUIRED: 'SOURCE_AUTH_REQUIRED',
  SOURCE_TOKEN_EXPIRED: 'SOURCE_TOKEN_EXPIRED',
  PARSER_FAILED: 'PARSER_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
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

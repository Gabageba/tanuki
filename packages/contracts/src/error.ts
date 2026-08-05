import { z } from 'zod';

export const ApiErrorCodeSchema = z.enum([
  'SOURCE_UNAVAILABLE',
  'SOURCE_BLOCKED',
  'SOURCE_AUTH_REQUIRED',
  'SOURCE_TOKEN_EXPIRED',
  'PARSER_FAILED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INVALID_SIGNATURE',
]);

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    sourceId: z.string().optional(),
    retryAfter: z.number().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

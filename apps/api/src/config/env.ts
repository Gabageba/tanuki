import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  PARSERS_URL: z.string().url().default('http://localhost:8085'),
  IMG_SIGN_SECRET: z.string().min(16),
  ENABLED_SOURCES: z
    .string()
    .default('DESUME')
    .transform((value) =>
      value
        .split(',')
        .map((sourceId) => sourceId.trim())
        .filter(Boolean),
    ),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SOURCE_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  SOURCE_BREAKER_RESET_MS: z.coerce.number().default(600_000),
  SOURCE_MAX_CONCURRENCY: z.coerce.number().default(4),
  SOURCE_QUEUE_LIMIT: z.coerce.number().default(20),
  SEARCH_TIMEOUT_MS: z.coerce.number().default(5_000),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  return EnvSchema.parse(process.env);
}

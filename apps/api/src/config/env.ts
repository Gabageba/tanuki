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
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  return EnvSchema.parse(process.env);
}

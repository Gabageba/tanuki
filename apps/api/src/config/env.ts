import { resolve } from 'node:path';
import { z } from 'zod';
import { SOURCE_ID } from '@tanuki/parsers';

const SourceIdSchema = z.enum(SOURCE_ID);

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  IMG_SIGN_SECRET: z.string().min(16),
  DISABLED_SOURCES: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((sourceId) => sourceId.trim())
        .filter(Boolean),
    )
    .pipe(z.array(SourceIdSchema)),
  // Optional Grouple network account (ReadManga/MintManga/SelfManga/SeiManga/Usagi share one
  // SSO login) — without these, those sources work anonymously and member-only chapters 401.
  GROUPLE_USERNAME: z.string().optional(),
  GROUPLE_PASSWORD: z.string().optional(),
  // AllHentai uses its own qawa.org SSO gateway and account system, separate from the main
  // Grouple network above — its catalog requires a session for every request, not just
  // member-only chapters, so without these ALLHENTAI is unusable rather than degraded.
  ALLHENTAI_USERNAME: z.string().optional(),
  ALLHENTAI_PASSWORD: z.string().optional(),
  // LibSocial (MANGALIB/HENTAILIB/YAOILIB): login is reCAPTCHA-gated and can't be automated
  // in-process (see sources/libsocial/auth.ts) — a human runs
  // `pnpm --filter @tanuki/parsers login:libsocial <SOURCE_ID>` once via a real (Playwright)
  // browser, which writes the resulting OAuth token to `<dir>/<SOURCE_ID>.json` (one file per
  // network member — each has its own auth gateway/account, see libsocial/config.ts `auth`);
  // the engine only reads and rotates it afterwards via its refresh_token. Defaults to
  // <repo-root>/data/libsocial-tokens/, which both this process (cwd apps/api) and the login
  // script (cwd packages/parsers) resolve identically.
  LIBSOCIAL_TOKEN_STORE_DIR: z
    .string()
    .default(resolve(process.cwd(), '../../data/libsocial-tokens')),
  SOURCE_HTTP_TIMEOUT_MS: z.coerce.number().default(20_000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Значения по умолчанию совпадают с docker-compose.yml, чтобы локальный запуск не требовал
  // настройки. База нужна только для ручных правок связей между тайтлами: без неё API
  // работает, но правки сохранить нельзя.
  DATABASE_URL: z.string().default('postgres://tanuki:tanuki@localhost:5432/tanuki'),
  SOURCE_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  SOURCE_BREAKER_RESET_MS: z.coerce.number().default(600_000),
  SOURCE_MAX_CONCURRENCY: z.coerce.number().default(4),
  SOURCE_QUEUE_LIMIT: z.coerce.number().default(20),
  SEARCH_TIMEOUT_MS: z.coerce.number().default(5_000),
  // Заметно больше, чем у поиска: матчинг опрашивает два десятка источников в двух волнах и
  // добирает детали, а результат кешируется на часы. Пользователя он при этом не блокирует —
  // тот читает страницу тайтла, пока блок догружается. На живом прогоне полный веер по 22
  // источникам укладывается примерно в 20 секунд.
  MATCH_TIMEOUT_MS: z.coerce.number().default(20_000),
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (): Env => {
  return EnvSchema.parse(process.env);
};

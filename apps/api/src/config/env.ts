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
  // Сервисные учётки ниже — только для фоновых задач (пробник, веер совпадений). Пользователи
  // читают источники с обязательным входом через свои аккаунты (source_accounts).
  // Optional Grouple network account (ReadManga/MintManga/SelfManga/SeiManga/Usagi share one
  // SSO login) — without these, background requests to those sources fail with auth required.
  GROUPLE_USERNAME: z.string().optional(),
  GROUPLE_PASSWORD: z.string().optional(),
  // AllHentai uses its own qawa.org SSO gateway and account system, separate from the main
  // Grouple network above — its catalog requires a session for every request, not just
  // member-only chapters, so without these ALLHENTAI is unusable rather than degraded.
  ALLHENTAI_USERNAME: z.string().optional(),
  ALLHENTAI_PASSWORD: z.string().optional(),
  // Nude-Moon service account for background work: the site serves title search only to a
  // logged-in session. Viewers search through their own linked account, never through this one.
  NUDEMOON_USERNAME: z.string().optional(),
  NUDEMOON_PASSWORD: z.string().optional(),
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
  // Ключ шифрования личных аккаунтов источников (AES-256-GCM, 32 байта в base64). Без него
  // привязать аккаунт нельзя. Потеря ключа = все привязки придётся делать заново.
  SOURCE_SECRETS_KEY: z
    .string()
    .optional()
    .refine((value) => !value || Buffer.from(value, 'base64').length === 32, {
      message: 'SOURCE_SECRETS_KEY должен быть 32 байтами в base64 (openssl rand -base64 32)',
    }),
  SOURCE_HTTP_TIMEOUT_MS: z.coerce.number().default(20_000),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Значения по умолчанию совпадают с docker-compose.yml, чтобы локальный запуск не требовал
  // настройки. База нужна только для ручных правок связей между тайтлами: без неё API
  // работает, но правки сохранить нельзя.
  DATABASE_URL: z.string().default('postgres://tanuki:tanuki@localhost:5432/tanuki'),
  SOURCE_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  // Окно, на которое breaker перестаёт пускать запросы к источнику. Заметно короче прежних 10
  // минут: раньше от него же зависел и статус источника, теперь статус живёт отдельно
  // (SourceStatusService) и держится сам, так что окну незачем быть длинным — чем оно короче,
  // тем быстрее ожившый источник наберёт серию успехов и вернётся в ok.
  SOURCE_BREAKER_RESET_MS: z.coerce.number().default(180_000),
  // Сколько живых запросов подряд должно пройти, чтобы снять degraded/down. Не один: одиночный
  // удачный ответ от в целом неработающего источника ещё ничего не доказывает.
  SOURCE_RECOVERY_SUCCESS_THRESHOLD: z.coerce.number().default(5),
  SOURCE_MAX_CONCURRENCY: z.coerce.number().default(4),
  SOURCE_QUEUE_LIMIT: z.coerce.number().default(20),
  // Ночная проверка источников (SourceProbeService). Сколько прогонов подряд должно упасть,
  // чтобы источник считался неработающим: одна упавшая ночь чаще означает проблему сети, чем
  // сломанный сайт.
  SOURCE_PROBE_FAILURE_THRESHOLD: z.coerce.number().default(3),
  SOURCE_PROBE_CRON: z.string().default('0 3 * * *'),
  SOURCE_PROBE_CONCURRENCY: z.coerce.number().default(3),
  // Выключатель для локальной разработки: пробник ходит по реальным сайтам, в dev это лишнее.
  SOURCE_PROBE_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
  // Проверка новых глав у закладок (BookmarkUpdatesService): тайтлы из папок с «Следить за
  // обновлениями». Каждый тайтл запрашивается раз за проход, сколько бы человек его ни сохранили.
  BOOKMARK_UPDATES_CRON: z.string().default('0 */3 * * *'),
  BOOKMARK_UPDATES_CONCURRENCY: z.coerce.number().default(2),
  // Раз в сутки — чистка снимков глав тайтлов, которых больше нет ни в закладках, ни в отметках.
  BOOKMARK_SNAPSHOTS_CLEANUP_CRON: z.string().default('30 4 * * *'),
  // Выключатель для локальной разработки: крон ходит по реальным сайтам, как и пробник.
  BOOKMARK_UPDATES_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),
  // Web Push (NotificationsModule). Без пары ключей push на инстансе выключен: лента и бейдж
  // работают, а блок push нигде не показывается. Пара: `npx web-push generate-vapid-keys`.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  // mailto: или https://-адрес, по которому push-сервис может связаться с владельцем инстанса.
  VAPID_SUBJECT: z.string().default('mailto:admin@tanuki.local'),
  // Общий дедлайн веера поиска: ответившие источники уже на экране (поток SSE), ожидание
  // медленных больше ничего не стоит.
  SEARCH_TIMEOUT_MS: z.coerce.number().default(15_000),
  // Заметно больше, чем у поиска: матчинг опрашивает два десятка источников в двух волнах и
  // добирает детали, а результат кешируется на часы. Пользователя он при этом не блокирует —
  // тот читает страницу тайтла, пока блок догружается. На живом прогоне полный веер по 22
  // источникам укладывается примерно в 20 секунд.
  MATCH_TIMEOUT_MS: z.coerce.number().default(20_000),
  // Базовый адрес фронтенда — на него ссылаются письма (подтверждение почты, сброс пароля).
  APP_URL: z.string().default('http://localhost:5173'),
  // Пусто = SMTP не настроен: MailService вместо отправки пишет ссылку в лог (удобно для dev).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('Tanuki <noreply@tanuki.local>'),
  // Cookie сессии ставится Secure только за HTTPS — в локальной разработке это ломает http.
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  // За обратным прокси (nginx и т.п.) IP клиента приходит в X-Forwarded-For — без этого флага
  // rate limiter считал бы все запросы приходящими с одного IP прокси.
  TRUST_PROXY: z
    .string()
    .default('false')
    .refine((value) => value !== 'true', {
      message: 'TRUST_PROXY: укажите точные IP/CIDR прокси вместо true',
    }),
  METRICS_TOKEN: z
    .string()
    .refine((value) => value === '' || value.length >= 32)
    .optional(),
  SENTRY_API_DSN: z.string().optional(),
  TANUKI_VERSION: z.string().default('development'),
});

export type Env = z.infer<typeof EnvSchema>;

export const loadEnv = (): Env => {
  return EnvSchema.parse(process.env);
};

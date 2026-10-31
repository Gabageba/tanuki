import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { LibSocialPendingLogin } from '@tanuki/parsers';

/**
 * От чьего имени идёт запрос к источнику. Внутренняя деталь сервера: наружу не уходит.
 * SERVICE — фоновая работа (пробник, общий веер совпадений): она ходит через сервисную учётку.
 */
export const VIEWER_KIND = {
  USER: 'user',
  GUEST: 'guest',
  SERVICE: 'service',
} as const;
export type ViewerKind = EnumLiteralsOf<typeof VIEWER_KIND>;

export type Viewer =
  | { kind: typeof VIEWER_KIND.USER; userId: string }
  | { kind: typeof VIEWER_KIND.GUEST }
  | { kind: typeof VIEWER_KIND.SERVICE };

/** Сколько живых сессий аккаунтов держать в памяти — дальше старые перечитываются из БД. */
export const SOURCE_SESSIONS_CACHE_SIZE = 500;

/** Как часто сохранять обновившуюся сессию (новые cookie, повёрнутый токен) в БД. */
export const SOURCE_SESSION_PERSIST_DELAY_MS = 2_000;

export const PENDING_LOGIN_TTL_MS = 10 * 60_000;

export type LoginInput = { login: string; password: string; rememberPassword: boolean };

export type LoginAttempt = LoginInput & {
  userId: string;
  sourceId: string;
  pending: LibSocialPendingLogin | null;
  expiry: NodeJS.Timeout | null;
  busy: boolean;
};

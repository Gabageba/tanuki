import type { EnumLiteralsOf } from '@tanuki/contracts';

/**
 * Что за ссылку несёт email_tokens.tokenHash. Не в contracts: это внутренняя деталь хранения,
 * наружу (в ответах API) значение никогда не уходит.
 */
export const EMAIL_TOKEN_PURPOSE = {
  VERIFY_EMAIL: 'verifyEmail',
  RESET_PASSWORD: 'resetPassword',
} as const;
export type EmailTokenPurpose = EnumLiteralsOf<typeof EMAIL_TOKEN_PURPOSE>;

export const SESSION_COOKIE_NAME = 'tanuki_session';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** «Запомнить меня»: срок сессии и cookie, скользяще продлевается активностью. */
export const SESSION_REMEMBER_MS = 30 * DAY_MS;
/** Без галочки: сессия живёт, пока не протухнет от простоя — и пока открыт браузер. */
export const SESSION_IDLE_MS = DAY_MS;
/** Продление пишется в БД (и, для remember, переставляется cookie) не чаще раза в час. */
export const SESSION_TOUCH_INTERVAL_MS = HOUR_MS;

export const EMAIL_VERIFICATION_TTL_MS = DAY_MS;
export const PASSWORD_RESET_TTL_MS = HOUR_MS;
/** Через сколько крон удаляет аккаунт с неподтверждённой почтой, освобождая инвайт. */
export const UNVERIFIED_ACCOUNT_TTL_MS = 7 * DAY_MS;

export const RESEND_VERIFICATION_COOLDOWN_S = 60;

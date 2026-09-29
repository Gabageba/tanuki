import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SessionUser } from './session.service';

/**
 * Что за ссылку несёт email_tokens.tokenHash. Не в contracts: это внутренняя деталь хранения,
 * наружу (в ответах API) значение никогда не уходит.
 */
export const EMAIL_TOKEN_PURPOSE = {
  VERIFY_EMAIL: 'verifyEmail',
  RESET_PASSWORD: 'resetPassword',
  /**
   * Код на новую почту: payload — новый адрес, tokenHash — хэш кода (см. hashEmailCode). Почта
   * меняется, только когда код введён в той же модалке, где запрошена смена.
   */
  CHANGE_EMAIL: 'changeEmail',
  /** Ссылка «это был не я» на прежнюю почту: payload — прежний адрес. */
  REVERT_EMAIL_CHANGE: 'revertEmailChange',
  CANCEL_ACCOUNT_DELETION: 'cancelAccountDeletion',
} as const;
export type EmailTokenPurpose = EnumLiteralsOf<typeof EMAIL_TOKEN_PURPOSE>;

/** Чем кончился ввод кода смены почты — AccountService.confirmEmailChange. */
export const EMAIL_CODE_RESULT = {
  APPLIED: 'applied',
  WRONG: 'wrong',
  /** Кода нет: истёк, заменён новым или сгорел после лимита попыток. */
  EXPIRED: 'expired',
} as const;
export type EmailCodeResult =
  | { status: typeof EMAIL_CODE_RESULT.APPLIED; user: SessionUser }
  | { status: typeof EMAIL_CODE_RESULT.WRONG | typeof EMAIL_CODE_RESULT.EXPIRED };

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

/** Код ждут, не закрывая модалку, — дольше четверти часа он не нужен. */
export const EMAIL_CHANGE_CODE_TTL_MS = 15 * 60 * 1000;
export const MAX_EMAIL_CODE_ATTEMPTS = 5;
/** Откатить смену почты можно долго: владелец старого ящика мог быть в отпуске. */
export const EMAIL_CHANGE_REVERT_TTL_MS = 7 * DAY_MS;
/** Сколько аккаунт ждёт окончательного удаления — всё это время удаление можно отменить. */
export const ACCOUNT_DELETION_GRACE_MS = 14 * DAY_MS;

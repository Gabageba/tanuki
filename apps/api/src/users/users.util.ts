import type { CurrentUser } from '@tanuki/contracts';
import type { SessionUser } from '../auth/session.service';
import { toServerDateTime } from '../common/dates';
import { AccountBlockedException } from '../common/errors';

/** Версия в query меняется с каждой загрузкой — браузер кеширует ответ навсегда и не видит старый. */
export const toAvatarUrl = (user: Pick<SessionUser, 'id' | 'avatarUpdatedAt'>): string | null =>
  user.avatarUpdatedAt
    ? `/api/v1/users/${user.id}/avatar?v=${user.avatarUpdatedAt.getTime()}`
    : null;

export const toCurrentUser = (user: SessionUser): CurrentUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  language: user.language,
  avatarUrl: toAvatarUrl(user),
  createdAt: toServerDateTime(user.createdAt.getTime()),
});

/** Блокировка действует: стоит и либо бессрочна, либо её срок ещё не прошёл. */
export const isUserBlocked = (
  user: Pick<SessionUser, 'blockedAt' | 'blockedUntil'>,
  now = Date.now(),
): boolean =>
  user.blockedAt !== null && (user.blockedUntil === null || user.blockedUntil.getTime() > now);

/** Заблокированному не выдаётся сессия — ни входом, ни ссылкой из письма. */
export const assertNotBlocked = (
  user: Pick<SessionUser, 'blockedAt' | 'blockedUntil' | 'blockReason'>,
): void => {
  if (isUserBlocked(user)) throw new AccountBlockedException(user.blockedUntil, user.blockReason);
};

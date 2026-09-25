import type { CurrentUser } from '@tanuki/contracts';
import type { SessionUser } from '../auth/session.service';
import { toServerDateTime } from '../common/dates';

/** Версия в query меняется с каждой загрузкой — браузер кеширует ответ навсегда и не видит старый. */
const toAvatarUrl = (user: SessionUser): string | null =>
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

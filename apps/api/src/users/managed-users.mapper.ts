import { USER_STATUS, type ManagedUser, type UserStatus } from '@tanuki/contracts';
import type { SessionUser } from '../auth/session.service';
import { toServerDateTime } from '../common/dates';
import { isUserBlocked, toAvatarUrl } from './users.util';

type StatusFields = Pick<
  SessionUser,
  'blockedAt' | 'blockedUntil' | 'deletionScheduledAt' | 'emailVerifiedAt'
>;

/**
 * Статус выводится из полей строки, а не хранится — так не разойдётся с ними. Порядок важен: его
 * же повторяет фильтр по статусу в ManagedUsersService.statusCondition.
 */
export const computeUserStatus = (user: StatusFields, now = Date.now()): UserStatus => {
  if (isUserBlocked(user, now)) return USER_STATUS.BLOCKED;
  if (user.deletionScheduledAt) return USER_STATUS.DELETION_SCHEDULED;
  if (!user.emailVerifiedAt) return USER_STATUS.UNVERIFIED;
  return USER_STATUS.ACTIVE;
};

const toNullableDateTime = (date: Date | null): string | null =>
  date ? toServerDateTime(date.getTime()) : null;

export const toManagedUser = (user: SessionUser, invitedByUsername: string | null): ManagedUser => {
  const status = computeUserStatus(user);
  const isBlocked = status === USER_STATUS.BLOCKED;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status,
    avatarUrl: toAvatarUrl(user),
    // Кончившаяся блокировка остаётся в строке, но наружу не уходит — человек уже не заблокирован.
    blockedUntil: isBlocked ? toNullableDateTime(user.blockedUntil) : null,
    blockReason: isBlocked ? user.blockReason : null,
    deletionScheduledAt: toNullableDateTime(user.deletionScheduledAt),
    invitedByUsername,
    createdAt: toServerDateTime(user.createdAt.getTime()),
    lastSeenAt: toNullableDateTime(user.lastSeenAt),
  };
};

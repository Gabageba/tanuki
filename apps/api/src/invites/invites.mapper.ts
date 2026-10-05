import { INVITE_STATUS, type Invite, type InviteStatus } from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import type { invites } from '../database/schema';
import { toAvatarUrl } from '../users/users.util';

type InviteRow = typeof invites.$inferSelect;

/**
 * Статус целиком выводится из трёх полей строки — так он не может разойтись с ними (см.
 * комментарий у таблицы invites в database/schema.ts).
 */
export const computeInviteStatus = (
  row: Pick<InviteRow, 'usedAt' | 'revokedAt' | 'expiresAt'>,
): InviteStatus => {
  if (row.usedAt) return INVITE_STATUS.USED;
  if (row.revokedAt) return INVITE_STATUS.REVOKED;
  if (row.expiresAt.getTime() < Date.now()) return INVITE_STATUS.EXPIRED;
  return INVITE_STATUS.ACTIVE;
};

/** Люди, на которых ссылается строка; null — ссылки нет или человек удалён. */
export type InvitePeople = {
  createdByUsername: string | null;
  usedByUsername: string | null;
  /** Когда зарегистрировавшийся сменил картинку — из неё собирается ссылка на аватар. */
  usedByAvatarUpdatedAt: Date | null;
  revokedByUsername: string | null;
};

const toNullableDateTime = (date: Date | null) => (date ? toServerDateTime(date.getTime()) : null);

export const toInvite = (
  row: InviteRow,
  { createdByUsername, usedByUsername, usedByAvatarUpdatedAt, revokedByUsername }: InvitePeople,
): Invite => ({
  id: row.id,
  role: row.role,
  status: computeInviteStatus(row),
  createdById: row.createdBy,
  createdByUsername,
  usedByUsername,
  usedByAvatarUrl: row.usedBy
    ? toAvatarUrl({ id: row.usedBy, avatarUpdatedAt: usedByAvatarUpdatedAt })
    : null,
  revokedByUsername,
  createdAt: toServerDateTime(row.createdAt.getTime()),
  expiresAt: toServerDateTime(row.expiresAt.getTime()),
  usedAt: toNullableDateTime(row.usedAt),
  revokedAt: toNullableDateTime(row.revokedAt),
});

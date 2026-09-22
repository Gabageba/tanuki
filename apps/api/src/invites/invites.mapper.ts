import { INVITE_STATUS, type Invite, type InviteStatus } from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import type { invites } from '../database/schema';

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

export const toInvite = (
  row: InviteRow,
  createdByUsername: string | null,
  usedByUsername: string | null,
): Invite => ({
  id: row.id,
  role: row.role,
  status: computeInviteStatus(row),
  createdByUsername,
  usedByUsername,
  createdAt: toServerDateTime(row.createdAt.getTime()),
  expiresAt: toServerDateTime(row.expiresAt.getTime()),
  usedAt: row.usedAt ? toServerDateTime(row.usedAt.getTime()) : null,
});

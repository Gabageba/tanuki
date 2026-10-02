import { INVITE_STATUS, USER_ROLE, type InviteStatus, type UserRole } from '@tanuki/contracts';
import {
  DRAWER_LAYOUT,
  INVITE_TTL_DAYS,
  LINK_RECOVERY,
  MESSAGE_PATTERN,
  OUTCOME_COLUMN,
  REVOKE_CONFIRM,
  TABLE_LAYOUT,
  VIEWER,
  type MockInvite,
  type PanelConfig,
  type Viewer,
} from './models';

const DAY_MS = 24 * 60 * 60 * 1000;

const toServerDateTime = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;

const addDays = (isoDate: string, days: number) =>
  toServerDateTime(new Date(new Date(isoDate).getTime() + days * DAY_MS));

type Extra = {
  usedBy?: string;
  usedAt?: string;
  revokedBy?: string;
  revokedAt?: string;
};

const invite = (
  id: string,
  role: UserRole,
  status: InviteStatus,
  createdBy: string | null,
  createdAt: string,
  { usedBy, usedAt, revokedBy, revokedAt }: Extra = {},
): MockInvite => ({
  id,
  role,
  status,
  createdBy,
  usedBy: usedBy ?? null,
  revokedBy: revokedBy ?? null,
  createdAt,
  expiresAt: addDays(createdAt, INVITE_TTL_DAYS),
  usedAt: usedAt ?? null,
  revokedAt: revokedAt ?? null,
  code: `Rk3vQ9pL2mXa7TdW${id}`,
});

/** 23 приглашения: все статусы, все роли, выпущенные скриптом, длинное имя, истекающее сегодня.
 *  Отозванных приглашений в модераторы нет — на этом сочетании фильтров показан «Ничего не
 *  найдено». */
export const MOCK_INVITES: MockInvite[] = [
  invite('i01', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'kitsune_mod', '2026-10-02T09:14:00Z'),
  invite('i02', USER_ROLE.MODERATOR, INVITE_STATUS.ACTIVE, 'tanuki_admin', '2026-10-01T18:40:00Z'),
  invite('i03', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'night_owl', '2026-09-25T15:00:00Z'),
  invite('i04', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'tanuki_admin', '2026-09-28T10:05:00Z'),
  invite('i05', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'kitsune_mod', '2026-09-30T21:30:00Z'),
  invite('i06', USER_ROLE.ADMIN, INVITE_STATUS.USED, null, '2026-08-01T08:00:00Z', {
    usedBy: 'tanuki_admin',
    usedAt: '2026-08-01T08:12:00Z',
  }),
  invite('i07', USER_ROLE.USER, INVITE_STATUS.USED, 'tanuki_admin', '2026-08-03T11:00:00Z', {
    usedBy: 'kitsune_mod',
    usedAt: '2026-08-03T19:20:00Z',
  }),
  invite('i08', USER_ROLE.MODERATOR, INVITE_STATUS.USED, 'tanuki_admin', '2026-08-10T12:00:00Z', {
    usedBy: 'night_owl',
    usedAt: '2026-08-11T07:45:00Z',
  }),
  invite('i09', USER_ROLE.USER, INVITE_STATUS.USED, 'kitsune_mod', '2026-09-01T14:00:00Z', {
    usedBy: 'webtoon_guy',
    usedAt: '2026-09-02T10:10:00Z',
  }),
  invite('i10', USER_ROLE.USER, INVITE_STATUS.USED, 'kitsune_mod', '2026-09-05T16:30:00Z', {
    usedBy: 'the_longest_username_in_the_whole_catalog_42',
    usedAt: '2026-09-09T23:50:00Z',
  }),
  invite('i11', USER_ROLE.USER, INVITE_STATUS.USED, 'night_owl', '2026-09-12T09:00:00Z', {
    usedBy: 'manhwa_reader',
    usedAt: '2026-09-12T09:30:00Z',
  }),
  invite('i12', USER_ROLE.USER, INVITE_STATUS.USED, 'tanuki_admin', '2026-09-20T13:00:00Z', {
    usedBy: 'sleepy_panda',
    usedAt: '2026-09-24T18:00:00Z',
  }),
  invite('i13', USER_ROLE.USER, INVITE_STATUS.USED, 'kitsune_mod', '2026-09-22T17:15:00Z', {
    usedBy: 'moonlight_scan',
    usedAt: '2026-09-23T08:05:00Z',
  }),
  invite('i14', USER_ROLE.USER, INVITE_STATUS.EXPIRED, 'night_owl', '2026-08-20T10:00:00Z'),
  invite('i15', USER_ROLE.USER, INVITE_STATUS.EXPIRED, 'kitsune_mod', '2026-09-03T12:00:00Z'),
  invite('i16', USER_ROLE.MODERATOR, INVITE_STATUS.EXPIRED, 'tanuki_admin', '2026-09-10T15:00:00Z'),
  invite('i17', USER_ROLE.USER, INVITE_STATUS.EXPIRED, 'tanuki_admin', '2026-09-15T09:30:00Z'),
  invite('i18', USER_ROLE.USER, INVITE_STATUS.EXPIRED, 'kitsune_mod', '2026-09-18T20:00:00Z'),
  invite('i19', USER_ROLE.USER, INVITE_STATUS.REVOKED, 'kitsune_mod', '2026-09-06T10:00:00Z', {
    revokedBy: 'kitsune_mod',
    revokedAt: '2026-09-07T09:00:00Z',
  }),
  invite('i20', USER_ROLE.USER, INVITE_STATUS.REVOKED, 'night_owl', '2026-09-14T11:00:00Z', {
    revokedBy: 'tanuki_admin',
    revokedAt: '2026-09-15T16:20:00Z',
  }),
  invite('i21', USER_ROLE.USER, INVITE_STATUS.REVOKED, 'tanuki_admin', '2026-09-26T08:00:00Z', {
    revokedBy: 'tanuki_admin',
    revokedAt: '2026-09-26T08:03:00Z',
  }),
  invite('i22', USER_ROLE.USER, INVITE_STATUS.REVOKED, 'kitsune_mod', '2026-09-29T12:00:00Z', {
    revokedBy: 'tanuki_admin',
    revokedAt: '2026-10-01T10:00:00Z',
  }),
  invite('i23', USER_ROLE.USER, INVITE_STATUS.REVOKED, null, '2026-07-30T08:00:00Z', {
    revokedBy: 'tanuki_admin',
    revokedAt: '2026-08-01T08:20:00Z',
  }),
];

/** Чьими глазами смотрим. */
export const getSelfName = (viewer: Viewer) => {
  switch (viewer) {
    case VIEWER.ADMIN:
      return 'tanuki_admin';
    case VIEWER.MODERATOR:
      return 'kitsune_mod';
  }
};

let createdCount = 0;

/** Новое приглашение от смотрящего — для «Создать» и «Перевыпустить». */
export const createMockInvite = (role: UserRole, createdBy: string, now: string): MockInvite => {
  createdCount += 1;
  return {
    ...invite(
      `n${String(createdCount).padStart(2, '0')}`,
      role,
      INVITE_STATUS.ACTIVE,
      createdBy,
      now,
    ),
    code: `Xp7Lm2Qa9ZtW4kNc${createdCount}`,
  };
};

/** Базовая комбинация: на ней показана каждая ось, меняется только сравниваемая. */
export const BASE_CONFIG: PanelConfig = {
  table: TABLE_LAYOUT.MERGED,
  drawer: DRAWER_LAYOUT.FIELDS,
  revoke: REVOKE_CONFIRM.MODAL,
  link: LINK_RECOVERY.REISSUE,
  outcome: OUTCOME_COLUMN.SUMMARY,
  message: MESSAGE_PATTERN.CURRENT,
};

/** Итог: T3 + N1 + D1 + R1 + L1 + C1 + M9a. Серый нейтральный тон — через NEUTRAL_COLOR_CONTEXT. */
export const FINAL_CONFIG: PanelConfig = {
  table: TABLE_LAYOUT.OUTCOME,
  drawer: DRAWER_LAYOUT.FIELDS,
  revoke: REVOKE_CONFIRM.MODAL,
  link: LINK_RECOVERY.REISSUE,
  outcome: OUTCOME_COLUMN.RESULT,
  message: MESSAGE_PATTERN.TITLE_ICON,
};

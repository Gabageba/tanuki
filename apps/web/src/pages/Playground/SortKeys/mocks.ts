import {
  INVITE_STATUS,
  USER_ROLE,
  USER_STATUS,
  type InviteStatus,
  type ManagedUser,
  type UserRole,
  type UserStatus,
} from '@tanuki/contracts';
import type { MockInvite } from '../InvitesTable/models';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько живёт приглашение — как `INVITE_TTL_DAYS` в «Управлении». */
const INVITE_TTL_DAYS = 7;

const toServerDateTime = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;

/** Вход — относительно настоящего «сейчас», чтобы давность читалась как в приложении. */
const hoursAgo = (hours: number) => toServerDateTime(new Date(Date.now() - hours * 60 * 60 * 1000));

type UserExtra = Partial<
  Pick<ManagedUser, 'blockedUntil' | 'blockReason' | 'deletionScheduledAt' | 'avatarUrl'>
>;

const user = (
  id: string,
  username: string,
  email: string,
  role: UserRole,
  status: UserStatus,
  invitedByUsername: string | null,
  createdAt: string,
  lastSeenAt: string | null,
  extra: UserExtra = {},
): ManagedUser => ({
  id,
  username,
  email,
  role,
  status,
  invitedByUsername,
  createdAt,
  lastSeenAt,
  avatarUrl: extra.avatarUrl ?? null,
  blockedUntil: extra.blockedUntil ?? null,
  blockReason: extra.blockReason ?? null,
  deletionScheduledAt: extra.deletionScheduledAt ?? null,
});

/** Восемь человек: все статусы и роли, длинные имя и почта, «ни разу не входил», пригласивший из
 *  консоли. Пары с одной датой регистрации и разным входом — чтобы порядок по двум ключам столбца
 *  «Даты» заметно различался. */
export const MOCK_USERS: ManagedUser[] = [
  user(
    'u1',
    'tanuki_admin',
    'admin@tanuki.app',
    USER_ROLE.ADMIN,
    USER_STATUS.ACTIVE,
    null,
    '2026-06-01T10:00:00Z',
    hoursAgo(1),
  ),
  user(
    'u2',
    'kitsune_mod',
    'kitsune@mail.ru',
    USER_ROLE.MODERATOR,
    USER_STATUS.ACTIVE,
    'tanuki_admin',
    '2026-07-12T18:20:00Z',
    hoursAgo(11),
  ),
  user(
    'u3',
    'night_owl',
    'owl.reads.at.night@gmail.com',
    USER_ROLE.USER,
    USER_STATUS.ACTIVE,
    'kitsune_mod',
    '2026-09-20T09:00:00Z',
    hoursAgo(24 * 14),
  ),
  user(
    'u4',
    'very_long_username_reader_2026',
    'a.very.long.email.address.for.testing@example-domain.org',
    USER_ROLE.USER,
    USER_STATUS.BLOCKED,
    'kitsune_mod',
    '2026-09-20T15:40:00Z',
    hoursAgo(50),
    { blockedUntil: '2026-10-12T00:00:00Z', blockReason: 'Спам ссылками в комментариях к главам' },
  ),
  user(
    'u5',
    'quiet_reader',
    'quiet@yandex.ru',
    USER_ROLE.USER,
    USER_STATUS.UNVERIFIED,
    'night_owl',
    '2026-10-03T12:00:00Z',
    null,
  ),
  user(
    'u6',
    'grumpy_cat',
    'grumpy@proton.me',
    USER_ROLE.USER,
    USER_STATUS.BLOCKED,
    'tanuki_admin',
    '2026-08-15T08:00:00Z',
    hoursAgo(24 * 34),
    { blockReason: 'Оскорбления' },
  ),
  user(
    'u7',
    'leaving_soon',
    'bye@inbox.ru',
    USER_ROLE.USER,
    USER_STATUS.DELETION_SCHEDULED,
    null,
    '2026-08-15T19:30:00Z',
    hoursAgo(24 * 4),
    { deletionScheduledAt: '2026-10-15T00:00:00Z' },
  ),
  user(
    'u8',
    'bookworm',
    'bookworm@gmail.com',
    USER_ROLE.USER,
    USER_STATUS.ACTIVE,
    'tanuki_admin',
    '2026-09-28T11:10:00Z',
    hoursAgo(0.5),
  ),
];

type InviteExtra = Partial<Pick<MockInvite, 'usedBy' | 'usedAt' | 'revokedBy' | 'revokedAt'>>;

const invite = (
  id: string,
  role: UserRole,
  status: InviteStatus,
  createdBy: string | null,
  createdAt: string,
  extra: InviteExtra = {},
): MockInvite => ({
  id,
  role,
  status,
  createdBy,
  createdAt,
  expiresAt: toServerDateTime(new Date(new Date(createdAt).getTime() + INVITE_TTL_DAYS * DAY_MS)),
  usedBy: extra.usedBy ?? null,
  usedAt: extra.usedAt ?? null,
  revokedBy: extra.revokedBy ?? null,
  revokedAt: extra.revokedAt ?? null,
  code: `Rk3vQ9pL2mXa7TdW${id}`,
});

/** Семь приглашений: все статусы, все роли, выпущенное из консоли. Порядок по автору и по дате
 *  создания заметно различается. */
export const MOCK_INVITES: MockInvite[] = [
  invite('i1', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'kitsune_mod', '2026-10-02T09:14:00Z'),
  invite('i2', USER_ROLE.MODERATOR, INVITE_STATUS.ACTIVE, 'tanuki_admin', '2026-10-01T18:40:00Z'),
  invite('i3', USER_ROLE.USER, INVITE_STATUS.USED, 'night_owl', '2026-09-25T15:00:00Z', {
    usedBy: 'bookworm',
    usedAt: '2026-09-28T11:10:00Z',
  }),
  invite('i4', USER_ROLE.USER, INVITE_STATUS.EXPIRED, 'tanuki_admin', '2026-09-20T07:00:00Z'),
  invite('i5', USER_ROLE.ADMIN, INVITE_STATUS.USED, null, '2026-06-01T09:00:00Z', {
    usedBy: 'tanuki_admin',
    usedAt: '2026-06-01T10:00:00Z',
  }),
  invite('i6', USER_ROLE.USER, INVITE_STATUS.REVOKED, 'kitsune_mod', '2026-09-30T21:30:00Z', {
    revokedBy: 'tanuki_admin',
    revokedAt: '2026-10-01T08:00:00Z',
  }),
  invite('i7', USER_ROLE.USER, INVITE_STATUS.ACTIVE, 'tanuki_admin', '2026-09-29T10:05:00Z'),
];

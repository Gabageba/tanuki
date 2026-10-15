import {
  BOOKMARK_AVAILABILITY,
  DEVICE_TYPE,
  INVITE_STATUS,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  SOURCE_STATUS_REASON,
  USER_ROLE,
  USER_STATUS,
  VIEW_MODE,
  type BookmarkItem,
  type BookmarksResponse,
  type InvitesResponse,
  type ManagedUsersResponse,
  type NewChapterBookmarksResponse,
  type NotificationItem,
  type NotificationsPage,
  type ProfileStatisticsResponse,
  type SessionsResponse,
  type UserSettings,
} from '@tanuki/contracts';
import {
  BLOCKED_USER,
  BOOKMARK_ITEM,
  CURRENT_USER,
  INVITE,
  MANAGED_USER,
  MODERATOR_USER,
  USED_INVITE,
} from './fixtures';
import { TITLES } from './titles';

/** Данные аккаунта и администрирования для историй: статистика, сеансы, уведомления, закладки,
 *  пользователи и приглашения. */

const BASE = {
  count: 1,
  createdAt: '2026-10-15T09:00:00Z',
  updatedAt: '2026-10-15T09:00:00Z',
};

/** По записи на каждый тип уведомления — в порядке NOTIFICATION_TYPE. */
export const NOTIFICATIONS: NotificationItem[] = [
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000001',
    category: NOTIFICATION_CATEGORY.CHAPTERS,
    type: NOTIFICATION_TYPE.NEW_CHAPTERS,
    count: 3,
    payload: {
      titleId: BOOKMARK_ITEM.titleId,
      sourceId: BOOKMARK_ITEM.sourceId,
      name: BOOKMARK_ITEM.name,
      coverUrl: '',
    },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000002',
    category: NOTIFICATION_CATEGORY.ACCOUNT,
    type: NOTIFICATION_TYPE.EMAIL_CHANGED,
    payload: {},
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000003',
    category: NOTIFICATION_CATEGORY.ACCOUNT,
    type: NOTIFICATION_TYPE.DELETION_REQUESTED,
    payload: {},
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000004',
    category: NOTIFICATION_CATEGORY.ACCOUNT,
    type: NOTIFICATION_TYPE.NEW_DEVICE_LOGIN,
    payload: { device: 'Chrome · macOS' },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000005',
    category: NOTIFICATION_CATEGORY.SOURCES,
    type: NOTIFICATION_TYPE.SOURCE_DOWN,
    payload: { sourceId: 'readmanga_ru', reason: SOURCE_STATUS_REASON.PROBE_FAILED },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000006',
    category: NOTIFICATION_CATEGORY.SOURCES,
    type: NOTIFICATION_TYPE.SOURCE_RECOVERED,
    payload: { sourceId: 'readmanga_ru' },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000007',
    category: NOTIFICATION_CATEGORY.ADMINISTRATION,
    type: NOTIFICATION_TYPE.PARSER_DOWN,
    payload: { sourceId: 'mintmanga', reason: SOURCE_STATUS_REASON.REQUEST_FAILURES },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000008',
    category: NOTIFICATION_CATEGORY.ADMINISTRATION,
    type: NOTIFICATION_TYPE.PARSER_RECOVERED,
    payload: { sourceId: 'mintmanga' },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000009',
    category: NOTIFICATION_CATEGORY.ADMINISTRATION,
    type: NOTIFICATION_TYPE.INVITE_USED,
    payload: { inviteId: INVITE.id, username: 'night_reader' },
  },
  {
    ...BASE,
    id: '00000000-0000-4000-8000-000000000010',
    category: NOTIFICATION_CATEGORY.ADMINISTRATION,
    type: NOTIFICATION_TYPE.INVITE_EXPIRED,
    payload: { inviteId: INVITE.id },
  },
];
export const NOTIFICATIONS_PAGE: NotificationsPage = {
  items: NOTIFICATIONS,
  page: 1,
  total: NOTIFICATIONS.length,
};

const DAY_MS = 86_400_000;
const TODAY = Date.UTC(2026, 9, 15);

export const PROFILE_STATISTICS_RESPONSE: ProfileStatisticsResponse = {
  hasActivity: true,
  totals: { chapters: 1842, titles: 63 },
  today: { chapters: 7, averagePerDay: 5.4 },
  month: { chapters: 96, daysElapsed: 15, baselinePerDay: 4.8 },
  streak: { current: 12, best: 41 },
  chaptersByDay: Array.from({ length: 30 }, (_, index) => ({
    date: new Date(TODAY - (29 - index) * DAY_MS).toISOString().slice(0, 10),
    count: [0, 3, 5, 8, 2, 0, 11, 6, 4, 9][index % 10]!,
  })),
  chaptersByMonth: Array.from({ length: 12 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 10 + index, 1)).toISOString().slice(0, 10),
    count: [120, 95, 140, 180, 160, 75, 210, 190, 130, 150, 170, 96][index]!,
  })),
  readingTime: {
    totalMinutes: 1260,
    averagePerDayMinutes: 84,
    weekdaysPerDayMinutes: 62,
    weekendsPerDayMinutes: 140,
    peak: { fromHour: 22, percent: 38 },
    averageSessionMinutes: 27,
  },
  tags: ['Драма', 'Фэнтези', 'Сэйнэн', 'Приключения', 'Боевик', 'Психология'].map(
    (name, index) => ({ name, chapters: 620 - index * 85 }),
  ),
  sources: [
    { id: 'readmanga_ru', title: 'ReadManga', chapters: 940 },
    { id: 'mintmanga', title: 'MintManga', chapters: 510 },
    { id: 'mangalib', title: 'MangaLib', chapters: 392 },
  ],
};

export const EMPTY_PROFILE_STATISTICS_RESPONSE: ProfileStatisticsResponse = {
  ...PROFILE_STATISTICS_RESPONSE,
  hasActivity: false,
  totals: { chapters: 0, titles: 0 },
  today: { chapters: 0, averagePerDay: 0 },
  month: { chapters: 0, daysElapsed: 15, baselinePerDay: 0 },
  streak: { current: 0, best: 0 },
  chaptersByDay: PROFILE_STATISTICS_RESPONSE.chaptersByDay.map((point) => ({ ...point, count: 0 })),
  chaptersByMonth: PROFILE_STATISTICS_RESPONSE.chaptersByMonth.map((point) => ({
    ...point,
    count: 0,
  })),
  readingTime: {
    totalMinutes: 0,
    averagePerDayMinutes: 0,
    weekdaysPerDayMinutes: 0,
    weekendsPerDayMinutes: 0,
    peak: null,
    averageSessionMinutes: 0,
  },
  tags: [],
  sources: [],
};

export const SESSIONS_RESPONSE: SessionsResponse = {
  items: [
    {
      id: 'session-1',
      browser: 'Chrome 141',
      os: 'macOS',
      deviceType: DEVICE_TYPE.DESKTOP,
      ip: '93.184.216.34',
      lastSeenAt: '2026-10-15T09:00:00Z',
      createdAt: '2026-09-01T10:00:00Z',
      isCurrent: true,
    },
    {
      id: 'session-2',
      browser: 'Safari 19',
      os: 'iOS',
      deviceType: DEVICE_TYPE.MOBILE,
      ip: '93.184.216.35',
      lastSeenAt: '2026-10-14T22:30:00Z',
      createdAt: '2026-08-12T10:00:00Z',
      isCurrent: false,
    },
  ],
};

export const USER_SETTINGS: UserSettings = {
  viewMode: VIEW_MODE.GRID,
  timeZone: 'Europe/Moscow',
  showAdultSources: false,
  hideAdultTitles: true,
  saveSearchHistory: true,
};

const toBookmark = (index: number): BookmarkItem => {
  const title = TITLES[index]!;
  return {
    ...BOOKMARK_ITEM,
    titleId: title.id,
    sourceId: title.sourceId,
    name: title.name,
    coverUrl: title.coverUrl,
    contentRating: title.contentRating,
    type: title.type,
    progress:
      index % 3 === 2
        ? null
        : { chapterNumber: 10 + index, position: 10 + index, total: 40 + index * 3 },
    chaptersCount: 40 + index * 3,
    newChaptersCount: index % 4 === 0 ? 2 : 0,
    otherSources: index % 2 === 0 ? BOOKMARK_ITEM.otherSources : [],
    availability: index === 7 ? BOOKMARK_AVAILABILITY.SOURCE_DOWN : BOOKMARK_AVAILABILITY.AVAILABLE,
  };
};

export const BOOKMARKS_RESPONSE: BookmarksResponse = {
  items: Array.from({ length: 12 }, (_, index) => toBookmark(index)),
  page: 1,
  total: 12,
};

export const NEW_CHAPTER_BOOKMARKS_RESPONSE: NewChapterBookmarksResponse = {
  items: BOOKMARKS_RESPONSE.items.filter(({ newChaptersCount }) => newChaptersCount > 0),
};

export const MANAGED_USERS_RESPONSE: ManagedUsersResponse = {
  items: [
    {
      ...MANAGED_USER,
      ...CURRENT_USER,
      status: USER_STATUS.ACTIVE,
      blockedUntil: null,
      blockReason: null,
      deletionScheduledAt: null,
      invitedByUsername: null,
      lastSeenAt: '2026-10-15T09:00:00Z',
    },
    MODERATOR_USER,
    MANAGED_USER,
    BLOCKED_USER,
    {
      ...MANAGED_USER,
      id: 'user-unverified',
      username: 'new_reader',
      email: 'new@example.com',
      status: USER_STATUS.UNVERIFIED,
      lastSeenAt: null,
    },
    {
      ...MANAGED_USER,
      id: 'user-leaving',
      username: 'leaving_soon',
      email: 'bye@example.com',
      status: USER_STATUS.DELETION_SCHEDULED,
      deletionScheduledAt: '2026-10-28T00:00:00Z',
    },
  ],
  total: 6,
};

export const INVITES_RESPONSE: InvitesResponse = {
  items: [
    INVITE,
    { ...INVITE, id: 'invite-moderator', role: USER_ROLE.MODERATOR },
    USED_INVITE,
    {
      ...INVITE,
      id: 'invite-expired',
      status: INVITE_STATUS.EXPIRED,
      expiresAt: '2026-10-01T10:00:00Z',
    },
    {
      ...INVITE,
      id: 'invite-revoked',
      status: INVITE_STATUS.REVOKED,
      revokedByUsername: CURRENT_USER.username,
      revokedAt: '2026-10-10T10:00:00Z',
    },
  ],
  total: 5,
};

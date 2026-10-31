import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  CONTENT_RATING,
  FILTER_TYPE,
  RANGE_FORMAT,
  INVITE_STATUS,
  LANGUAGE,
  SOURCE_ACCESS,
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  SOURCE_CATALOG,
  SOURCE_CONTENT_TYPE,
  SOURCE_IDS,
  SOURCE_LOCALE,
  SOURCE_LOGIN_BENEFIT,
  SOURCE_LOGIN_REQUIREMENT,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  TITLE_TYPE,
  USER_ROLE,
  USER_STATUS,
  type BookmarkFoldersResponse,
  type BookmarkItem,
  type Chapter,
  type CreateInviteResponse,
  type CurrentUser,
  type FilterGroup,
  type Invite,
  type ManagedUser,
  type Source,
  type SourceAccountsResponse,
  type SourcesResponse,
} from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import { getCoverUrl } from './images';
import { HOME_SECTIONS, SELECTIONS_SOURCE_IDS } from './titles';

/** Данные историй Storybook: один зритель-админ и его окружение. Даты — фиксированные, чтобы
 *  истории не менялись день ото дня. */

export const CURRENT_USER: CurrentUser = {
  id: 'user-admin',
  email: 'admin@tanuki.local',
  username: 'tanuki_admin',
  role: USER_ROLE.ADMIN,
  language: LANGUAGE.RU,
  avatarUrl: null,
  createdAt: '2026-01-12T09:30:00Z',
};

/** Вход есть на Grouple — у остальных семейств с обязательным входом источник закрыт. */
const LOGGED_IN_FAMILIES: string[] = [SOURCE_AUTH_FAMILY.GROUPLE];

/** Источники, откуда можно импортировать закладки; Usagi — вошли, но импорт не поддерживается. */
const BOOKMARKS_IMPORT_SOURCE_IDS: string[] = [
  'readmanga_ru',
  'mintmanga',
  'selfmanga',
  'seimanga',
  'remanga',
  'senkuro',
  'senkognito',
  'tomilolib',
  'hentaichan_cc',
];

const createSource = (id: (typeof SOURCE_IDS)[number], position: number): Source => {
  const entry = SOURCE_CATALOG[id];
  const isLoggedIn = entry.authFamily !== null && LOGGED_IN_FAMILIES.includes(entry.authFamily);
  const isLocked = entry.loginRequirement === SOURCE_LOGIN_REQUIREMENT.REQUIRED && !isLoggedIn;
  const isBookmarksImportSupported = BOOKMARKS_IMPORT_SOURCE_IDS.includes(id);

  return {
    id,
    title: entry.title,
    domain: entry.domains[0],
    locale: SOURCE_LOCALE.RU,
    contentType: entry.contentType,
    status: entry.isBroken ? SOURCE_STATUS.DOWN : SOURCE_STATUS.OK,
    statusReason: entry.isBroken ? SOURCE_STATUS_REASON.BROKEN : null,
    statusChangedAt: entry.isBroken ? '2026-10-01T03:00:00Z' : null,
    checkedAt: '2026-10-15T03:00:00Z',
    failedProbeStreak: 0,
    lastError: null,
    isAdult: entry.isAdult,
    requiresVpn: entry.requiresVpn,
    sortOrders: [],
    supportsDirection: false,
    isSearchWithFiltersSupported: true,
    isBookmarksImportSupported,
    authFamily: entry.authFamily,
    loginRequirement: entry.loginRequirement,
    // Как на сервере: импорт закладок добавляется к пользам из каталога.
    loginBenefits: isBookmarksImportSupported
      ? [...entry.loginBenefits, SOURCE_LOGIN_BENEFIT.BOOKMARKS_IMPORT]
      : entry.loginBenefits,
    isLoggedIn,
    position,
    isEnabled: true,
    access: isLocked ? SOURCE_ACCESS.LOCKED : SOURCE_ACCESS.AVAILABLE,
    homeSections: SELECTIONS_SOURCE_IDS.includes(id) ? HOME_SECTIONS : [],
  };
};

export const SOURCES: Source[] = SOURCE_IDS.map(createSource);

export const SOURCES_RESPONSE = Object.fromEntries(
  Object.values(SOURCE_CONTENT_TYPE).map((contentType) => [
    contentType,
    SOURCES.filter((source) => source.contentType === contentType),
  ]),
) as SourcesResponse;

/** Источник, который проверка признала нерабочим, — для карточки на странице здоровья. */
export const DOWN_SOURCE: Source = {
  ...createSource('readmanga_ru', 0),
  status: SOURCE_STATUS.DOWN,
  statusReason: SOURCE_STATUS_REASON.PROBE_FAILED,
  statusChangedAt: '2026-10-14T03:00:00Z',
  failedProbeStreak: 3,
  lastError: 'getPages: HTTP 503 Service Unavailable',
};

export const SOURCE_ACCOUNTS_RESPONSE: SourceAccountsResponse = {
  items: [
    {
      family: SOURCE_AUTH_FAMILY.GROUPLE,
      sourceIds: null,
      login: 'tanuki_reader',
      status: SOURCE_ACCOUNT_STATUS.ACTIVE,
      hasSavedPassword: true,
      linkedAt: '2026-09-01T12:00:00Z',
    },
  ],
  isLinkingAvailable: true,
};

export const FOLDER_ID = {
  READING: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a01',
  PLANNED: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a02',
  COMPLETED: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a03',
  DROPPED: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a04',
  FAVORITE: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a05',
  ON_HOLD: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a07',
  CUSTOM: '0b6c8c1e-2a7d-4c8e-9a51-0d1c5f8b7a06',
} as const;

export const BOOKMARK_FOLDERS_RESPONSE: BookmarkFoldersResponse = {
  items: [
    {
      id: FOLDER_ID.READING,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
      name: null,
      icon: null,
      color: null,
      trackUpdates: true,
      count: 12,
      newCount: 3,
    },
    {
      id: FOLDER_ID.PLANNED,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
      name: null,
      icon: null,
      color: null,
      trackUpdates: false,
      count: 27,
      newCount: 0,
    },
    {
      id: FOLDER_ID.ON_HOLD,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.ON_HOLD,
      name: null,
      icon: null,
      color: null,
      trackUpdates: true,
      count: 4,
      newCount: 0,
    },
    {
      id: FOLDER_ID.COMPLETED,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.COMPLETED,
      name: null,
      icon: null,
      color: null,
      trackUpdates: false,
      count: 8,
      newCount: 0,
    },
    {
      id: FOLDER_ID.DROPPED,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.DROPPED,
      name: null,
      icon: null,
      color: null,
      trackUpdates: false,
      count: 2,
      newCount: 0,
    },
    {
      id: FOLDER_ID.FAVORITE,
      builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
      name: null,
      icon: null,
      color: null,
      trackUpdates: true,
      count: 5,
      newCount: 1,
    },
    {
      id: FOLDER_ID.CUSTOM,
      builtIn: null,
      name: 'Перечитать',
      icon: BOOKMARK_FOLDER_ICON.STAR,
      color: BOOKMARK_FOLDER_COLOR.BLUE,
      trackUpdates: true,
      count: 3,
      newCount: 0,
    },
  ],
  hasNew: true,
};

/** Папка уже в виде, какой её отдаёт `useBookmarkFolders`. */
export const FAVORITE_FOLDER: ResolvedBookmarkFolder = {
  id: FOLDER_ID.FAVORITE,
  builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
  name: 'Любимое',
  icon: BOOKMARK_FOLDER_ICON.HEART,
  color: BOOKMARK_FOLDER_COLOR.PINK,
  trackUpdates: true,
  count: 5,
  newCount: 1,
};

export const CUSTOM_FOLDER: ResolvedBookmarkFolder = {
  id: FOLDER_ID.CUSTOM,
  builtIn: null,
  name: 'Перечитать',
  icon: BOOKMARK_FOLDER_ICON.STAR,
  color: BOOKMARK_FOLDER_COLOR.BLUE,
  trackUpdates: true,
  count: 3,
  newCount: 0,
};

export const PLANNED_FOLDER: ResolvedBookmarkFolder = {
  id: FOLDER_ID.PLANNED,
  builtIn: BUILT_IN_BOOKMARK_FOLDER.PLANNED,
  name: 'В планах',
  icon: BOOKMARK_FOLDER_ICON.CLOCK,
  color: BOOKMARK_FOLDER_COLOR.YELLOW,
  trackUpdates: false,
  count: 27,
  newCount: 0,
};

export const BOOKMARK_ITEM: BookmarkItem = {
  titleId: 'readmanga_ru:berserk',
  sourceId: 'readmanga_ru',
  name: 'Берсерк',
  coverUrl: getCoverUrl('Берсерк'),
  contentRating: CONTENT_RATING.SUGGESTIVE,
  type: TITLE_TYPE.MANGA,
  folderId: FOLDER_ID.READING,
  progress: { chapterNumber: 120, position: 120, total: 374 },
  chaptersCount: 374,
  newChaptersCount: 0,
  latestChapterNumber: 374,
  latestNewAt: null,
  otherSources: [{ sourceId: 'mintmanga', titleId: 'mintmanga:berserk' }],
  availability: BOOKMARK_AVAILABILITY.AVAILABLE,
};

export const MANAGED_USER: ManagedUser = {
  id: 'user-reader',
  username: 'night_reader',
  email: 'reader@example.com',
  role: USER_ROLE.USER,
  status: USER_STATUS.ACTIVE,
  avatarUrl: null,
  blockedUntil: null,
  blockReason: null,
  deletionScheduledAt: null,
  invitedByUsername: CURRENT_USER.username,
  createdAt: '2026-03-04T18:20:00Z',
  lastSeenAt: '2026-10-14T21:05:00Z',
};

export const BLOCKED_USER: ManagedUser = {
  ...MANAGED_USER,
  id: 'user-blocked',
  username: 'spam_bot',
  email: 'spam@example.com',
  status: USER_STATUS.BLOCKED,
  blockedUntil: '2026-11-01T00:00:00Z',
  blockReason: 'Рассылка ссылок в комментариях',
};

export const MODERATOR_USER: ManagedUser = {
  ...MANAGED_USER,
  id: 'user-moderator',
  username: 'kind_moderator',
  email: 'moderator@example.com',
  role: USER_ROLE.MODERATOR,
};

export const INVITE: Invite = {
  id: 'invite-1',
  role: USER_ROLE.USER,
  status: INVITE_STATUS.ACTIVE,
  createdById: CURRENT_USER.id,
  createdByUsername: CURRENT_USER.username,
  usedByUsername: null,
  usedByAvatarUrl: null,
  revokedByUsername: null,
  createdAt: '2026-10-13T10:00:00Z',
  expiresAt: '2026-10-20T10:00:00Z',
  usedAt: null,
  revokedAt: null,
};

export const USED_INVITE: Invite = {
  ...INVITE,
  id: 'invite-2',
  status: INVITE_STATUS.USED,
  usedByUsername: MANAGED_USER.username,
  usedAt: '2026-10-14T08:00:00Z',
};

export const CREATED_INVITE: CreateInviteResponse = {
  ...INVITE,
  code: 'k7Qm2xVn9RtP',
};

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'genres',
    title: 'Жанры',
    type: FILTER_TYPE.SEARCHABLE_CHECKBOX_EXCLUDE,
    options: [
      'Боевик',
      'Драма',
      'Комедия',
      'Повседневность',
      'Приключения',
      'Романтика',
      'Сэйнэн',
      'Фэнтези',
    ].map((title, index) => ({ key: `genre-${index}`, title, count: 1200 - index * 100 })),
  },
  {
    id: 'type',
    title: 'Тип',
    type: FILTER_TYPE.RADIO,
    options: [
      { key: 'manga', title: 'Манга', count: null },
      { key: 'manhwa', title: 'Манхва', count: null },
      { key: 'manhua', title: 'Маньхуа', count: null },
    ],
    exclusiveGroup: 'route',
  },
  {
    id: 'status',
    title: 'Статус',
    type: FILTER_TYPE.RADIO,
    options: [
      { key: 'ongoing', title: 'Выходит', count: null },
      { key: 'completed', title: 'Завершён', count: null },
    ],
    exclusiveGroup: 'route',
  },
  {
    id: 'year',
    title: 'Год',
    type: FILTER_TYPE.RANGE,
    options: [],
    settings: {
      range: { min: 1980, max: 2026, format: RANGE_FORMAT.YEAR },
      presets: [
        { id: '2020s', label: '2020-е', min: 2020, max: 2026 },
        { id: '2010s', label: '2010-е', min: 2010, max: 2019 },
      ],
    },
  },
];

export const CHAPTERS: Chapter[] = Array.from({ length: 24 }, (_, index) => {
  const number = 24 - index;
  return {
    id: `readmanga_ru:berserk:${number}`,
    titleId: BOOKMARK_ITEM.titleId,
    number,
    volume: Math.ceil(number / 8),
    title: number % 5 === 0 ? `Затмение, часть ${number / 5}` : null,
    branch: null,
    scanlator: null,
    uploadedAt: `2026-${String(Math.ceil(number / 3)).padStart(2, '0')}-10T12:00:00Z`,
    url: '',
  };
});

import type { EnumLiteralsOf } from '@tanuki/contracts';

export const ROUTE_PATHS = {
  HOME: '/',
  SELECTIONS: '/selections',
  SOURCES: '/sources',
  SOURCES_HEALTH: '/sources/health',
  SEARCH: '/search',
  CATALOG: '/catalog/:sourceId',
  TITLE: '/title/:titleId',
  READER: '/title/:titleId/read/:chapterId',
  NOTIFICATIONS: '/notifications',
  BOOKMARKS: '/bookmarks',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  REVERT_EMAIL_CHANGE: '/revert-email-change',
  CANCEL_ACCOUNT_DELETION: '/cancel-account-deletion',
  ACCOUNT_DELETION_SCHEDULED: '/account-deletion-scheduled',
  /** Прежний адрес приглашений — перенаправляет на вкладку «Управления». */
  INVITES: '/invites',
  MANAGEMENT: '/management',
  TERMS: '/terms',
  PRIVACY_POLICY: '/privacy',
  PLAYGROUND: '/playground',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export type RoutePath = EnumLiteralsOf<typeof ROUTE_PATHS>;

/** Страница главы, с которой открыть читалку (с единицы) — так «Продолжить» возвращает туда, где
 *  остановились. Читалка берёт её один раз при входе, дальше адрес за чтением переписывает сама. */
export const READER_PAGE_SEARCH_PARAM = 'page';

/** Вкладка страницы тайтла — в адресе, чтобы возврат из читалки попадал обратно на главы. */
export const TITLE_TAB_SEARCH_PARAM = 'tab';

/** Вкладка настроек — в адресе, чтобы на вкладку можно было сослаться из других экранов. */
export const SETTINGS_TAB_SEARCH_PARAM = 'tab';

export const SETTINGS_TABS = {
  GENERAL: 'general',
  SOURCES: 'sources',
  READER: 'reader',
  BOOKMARKS: 'bookmarks',
  NOTIFICATIONS: 'notifications',
  SELECTIONS: 'selections',
} as const;
export type SettingsTab = EnumLiteralsOf<typeof SETTINGS_TABS>;

/** Вкладка настроек с папками закладок — на неё ведёт шестерёнка на /bookmarks. */
export const SETTINGS_BOOKMARKS_PATH = `${ROUTE_PATHS.SETTINGS}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.BOOKMARKS}`;

/** Вкладка настроек подборок — на неё ведёт пустая страница подборок. */
export const SETTINGS_SELECTIONS_PATH = `${ROUTE_PATHS.SETTINGS}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.SELECTIONS}`;

/** Вкладка настроек «Источники» — там меняется общий порядок источников. */
export const SETTINGS_SOURCES_PATH = `${ROUTE_PATHS.SETTINGS}?${SETTINGS_TAB_SEARCH_PARAM}=${SETTINGS_TABS.SOURCES}`;

/** Открытый источник на /selections — в адресе, чтобы на подборки источника можно было сослаться. */
export const SELECTIONS_SOURCE_SEARCH_PARAM = 'source';

/** Открытый блок и его вариант (период, страна) на /selections — в адресе, чтобы возврат со
 *  страницы тайтла открывал ту же вкладку. */
export const SELECTIONS_SECTION_SEARCH_PARAM = 'section';
export const SELECTIONS_VARIANT_SEARCH_PARAM = 'variant';

/** Открытая папка на /bookmarks — в адресе, чтобы на неё можно было сослаться из профиля. */
export const BOOKMARKS_FOLDER_SEARCH_PARAM = 'folder';

export const getBookmarksFolderPath = (folderId: string) =>
  `${ROUTE_PATHS.BOOKMARKS}?${BOOKMARKS_FOLDER_SEARCH_PARAM}=${folderId}`;

/** Открытая карточка на «Здоровье источников» — в адресе, чтобы уведомление вело сразу к источнику. */
export const SOURCES_HEALTH_SOURCE_SEARCH_PARAM = 'source';

export const getSourcesHealthPath = (sourceId: string) =>
  `${ROUTE_PATHS.SOURCES_HEALTH}?${SOURCES_HEALTH_SOURCE_SEARCH_PARAM}=${encodeURIComponent(sourceId)}`;

/** Вкладка «Управления» — в адресе, чтобы прежний /invites вёл сразу на приглашения. */
export const MANAGEMENT_TAB_SEARCH_PARAM = 'tab';

export const MANAGEMENT_TABS = {
  USERS: 'users',
  INVITES: 'invites',
} as const;
export type ManagementTab = EnumLiteralsOf<typeof MANAGEMENT_TABS>;

export const MANAGEMENT_INVITES_PATH = `${ROUTE_PATHS.MANAGEMENT}?${MANAGEMENT_TAB_SEARCH_PARAM}=${MANAGEMENT_TABS.INVITES}`;

/** Вкладка профиля — в адресе, чтобы на «Аккаунты источников» можно было сослаться из других
 *  экранов. */
export const PROFILE_TAB_SEARCH_PARAM = 'tab';

export const PROFILE_TABS = {
  STATISTICS: 'statistics',
  SIGN_IN_AND_SECURITY: 'signInAndSecurity',
  SOURCE_ACCOUNTS: 'sourceAccounts',
  DATA: 'data',
} as const;
export type ProfileTab = EnumLiteralsOf<typeof PROFILE_TABS>;

/** Куда вести человека, которому нужно войти в аккаунт источника. */
export const SOURCE_ACCOUNTS_PATH = `${ROUTE_PATHS.PROFILE}?${PROFILE_TAB_SEARCH_PARAM}=${PROFILE_TABS.SOURCE_ACCOUNTS}`;

export const TITLE_TABS = {
  INFO: 'info',
  CHAPTERS: 'chapters',
} as const;
export type TitleTab = EnumLiteralsOf<typeof TITLE_TABS>;

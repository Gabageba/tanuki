import type { EnumLiteralsOf } from '@tanuki/contracts';

export const ROUTE_PATHS = {
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
  INVITES: '/invites',
  TERMS: '/terms',
  PRIVACY_POLICY: '/privacy',
  PLAYGROUND: '/playground',
  PLAYGROUND_READING_MARKS: '/playground/reading-marks',
  PLAYGROUND_CHART_LABELS: '/playground/chart-labels',
  PLAYGROUND_ACCOUNT_GROUPS: '/playground/account-groups',
  PLAYGROUND_HEADER_BACKGROUND: '/playground/header-background',
  PLAYGROUND_SOURCES_SETUP: '/playground/sources-setup',
  PLAYGROUND_IMPORT_SOURCE_PICKER: '/playground/import-source-picker',
  PLAYGROUND_THEME_PICKER: '/playground/theme-picker',
  PLAYGROUND_ADULT_CONTENT: '/playground/adult-content',
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
} as const;
export type SettingsTab = EnumLiteralsOf<typeof SETTINGS_TABS>;

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

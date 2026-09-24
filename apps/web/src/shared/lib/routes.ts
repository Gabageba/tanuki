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
  INVITES: '/invites',
  TERMS: '/terms',
  PRIVACY_POLICY: '/privacy',
  PLAYGROUND: '/playground',
  PLAYGROUND_READING_MARKS: '/playground/reading-marks',
} as const;

export type RoutePath = EnumLiteralsOf<typeof ROUTE_PATHS>;

/** Страница главы, с которой открыть читалку (с единицы) — так «Продолжить» возвращает туда, где
 *  остановились. Читалка берёт её один раз при входе, дальше адрес за чтением переписывает сама. */
export const READER_PAGE_SEARCH_PARAM = 'page';

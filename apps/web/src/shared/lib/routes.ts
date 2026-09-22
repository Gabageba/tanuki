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
} as const;

export type RoutePath = EnumLiteralsOf<typeof ROUTE_PATHS>;

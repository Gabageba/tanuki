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
} as const;

export type RoutePath = EnumLiteralsOf<typeof ROUTE_PATHS>;

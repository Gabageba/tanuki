import type { EnumLiteralsOf, SEARCH_GROUP_STATUS, SearchGroupStatus } from '@tanuki/contracts';

/** Пометка о входе у источника: истёкшая сессия важнее требования. */
export const SOURCE_LOGIN_MARK = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  RELOGIN: 'relogin',
} as const;
export type SourceLoginMark = EnumLiteralsOf<typeof SOURCE_LOGIN_MARK>;

/** Почему источник не ответил — в поиске и на странице подборок. */
export type MissStatus = Exclude<SearchGroupStatus, typeof SEARCH_GROUP_STATUS.OK>;

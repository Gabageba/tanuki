import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Пометка о входе у источника: истёкшая сессия важнее требования. */
export const SOURCE_LOGIN_MARK = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  RELOGIN: 'relogin',
} as const;
export type SourceLoginMark = EnumLiteralsOf<typeof SOURCE_LOGIN_MARK>;

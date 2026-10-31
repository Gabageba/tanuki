import type { EnumLiteralsOf, RestoreFolderPolicy, RestoreProgressPolicy } from '@tanuki/contracts';

/** Откуда пришла чужая библиотека — от этого зависят слова в вопросах. */
export const MERGE_ORIGIN = {
  BACKUP: 'backup',
  SOURCE: 'source',
} as const;
export type MergeOrigin = EnumLiteralsOf<typeof MERGE_ORIGIN>;

/** Ответы на вопросы о конфликтах — общие у восстановления из копии и импорта из источника. */
export type MergeChoices = {
  folderPolicy: RestoreFolderPolicy;
  progressPolicy: RestoreProgressPolicy;
};

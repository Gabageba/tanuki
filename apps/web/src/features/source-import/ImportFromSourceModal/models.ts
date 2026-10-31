import {
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  type EnumLiteralsOf,
} from '@tanuki/contracts';
import type { MergeChoices } from '@/features/library-merge/models';

/** Шаги импорта: источник, чтение закладок, папки, вопросы (только при конфликтах), готово. */
export const SOURCE_IMPORT_STEP = {
  SOURCE: 'source',
  PARSING: 'parsing',
  FOLDERS: 'folders',
  QUESTIONS: 'questions',
  DONE: 'done',
} as const;
export type SourceImportStep = EnumLiteralsOf<typeof SOURCE_IMPORT_STEP>;

/** Форма шагов «Папки» и «Вопросы»: какие папки сайта забрать и ответы на конфликты. */
export type ImportChoices = MergeChoices & {
  folderIds: string[];
};

/** По умолчанию ничего не заменяется: свои папки, отметка дальше по главам. */
export const DEFAULT_IMPORT_CHOICES: ImportChoices = {
  folderIds: [],
  folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
  progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
};

/** Предел высоты списка папок; на низком экране он занимает не больше половины вьюпорта. */
export const FOLDERS_LIST_MAX_HEIGHT = 420;

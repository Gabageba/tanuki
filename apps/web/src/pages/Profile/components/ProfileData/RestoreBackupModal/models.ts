import {
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  type EnumLiteralsOf,
} from '@tanuki/contracts';
import type { MergeChoices } from '@/features/library-merge/models';

/** Шаги модалки: «Вопросы» — только если в копии есть конфликты. */
export const RESTORE_STEP = {
  FILE: 'file',
  SUMMARY: 'summary',
  QUESTIONS: 'questions',
  DONE: 'done',
} as const;
export type RestoreStep = EnumLiteralsOf<typeof RESTORE_STEP>;

/** Почему файл не принят — пишется под полем. */
export const BACKUP_FILE_ERROR = {
  NOT_BACKUP: 'notBackup',
  NEWER_VERSION: 'newerVersion',
} as const;
export type BackupFileError = EnumLiteralsOf<typeof BACKUP_FILE_ERROR>;

export type RestoreChoices = MergeChoices & {
  applySettings: boolean;
};

/** По умолчанию ничего не заменяется: свои папки, отметка дальше по главам, свои настройки. */
export const DEFAULT_RESTORE_CHOICES: RestoreChoices = {
  folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
  progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
  applySettings: false,
};

import type { TFunction } from 'i18next';
import {
  BACKUP_VERSION,
  BackupHeaderSchema,
  BackupSchema,
  type Backup,
  type BackupPreview,
} from '@tanuki/contracts';
import { BACKUP_FILE_ERROR, type BackupFileError } from './models';

export const hasFolderConflict = (preview: BackupPreview) => preview.bookmarks.otherFolder > 0;
export const hasProgressConflict = (preview: BackupPreview) => preview.progress.differs > 0;
export const hasConflicts = (preview: BackupPreview) =>
  hasFolderConflict(preview) || hasProgressConflict(preview);

/**
 * Копию уже восстанавливали: нового нет, спорного нет, пропускать нечего — показывать в сводке
 * нечего. Настройки не в счёт — они только по флажку. Пропущенное — в счёт: «всё уже есть» про
 * копию, чьи тайтлы не легли из-за источников, было бы неправдой.
 */
export const isAlreadyRestored = (preview: BackupPreview) =>
  preview.bookmarks.added +
    preview.bookmarks.skipped +
    preview.folders.added +
    preview.folders.overLimit +
    preview.progress.added +
    preview.progress.skipped +
    preview.chapterReads.added +
    preview.chapterReads.skipped ===
    0 && !hasConflicts(preview);

const readJson = async (file: File): Promise<unknown> => {
  try {
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
};

/**
 * Файл копии — до отправки на сервер: сначала метка формата и версия (чтобы отличить «не копию»
 * от «копии из новой версии»), потом схема целиком.
 */
export const parseBackupFile = async (
  file: File,
): Promise<
  { backup: Backup; error?: undefined } | { backup?: undefined; error: BackupFileError }
> => {
  const json = await readJson(file);
  const header = BackupHeaderSchema.safeParse(json);
  if (!header.success) return { error: BACKUP_FILE_ERROR.NOT_BACKUP };
  if (header.data.version > BACKUP_VERSION) return { error: BACKUP_FILE_ERROR.NEWER_VERSION };

  const backup = BackupSchema.safeParse(json);
  return backup.success ? { backup: backup.data } : { error: BACKUP_FILE_ERROR.NOT_BACKUP };
};

export const getBackupFileErrorLabel = (error: BackupFileError, t: TFunction) => {
  switch (error) {
    case BACKUP_FILE_ERROR.NOT_BACKUP:
      return t('notTanukiBackup');
    case BACKUP_FILE_ERROR.NEWER_VERSION:
      return t('backupFromNewerVersion');
  }
};

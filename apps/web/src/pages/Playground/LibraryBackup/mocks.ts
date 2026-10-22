import {
  RESULT_STATE,
  SUMMARY_STATE,
  type BackupPreview,
  type RestoreResult,
  type ResultState,
  type SummaryState,
} from './models';

const OWN_BACKUP = {
  fileName: 'tanuki-backup-2026-10-12.json',
  fileSize: '412 КБ',
  username: 'gabageba',
  exportedAt: '12\u00a0октября\u00a02026\u00a0г.',
  origin: 'tanuki.example.com',
};

/** Копия с другого инстанса: длинные логин и адрес должны переноситься, а не обрезаться. */
const FOREIGN_BACKUP = {
  fileName: 'tanuki-backup-2025-03-01.json',
  fileSize: '1,8 МБ',
  username: 'konstantin_the_very_long_username_2009',
  exportedAt: '1\u00a0марта\u00a02025\u00a0г.',
  origin: 'manga-reader.selfhosted.example-domain.org',
};

const CONFLICTS_PREVIEW: BackupPreview = {
  ...OWN_BACKUP,
  bookmarks: { added: 42, sameFolder: 12, otherFolder: 7, skipped: 3 },
  folders: { added: 2, matched: 4, overLimit: 0 },
  progress: { added: 30, differs: 5, furtherInBackup: 3 },
  chapterReads: 1204,
};

const NO_CONFLICTS_PREVIEW: BackupPreview = {
  ...OWN_BACKUP,
  bookmarks: { added: 18, sameFolder: 0, otherFolder: 0, skipped: 0 },
  folders: { added: 1, matched: 4, overLimit: 0 },
  progress: { added: 18, differs: 0, furtherInBackup: 0 },
  chapterReads: 312,
};

const NOTHING_NEW_PREVIEW: BackupPreview = {
  ...OWN_BACKUP,
  bookmarks: { added: 0, sameFolder: 57, otherFolder: 0, skipped: 0 },
  folders: { added: 0, matched: 5, overLimit: 0 },
  progress: { added: 0, differs: 0, furtherInBackup: 0 },
  chapterReads: 0,
};

const UNKNOWN_SOURCES_PREVIEW: BackupPreview = {
  ...FOREIGN_BACKUP,
  bookmarks: { added: 4, sameFolder: 0, otherFolder: 0, skipped: 64 },
  folders: { added: 0, matched: 2, overLimit: 3 },
  progress: { added: 2, differs: 0, furtherInBackup: 0 },
  chapterReads: 18,
};

const AFTER_CONFLICTS_RESULT: RestoreResult = {
  username: OWN_BACKUP.username,
  exportedAt: OWN_BACKUP.exportedAt,
  bookmarksAdded: 42,
  bookmarksMoved: 7,
  foldersCreated: 2,
  foldersOverLimit: 0,
  titlesToPlanned: 0,
  progressAdded: 30,
  progressUpdated: 3,
  chapterReadsAdded: 1204,
  settingsApplied: true,
  skipped: [{ sourceId: 'remanga', bookmarks: 3, progress: 0, chapterReads: 41 }],
};

const NOTHING_ADDED_RESULT: RestoreResult = {
  username: OWN_BACKUP.username,
  exportedAt: OWN_BACKUP.exportedAt,
  bookmarksAdded: 0,
  bookmarksMoved: 0,
  foldersCreated: 0,
  foldersOverLimit: 0,
  titlesToPlanned: 0,
  progressAdded: 0,
  progressUpdated: 0,
  chapterReadsAdded: 0,
  settingsApplied: false,
  skipped: [],
};

const SKIPPED_RESULT: RestoreResult = {
  username: FOREIGN_BACKUP.username,
  exportedAt: FOREIGN_BACKUP.exportedAt,
  bookmarksAdded: 4,
  bookmarksMoved: 0,
  foldersCreated: 0,
  foldersOverLimit: 3,
  titlesToPlanned: 4,
  progressAdded: 2,
  progressUpdated: 0,
  chapterReadsAdded: 18,
  settingsApplied: false,
  skipped: [
    { sourceId: 'remanga', bookmarks: 40, progress: 12, chapterReads: 233 },
    { sourceId: 'desu', bookmarks: 21, progress: 9, chapterReads: 140 },
    { sourceId: 'mangabuff', bookmarks: 3, progress: 0, chapterReads: 7 },
  ],
};

export const getMockPreview = (state: SummaryState) => {
  switch (state) {
    case SUMMARY_STATE.CONFLICTS:
      return CONFLICTS_PREVIEW;
    case SUMMARY_STATE.NO_CONFLICTS:
      return NO_CONFLICTS_PREVIEW;
    case SUMMARY_STATE.NOTHING_NEW:
      return NOTHING_NEW_PREVIEW;
    case SUMMARY_STATE.UNKNOWN_SOURCES:
      return UNKNOWN_SOURCES_PREVIEW;
  }
};

export const getMockResult = (state: ResultState) => {
  switch (state) {
    case RESULT_STATE.AFTER_CONFLICTS:
      return AFTER_CONFLICTS_RESULT;
    case RESULT_STATE.NOTHING_ADDED:
      return NOTHING_ADDED_RESULT;
    case RESULT_STATE.SKIPPED:
      return SKIPPED_RESULT;
  }
};

/** Выбранный файл: в песочнице его содержимое не читается. */
export const MOCK_FILE = new File(['{}'], OWN_BACKUP.fileName, { type: 'application/json' });
export const MOCK_FOREIGN_FILE = new File(['{}'], 'bookmarks-export.json', {
  type: 'application/json',
});

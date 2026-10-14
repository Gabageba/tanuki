import { Dexie, type EntityTable } from 'dexie';
import type {
  ChapterSnapshotRow,
  DownloadRow,
  DownloadSettingsRow,
  PendingProgressRow,
  QueueStateRow,
  SkippedChapterRow,
  TitleSnapshotRow,
} from './models';

/** База скачанного одного пользователя. Её открывают и страница, и service worker: изменения
 *  воркера Dexie разносит по вкладкам сам, и liveQuery видит их без сообщений. */
export type OfflineDb = Dexie & {
  downloads: EntityTable<DownloadRow, 'chapterId'>;
  chapters: EntityTable<ChapterSnapshotRow, 'chapterId'>;
  titles: EntityTable<TitleSnapshotRow, 'titleId'>;
  queue: EntityTable<QueueStateRow, 'id'>;
  pendingProgress: EntityTable<PendingProgressRow, 'titleId'>;
  settings: EntityTable<DownloadSettingsRow, 'id'>;
  skipped: EntityTable<SkippedChapterRow, 'chapterId'>;
};

const databases = new Map<string, OfflineDb>();

/** Скачанное привязано к пользователю: у каждого своя база, при выходе она остаётся. */
export const getOfflineDb = (userId: string): OfflineDb => {
  const existing = databases.get(userId);
  if (existing) return existing;

  const db = new Dexie(`tanuki-offline-${userId}`) as OfflineDb;
  db.version(1).stores({
    downloads: '&chapterId, titleId, status, order',
    chapters: '&chapterId, titleId',
    titles: '&titleId, sourceId, createdAt',
    queue: '&id',
    pendingProgress: '&titleId',
    settings: '&id',
    skipped: '&chapterId',
  });
  databases.set(userId, db);
  return db;
};

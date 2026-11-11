import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  ApiException,
  RestoreInProgressException,
  StorageUnavailableException,
} from '../common/errors';
import type { Database } from '../database/database.service';
import { bookmarkFolders, bookmarks } from '../database/schema';
import {
  lockSnapshotKeys,
  lockSnapshotLifecycle,
  writeTitleFallbacks,
} from './title-snapshot-storage';
import { TitleSnapshotsService } from './title-snapshots.service';
import { TITLE_SNAPSHOT_ORIGIN, type TitleSnapshotOrigin } from './models';
import type { FolderRef, GroupMove, MergeBookmarkInsert, MergeFolder } from './library-merge';

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Столько строк за один insert: у Postgres предел — 65 535 параметров на запрос. */
const CHUNK_SIZE = 1000;

export const chunk = <T>(rows: T[]) =>
  Array.from({ length: Math.ceil(rows.length / CHUNK_SIZE) }, (_, index) =>
    rows.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );

/**
 * Общая часть записи чужой библиотеки — восстановления из копии и импорта из источника: одна
 * запись за раз на пользователя, новые папки, закладки и переносы групп.
 */
@Injectable()
export class LibraryMergeService {
  constructor(private readonly snapshots: TitleSnapshotsService) {}
  /**
   * Одна запись за раз: вторая параллельная (восстановление или импорт) отвечает 409, а не
   * перемешивается с первой. Замок живёт до конца транзакции.
   */
  async lock(tx: Transaction, userId: string): Promise<void> {
    const [lock] = await tx.execute<{ locked: boolean }>(
      sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${`library-merge:${userId}`}, 0)) AS locked`,
    );
    if (!lock?.locked) throw new RestoreInProgressException();
    await lockSnapshotLifecycle(tx);
  }

  /** Новые свои папки — в конце, в порядке набора. Отдаёт id созданных по ключу чужой папки. */
  async writeFolders(
    tx: Transaction,
    userId: string,
    existing: { position: number }[],
    creates: MergeFolder[],
  ): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    if (creates.length === 0) return ids;

    const start = Math.max(-1, ...existing.map(({ position }) => position)) + 1;
    const created = await tx
      .insert(bookmarkFolders)
      .values(
        creates.map((folder, index) => ({
          userId,
          builtIn: null,
          name: folder.name,
          icon: folder.icon,
          color: folder.color,
          trackUpdates: folder.trackUpdates,
          position: start + index,
        })),
      )
      .returning({ id: bookmarkFolders.id });
    creates.forEach(({ key }, index) => ids.set(key, created[index]!.id));
    return ids;
  }

  async writeBookmarks(
    tx: Transaction,
    userId: string,
    inserts: MergeBookmarkInsert[],
    moves: GroupMove[],
    resolve: (ref: FolderRef) => string,
    provenance: { origin: TitleSnapshotOrigin; fetchedAt: Date } | null = null,
  ): Promise<void> {
    await lockSnapshotLifecycle(tx);
    await lockSnapshotKeys(
      tx,
      inserts.map(({ titleKey }) => titleKey),
    );
    for (const rows of chunk(inserts)) {
      const inserted = await tx
        .insert(bookmarks)
        .values(
          rows.map(({ row, titleKey, sourceId, folder }) => ({
            userId,
            titleKey,
            sourceId,
            folderId: resolve(folder),
            visitedAt: new Date(row.visitedAt),
            createdAt: new Date(row.createdAt),
          })),
        )
        .onConflictDoNothing()
        .returning({ titleKey: bookmarks.titleKey });
      const accepted = new Set(inserted.map(({ titleKey }) => titleKey));
      const metadata = rows
        .filter(({ titleKey }) => accepted.has(titleKey))
        .map(({ row, titleKey, sourceId }) => ({
          userId,
          titleKey,
          sourceId,
          titleId: row.titleId,
          name: row.name,
          coverUrl: row.coverUrl,
          contentRating: row.contentRating,
          type: row.type,
          updatedAt: new Date(row.updatedAt ?? row.createdAt),
        }));
      if (provenance) {
        switch (provenance.origin) {
          case TITLE_SNAPSHOT_ORIGIN.SOURCE_BOOKMARK:
            await this.snapshots.recordSourceBookmarks(tx, metadata, provenance.fetchedAt);
            break;
          case TITLE_SNAPSHOT_ORIGIN.SOURCE_DETAILS:
            throw new Error('Merge expects a bookmark list, not full details');
        }
      } else {
        await writeTitleFallbacks(tx, metadata);
      }
    }
    for (const { titleKeys, folder } of moves) {
      await tx
        .update(bookmarks)
        .set({ folderId: resolve(folder), updatedAt: sql`now()` })
        .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, titleKeys)));
    }
  }

  /** Ошибки API проходят как есть, сбой базы — «правка не сохранена». */
  async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }
  }
}

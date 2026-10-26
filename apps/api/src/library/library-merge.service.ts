import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  ApiException,
  RestoreInProgressException,
  StorageUnavailableException,
} from '../common/errors';
import type { Database } from '../database/database.service';
import { bookmarkFolders, bookmarks } from '../database/schema';
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
  /**
   * Одна запись за раз: вторая параллельная (восстановление или импорт) отвечает 409, а не
   * перемешивается с первой. Замок живёт до конца транзакции.
   */
  async lock(tx: Transaction, userId: string): Promise<void> {
    const [lock] = await tx.execute<{ locked: boolean }>(
      sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${`library-merge:${userId}`}, 0)) AS locked`,
    );
    if (!lock?.locked) throw new RestoreInProgressException();
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
  ): Promise<void> {
    for (const rows of chunk(inserts)) {
      await tx
        .insert(bookmarks)
        .values(
          rows.map(({ row, titleKey, sourceId, folder }) => ({
            userId,
            titleKey,
            sourceId,
            titleId: row.titleId,
            folderId: resolve(folder),
            name: row.name,
            coverUrl: row.coverUrl,
            contentRating: row.contentRating,
            type: row.type,
            visitedAt: new Date(row.visitedAt),
            createdAt: new Date(row.createdAt),
          })),
        )
        .onConflictDoNothing();
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

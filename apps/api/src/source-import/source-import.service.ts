import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IMPORT_PROGRESS_STATUS,
  type SourceImportPreview,
  type SourceImportRequest,
  type SourceImportResult,
} from '@tanuki/contracts';
import { DatabaseService, type Database } from '../database/database.service';
import { bookmarks, readingProgress, sourceImportProgress } from '../database/schema';
import { BookmarkFoldersService } from '../library/bookmark-folders.service';
import { listUntrackedMovedKeys, type FolderRef } from '../library/library-merge';
import { chunk, LibraryMergeService, type Transaction } from '../library/library-merge.service';
import { linkKeyOf, TitleLinksService } from '../matches/title-links.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawBookmarkFolder } from '../parsers-client/parsers-client.types';
import { buildSourceImportPlan, type SourceImportPlanInput } from './source-import-plan';
import type { SourceImportPlan } from './models';

export const toSourceImportResult = (
  sourceId: string,
  plan: SourceImportPlan,
): SourceImportResult => ({
  sourceId,
  ...plan.counts,
  pendingProgress: plan.pendingProgress.length,
});

/**
 * Импорт закладок с сайта, где у пользователя есть аккаунт. Сводка и запись читают сайт каждая
 * сама — сервер не хранит сводку между запросами и не доверяет присланным снимкам. Запись — одной
 * транзакцией и одна за раз на пользователя, общая с восстановлением из копии. «Где остановился»
 * записывается не сразу: строки ожидания достраивает крон (SourceImportProgressService).
 */
@Injectable()
export class SourceImportService {
  constructor(
    private readonly database: DatabaseService,
    private readonly folders: BookmarkFoldersService,
    private readonly links: TitleLinksService,
    private readonly notifications: NotificationsService,
    private readonly merge: LibraryMergeService,
    private readonly parsersClient: ParsersClientService,
  ) {}

  async preview(userId: string, sourceId: string): Promise<SourceImportPreview> {
    const siteFolders = await this.parsersClient.getBookmarks(sourceId);
    const plan = await this.merge.run(async () =>
      buildSourceImportPlan({
        ...(await this.loadState(this.database.db, userId, sourceId, siteFolders)),
        sourceId,
        siteFolders,
        folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
        progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
        now: new Date(),
      }),
    );
    return { sourceId, folders: plan.folders };
  }

  async import(userId: string, request: SourceImportRequest): Promise<SourceImportResult> {
    const { sourceId, folderIds, folderPolicy, progressPolicy } = request;
    const siteFolders = await this.parsersClient.getBookmarks(sourceId);
    // Встроенные папки — до транзакции: «В планах» нужна плану как запасная папка.
    await this.folders.list(userId);

    const { plan, untrackedKeys } = await this.merge.run(() =>
      this.database.db.transaction(async (tx) => {
        await this.merge.lock(tx, userId);

        const state = await this.loadState(tx, userId, sourceId, siteFolders);
        const importPlan = buildSourceImportPlan({
          ...state,
          sourceId,
          siteFolders,
          selectedFolderIds: new Set(folderIds),
          folderPolicy,
          progressPolicy,
          now: new Date(),
        });
        const createdIds = await this.merge.writeFolders(
          tx,
          userId,
          state.folders,
          importPlan.folderCreates,
        );
        const resolve = (ref: FolderRef) => ref.id ?? createdIds.get(ref.key)!;

        await this.merge.writeBookmarks(
          tx,
          userId,
          importPlan.bookmarkInserts,
          importPlan.groupMoves,
          resolve,
        );
        await this.writePendingProgress(tx, userId, sourceId, importPlan, progressPolicy);

        return {
          plan: importPlan,
          untrackedKeys: listUntrackedMovedKeys(
            state.folders,
            importPlan.folderCreates,
            createdIds,
            importPlan.groupMoves,
            resolve,
          ),
        };
      }),
    );

    if (untrackedKeys.length > 0) {
      const canonical = await this.links.listCanonicalKeys(untrackedKeys);
      await this.notifications.removeNewChapters(userId, [
        ...new Set([...untrackedKeys, ...canonical.values()]),
      ]);
    }
    return toSourceImportResult(sourceId, plan);
  }

  /** Строки ожидания одного импорта — под общим `importId`, чтобы в конце прислать одно уведомление. */
  private async writePendingProgress(
    tx: Transaction,
    userId: string,
    sourceId: string,
    plan: SourceImportPlan,
    progressPolicy: SourceImportRequest['progressPolicy'],
  ): Promise<void> {
    const importId = randomUUID();
    for (const rows of chunk(plan.pendingProgress)) {
      await tx.insert(sourceImportProgress).values(
        rows.map((row) => ({
          userId,
          importId,
          sourceId,
          titleKey: row.titleKey,
          titleId: row.titleId,
          chapterNumber: row.chapterNumber,
          progressPolicy,
          status: SOURCE_IMPORT_PROGRESS_STATUS.PENDING,
        })),
      );
    }
  }

  /** Библиотека пользователя и группы ключей — всё, что нужно расчёту плана. */
  private async loadState(
    db: Database | Transaction,
    userId: string,
    sourceId: string,
    siteFolders: RawBookmarkFolder[],
  ): Promise<Pick<SourceImportPlanInput, 'folders' | 'bookmarks' | 'progress' | 'canonical'>> {
    const [folders, userBookmarks, progress] = await Promise.all([
      this.folders.list(userId),
      db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
      db
        .select({
          titleKey: readingProgress.titleKey,
          chapterNumber: readingProgress.chapterNumber,
          updatedAt: readingProgress.updatedAt,
        })
        .from(readingProgress)
        .where(eq(readingProgress.userId, userId)),
    ]);

    const siteKeys = siteFolders.flatMap(({ items }) =>
      items.map((item) => linkKeyOf(sourceId, item.url)),
    );
    const canonical = await this.links.listCanonicalKeys([
      ...new Set([
        ...userBookmarks.map(({ titleKey }) => titleKey),
        ...progress.map(({ titleKey }) => titleKey),
        ...siteKeys,
      ]),
    ]);

    return { folders, bookmarks: userBookmarks, progress, canonical };
  }
}

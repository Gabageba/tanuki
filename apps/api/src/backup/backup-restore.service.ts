import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  BACKUP_VERSION,
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  SOURCE_IDS,
  type Backup,
  type BackupPreview,
  type BackupRestoreResult,
  type RestoreBackupRequest,
} from '@tanuki/contracts';
import {
  ApiException,
  BackupVersionUnsupportedException,
  RestoreInProgressException,
  StorageUnavailableException,
} from '../common/errors';
import { DatabaseService, type Database } from '../database/database.service';
import {
  bookmarkFolders,
  bookmarks,
  chapterReads,
  disabledSources,
  readerSettings,
  readingActivity,
  readingProgress,
  searchHistory,
  userSettings,
} from '../database/schema';
import { TitleLinksService } from '../matches/title-links.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookmarkFoldersService } from '../library/bookmark-folders.service';
import { titleKeyOf } from '../library/bookmarks.service';
import { buildRestorePlan, type RestorePlanInput } from './backup-plan';
import { toUserSettingsWrite } from './backup-settings';
import type { FolderRef, RestorePlan } from './models';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Столько строк за один insert: у Postgres предел — 65 535 параметров на запрос. */
const CHUNK_SIZE = 1000;

const chunk = <T>(rows: T[]) =>
  Array.from({ length: Math.ceil(rows.length / CHUNK_SIZE) }, (_, index) =>
    rows.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );

const KNOWN_SOURCE_IDS: ReadonlySet<string> = new Set(SOURCE_IDS);

/** Копию новее поддерживаемого формата не разбираем: в ней могут быть поля, которых мы не знаем. */
export const assertBackupVersion = (backup: Backup) => {
  if (backup.version > BACKUP_VERSION) throw new BackupVersionUnsupportedException();
};

export const toBackupPreview = (backup: Backup, plan: RestorePlan): BackupPreview => ({
  username: backup.username,
  exportedAt: backup.exportedAt,
  origin: backup.origin,
  bookmarks: {
    added: plan.counts.bookmarksAdded,
    sameFolder: plan.counts.bookmarksSameFolder,
    otherFolder: plan.counts.bookmarksOtherFolder,
    skipped: plan.counts.bookmarksSkipped,
  },
  folders: {
    added: plan.counts.foldersAdded,
    matched: plan.counts.foldersMatched,
    overLimit: plan.counts.foldersOverLimit,
  },
  progress: {
    added: plan.counts.progressAdded,
    differs: plan.counts.progressDiffers,
    skipped: plan.counts.progressSkipped,
  },
  chapterReads: {
    added: plan.counts.chapterReadsAdded,
    skipped: plan.counts.chapterReadsSkipped,
  },
});

export const toRestoreResult = (
  backup: Backup,
  plan: RestorePlan,
  settingsApplied: boolean,
): BackupRestoreResult => ({
  username: backup.username,
  exportedAt: backup.exportedAt,
  bookmarksAdded: plan.counts.bookmarksAdded,
  bookmarksMoved: plan.counts.bookmarksMoved,
  titlesToPlanned: plan.counts.titlesToPlanned,
  foldersCreated: plan.counts.foldersAdded,
  foldersOverLimit: plan.counts.foldersOverLimit,
  progressAdded: plan.counts.progressAdded,
  progressUpdated: plan.counts.progressUpdated,
  chapterReadsAdded: plan.counts.chapterReadsAdded,
  settingsApplied,
  skipped: {
    bookmarks: plan.counts.bookmarksSkipped,
    progress: plan.counts.progressSkipped,
    chapterReads: plan.counts.chapterReadsSkipped,
  },
});

/**
 * Восстановление из резервной копии. Сводка и запись считают один и тот же план «что куда
 * ляжет»; сводка его только показывает. Запись — одной транзакцией и по одной за раз на
 * пользователя: вторая параллельная отвечает 409, а не перемешивается с первой.
 */
@Injectable()
export class BackupRestoreService {
  constructor(
    private readonly database: DatabaseService,
    private readonly folders: BookmarkFoldersService,
    private readonly links: TitleLinksService,
    private readonly notifications: NotificationsService,
  ) {}

  async preview(userId: string, backup: Backup): Promise<BackupPreview> {
    assertBackupVersion(backup);
    const plan = await this.run(async () =>
      buildRestorePlan({
        ...(await this.loadState(this.database.db, userId, backup)),
        backup,
        folderPolicy: RESTORE_FOLDER_POLICY.KEEP_MINE,
        progressPolicy: RESTORE_PROGRESS_POLICY.FURTHEST,
      }),
    );
    return toBackupPreview(backup, plan);
  }

  async restore(userId: string, request: RestoreBackupRequest): Promise<BackupRestoreResult> {
    const { backup, folderPolicy, progressPolicy, applySettings } = request;
    assertBackupVersion(backup);
    // Встроенные папки — до транзакции: «В планах» нужна плану как запасная папка.
    await this.folders.list(userId);

    const { plan, untrackedKeys } = await this.run(() =>
      this.database.db.transaction(async (tx) => {
        const [lock] = await tx.execute<{ locked: boolean }>(
          sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${`backup-restore:${userId}`}, 0)) AS locked`,
        );
        if (!lock?.locked) throw new RestoreInProgressException();

        const state = await this.loadState(tx, userId, backup);
        const restorePlan = buildRestorePlan({ ...state, backup, folderPolicy, progressPolicy });
        const folderIds = await this.writeFolders(tx, userId, state.folders, restorePlan);
        const resolve = (ref: FolderRef) => ref.id ?? folderIds.get(ref.key)!;

        await this.writeBookmarks(tx, userId, restorePlan, resolve);
        await this.writeProgress(tx, userId, restorePlan);
        await this.writeStatistics(tx, userId, restorePlan);
        if (applySettings) await this.writeSettings(tx, userId, backup);

        // Тайтлы, переехавшие в папку без слежения: «новые главы» о них из ленты убираются.
        const trackedIds = new Set(
          [
            ...state.folders,
            ...restorePlan.folderCreates.map(({ key, trackUpdates }) => ({
              id: folderIds.get(key)!,
              trackUpdates,
            })),
          ]
            .filter(({ trackUpdates }) => trackUpdates)
            .map(({ id }) => id),
        );
        return {
          plan: restorePlan,
          untrackedKeys: restorePlan.groupMoves
            .filter(({ folder }) => !trackedIds.has(resolve(folder)))
            .flatMap(({ titleKeys }) => titleKeys),
        };
      }),
    );

    if (untrackedKeys.length > 0) {
      const canonical = await this.links.listCanonicalKeys(untrackedKeys);
      await this.notifications.removeNewChapters(userId, [
        ...new Set([...untrackedKeys, ...canonical.values()]),
      ]);
    }
    return toRestoreResult(backup, plan, applySettings);
  }

  /** Библиотека пользователя и группы ключей — всё, что нужно расчёту плана. */
  private async loadState(
    db: Database | Transaction,
    userId: string,
    backup: Backup,
  ): Promise<Omit<RestorePlanInput, 'backup' | 'folderPolicy' | 'progressPolicy'>> {
    const [folders, userBookmarks, progress, reads] = await Promise.all([
      this.folders.list(userId),
      db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
      db
        .select({
          titleKey: readingProgress.titleKey,
          chapterId: readingProgress.chapterId,
          chapterNumber: readingProgress.chapterNumber,
          pageIndex: readingProgress.pageIndex,
          updatedAt: readingProgress.updatedAt,
        })
        .from(readingProgress)
        .where(eq(readingProgress.userId, userId)),
      db
        .select({ chapterId: chapterReads.chapterId })
        .from(chapterReads)
        .where(eq(chapterReads.userId, userId)),
    ]);

    const backupKeys = backup.bookmarks.flatMap(({ titleId }) => {
      try {
        return [titleKeyOf(titleId)];
      } catch {
        return [];
      }
    });
    const canonical = await this.links.listCanonicalKeys([
      ...new Set([...userBookmarks.map(({ titleKey }) => titleKey), ...backupKeys]),
    ]);

    return {
      knownSourceIds: KNOWN_SOURCE_IDS,
      folders,
      bookmarks: userBookmarks,
      progress,
      chapterReadIds: new Set(reads.map(({ chapterId }) => chapterId)),
      canonical,
    };
  }

  /** Новые свои папки — в конце, в порядке копии. Отдаёт id созданных по ключу папки копии. */
  private async writeFolders(
    tx: Transaction,
    userId: string,
    existing: { position: number }[],
    plan: RestorePlan,
  ): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    if (plan.folderCreates.length === 0) return ids;

    const start = Math.max(-1, ...existing.map(({ position }) => position)) + 1;
    const created = await tx
      .insert(bookmarkFolders)
      .values(
        plan.folderCreates.map((folder, index) => ({
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
    plan.folderCreates.forEach(({ key }, index) => ids.set(key, created[index]!.id));
    return ids;
  }

  private async writeBookmarks(
    tx: Transaction,
    userId: string,
    plan: RestorePlan,
    resolve: (ref: FolderRef) => string,
  ): Promise<void> {
    for (const rows of chunk(plan.bookmarkInserts)) {
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
    for (const { titleKeys, folder } of plan.groupMoves) {
      await tx
        .update(bookmarks)
        .set({ folderId: resolve(folder), updatedAt: sql`now()` })
        .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, titleKeys)));
    }
  }

  private async writeProgress(tx: Transaction, userId: string, plan: RestorePlan): Promise<void> {
    for (const rows of chunk(plan.progressUpserts)) {
      await tx
        .insert(readingProgress)
        .values(
          rows.map((row) => ({
            userId,
            titleKey: row.titleKey,
            sourceId: row.sourceId,
            chapterId: row.chapterId,
            chapterVolume: row.chapterVolume,
            chapterNumber: row.chapterNumber,
            chapterTitle: row.chapterTitle,
            branchId: row.branchId,
            pageIndex: row.pageIndex,
            titleId: row.titleId,
            titleName: row.titleName,
            coverUrl: row.coverUrl,
            contentRating: row.contentRating,
            type: row.type,
            hiddenAt: row.hiddenAt ? new Date(row.hiddenAt) : null,
            updatedAt: new Date(row.updatedAt),
          })),
        )
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.titleKey],
          set: {
            sourceId: sql`excluded.source_id`,
            chapterId: sql`excluded.chapter_id`,
            chapterVolume: sql`excluded.chapter_volume`,
            chapterNumber: sql`excluded.chapter_number`,
            chapterTitle: sql`excluded.chapter_title`,
            branchId: sql`excluded.branch_id`,
            pageIndex: sql`excluded.page_index`,
            titleId: sql`excluded.title_id`,
            titleName: sql`excluded.title_name`,
            coverUrl: sql`excluded.cover_url`,
            contentRating: sql`excluded.content_rating`,
            type: sql`excluded.type`,
            hiddenAt: sql`excluded.hidden_at`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }
  }

  /** Статистика — всегда объединение: журнал без повторов, минута чтения — большее из двух. */
  private async writeStatistics(tx: Transaction, userId: string, plan: RestorePlan): Promise<void> {
    for (const rows of chunk(plan.chapterReads)) {
      await tx
        .insert(chapterReads)
        .values(
          rows.map((row) => ({
            userId,
            chapterId: row.chapterId,
            sourceId: row.sourceId,
            titleKey: row.titleKey,
            chapterVolume: row.chapterVolume,
            chapterNumber: row.chapterNumber,
            tags: row.tags,
            readAt: new Date(row.readAt),
          })),
        )
        .onConflictDoNothing();
    }
    for (const rows of chunk(plan.readingActivity)) {
      await tx
        .insert(readingActivity)
        .values(rows.map((row) => ({ userId, minute: new Date(row.minute), seconds: row.seconds })))
        .onConflictDoUpdate({
          target: [readingActivity.userId, readingActivity.minute],
          set: { seconds: sql`greatest(${readingActivity.seconds}, excluded.seconds)` },
        });
    }
  }

  /** Настройки копии заменяют свои целиком; источники, которых здесь нет, отбрасываются. */
  private async writeSettings(tx: Transaction, userId: string, backup: Backup): Promise<void> {
    const [current] = await tx
      .select({ ageConfirmed: userSettings.ageConfirmed })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    const values = toUserSettingsWrite(
      backup.settings,
      KNOWN_SOURCE_IDS,
      current?.ageConfirmed === true,
    );
    await tx
      .insert(userSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...values, updatedAt: sql`now()` },
      });
    // Как при выключении в настройках: история поиска стирается вместе с флажком.
    if (values.saveSearchHistory === false) {
      await tx.delete(searchHistory).where(eq(searchHistory.userId, userId));
    }

    const { reader } = backup.settings;
    if (reader) {
      await tx
        .insert(readerSettings)
        .values({ userId, ...reader })
        .onConflictDoUpdate({
          target: readerSettings.userId,
          set: { ...reader, updatedAt: sql`now()` },
        });
    } else {
      // Читалку в копии не настраивали — снова действуют умолчания.
      await tx.delete(readerSettings).where(eq(readerSettings.userId, userId));
    }

    await tx.delete(disabledSources).where(eq(disabledSources.userId, userId));
    const disabled = backup.settings.disabledSources.filter((id) => KNOWN_SOURCE_IDS.has(id));
    if (disabled.length > 0) {
      await tx
        .insert(disabledSources)
        .values([...new Set(disabled)].map((sourceId) => ({ userId, sourceId })))
        .onConflictDoNothing();
    }
  }

  /** Ошибки API проходят как есть, сбой базы — «правка не сохранена». */
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new StorageUnavailableException();
    }
  }
}

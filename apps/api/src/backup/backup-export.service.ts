import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { BACKUP_FORMAT, BACKUP_VERSION, type Backup } from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import { NotFoundApiException, StorageUnavailableException } from '../common/errors';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { DatabaseService } from '../database/database.service';
import {
  bookmarkFolders,
  bookmarks,
  chapterReads,
  disabledSources,
  readerSettings,
  readingActivity,
  readingProgress,
  userSettings,
  users,
} from '../database/schema';
import { BookmarkFoldersService } from '../library/bookmark-folders.service';

const toDateTime = (date: Date) => toServerDateTime(date.getTime());

/**
 * Собирает резервную копию из таблиц: вся библиотека и настройки пользователя. Секреты аккаунтов
 * источников, история поиска, уведомления, устройства и подтверждение возраста сюда не попадают.
 */
@Injectable()
export class BackupExportService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly folders: BookmarkFoldersService,
  ) {}

  async export(userId: string): Promise<Backup> {
    // Встроенные папки создаются при первом обращении — у копии их строки должны быть всегда.
    await this.folders.list(userId);
    const { db } = this.database;

    try {
      const [
        [user],
        [settings],
        [reader],
        disabled,
        folders,
        bookmarkRows,
        progress,
        reads,
        activity,
      ] = await Promise.all([
        db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1),
        db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
        db.select().from(readerSettings).where(eq(readerSettings.userId, userId)).limit(1),
        db.select().from(disabledSources).where(eq(disabledSources.userId, userId)),
        db
          .select()
          .from(bookmarkFolders)
          .where(eq(bookmarkFolders.userId, userId))
          .orderBy(asc(bookmarkFolders.position), asc(bookmarkFolders.createdAt)),
        db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
        db.select().from(readingProgress).where(eq(readingProgress.userId, userId)),
        db.select().from(chapterReads).where(eq(chapterReads.userId, userId)),
        db
          .select()
          .from(readingActivity)
          .where(eq(readingActivity.userId, userId))
          .orderBy(asc(readingActivity.minute)),
      ]);
      if (!user) throw new NotFoundApiException();

      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: toServerDateTime(Date.now()),
        origin: this.env.APP_URL,
        username: user.username,
        settings: {
          // Колонка null — поля в копии нет: как и в ответе /user-settings, «не сохраняли».
          user: {
            colorScheme: settings?.colorScheme ?? undefined,
            viewMode: settings?.viewMode ?? undefined,
            language: settings?.language ?? undefined,
            exclusiveFilterConfirmDismissed: settings?.exclusiveFilterConfirmDismissed ?? undefined,
            timeZone: settings?.timeZone ?? undefined,
            showAdultSources: settings?.showAdultSources ?? undefined,
            hideAdultTitles: settings?.hideAdultTitles ?? undefined,
            saveSearchHistory: settings?.saveSearchHistory ?? undefined,
            collapsedSearchSources: settings?.collapsedSearchSources ?? undefined,
            pushDisabledCategories: settings?.pushDisabledCategories ?? undefined,
            selectionsDisabledSources: settings?.selectionsDisabledSources ?? undefined,
            selectionsDisabledSections: settings?.selectionsDisabledSections ?? undefined,
            selectionsSectionOrder: settings?.selectionsSectionOrder ?? undefined,
          },
          sourceOrder: settings?.sourceOrder ?? null,
          reader: reader
            ? {
                readingMode: reader.readingMode,
                pageFit: reader.pageFit,
                containerWidth: reader.containerWidth,
                tapZoneWidth: reader.tapZoneWidth,
                pageGap: reader.pageGap,
                chapterGap: reader.chapterGap,
                autoNextChapter: reader.autoNextChapter,
                hidePanelsOnScroll: reader.hidePanelsOnScroll,
              }
            : null,
          disabledSources: disabled.map(({ sourceId }) => sourceId),
        },
        folders: folders.map((folder) => ({
          key: folder.id,
          builtIn: folder.builtIn,
          name: folder.name,
          icon: folder.icon,
          color: folder.color,
          trackUpdates: folder.trackUpdates,
          position: folder.position,
        })),
        bookmarks: bookmarkRows.map((row) => ({
          titleId: row.titleId,
          folderKey: row.folderId,
          name: row.name,
          coverUrl: row.coverUrl,
          contentRating: row.contentRating,
          type: row.type,
          visitedAt: toDateTime(row.visitedAt),
          createdAt: toDateTime(row.createdAt),
          updatedAt: toDateTime(row.updatedAt),
        })),
        progress: progress.map((row) => ({
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
          hiddenAt: row.hiddenAt ? toDateTime(row.hiddenAt) : null,
          updatedAt: toDateTime(row.updatedAt),
        })),
        chapterReads: reads.map((row) => ({
          chapterId: row.chapterId,
          sourceId: row.sourceId,
          titleKey: row.titleKey,
          chapterVolume: row.chapterVolume,
          chapterNumber: row.chapterNumber,
          tags: row.tags,
          readAt: toDateTime(row.readAt),
        })),
        readingActivity: activity.map((row) => ({
          minute: toDateTime(row.minute),
          seconds: row.seconds,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundApiException) throw error;
      throw new StorageUnavailableException();
    }
  }
}

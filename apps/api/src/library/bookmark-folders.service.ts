import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import {
  BUILT_IN_BOOKMARK_FOLDER,
  CUSTOM_BOOKMARK_FOLDERS_LIMIT,
  type BuiltInBookmarkFolder,
  type CreateBookmarkFolderRequest,
  type UpdateBookmarkFolderRequest,
} from '@tanuki/contracts';
import {
  BadRequestApiException,
  BookmarkFolderLimitException,
  BookmarkFolderNameTakenException,
  BuiltInBookmarkFolderReadonlyException,
  NotFoundApiException,
  StorageUnavailableException,
} from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { getUniqueViolation } from '../database/pg-error.util';
import { bookmarkFolders, bookmarks } from '../database/schema';
import { TitleLinksService } from '../matches/title-links.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BUILT_IN_BOOKMARK_FOLDER_NAMES } from './models';

export type BookmarkFolderRecord = typeof bookmarkFolders.$inferSelect;

const BUILT_IN_ORDER = Object.values(BUILT_IN_BOOKMARK_FOLDER);

/** «Брошено» не отслеживается по умолчанию: новые главы брошенного обычно не нужны. */
export const isTrackedByDefault = (folder: BuiltInBookmarkFolder) =>
  folder !== BUILT_IN_BOOKMARK_FOLDER.DROPPED;

export const isReservedFolderName = (name: string) =>
  BUILT_IN_BOOKMARK_FOLDER_NAMES.includes(name.trim().toLocaleLowerCase());

/** Встроенной папке можно менять только флаг «Следить за обновлениями». */
export const changesBuiltInLook = (body: UpdateBookmarkFolderRequest) =>
  body.name !== undefined || body.icon !== undefined || body.color !== undefined;

/**
 * Новый порядок должен перечислять ровно папки пользователя — без пропусков, чужих и повторов:
 * иначе часть вкладок осталась бы на старых местах вперемешку с новыми.
 */
export const isCompleteOrder = (ids: string[], folderIds: string[]) =>
  ids.length === folderIds.length &&
  new Set(ids).size === ids.length &&
  ids.every((id) => folderIds.includes(id));

/**
 * Папки закладок. Пишущие методы при недоступной базе отвечают StorageUnavailable — правку
 * нельзя молча потерять; читающие — тоже, потому что без папок закладкам показывать нечего.
 */
@Injectable()
export class BookmarkFoldersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly links: TitleLinksService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Папки по порядку вкладок. Встроенные создаются здесь, при первом обращении. */
  async list(userId: string): Promise<BookmarkFolderRecord[]> {
    return this.run(async () => {
      await this.ensureBuiltIns(userId);
      return this.database.db
        .select()
        .from(bookmarkFolders)
        .where(eq(bookmarkFolders.userId, userId))
        .orderBy(asc(bookmarkFolders.position), asc(bookmarkFolders.createdAt));
    });
  }

  /** Папка пользователя или 404 — чужие папки для него не существуют. */
  async get(userId: string, folderId: string): Promise<BookmarkFolderRecord> {
    const [folder] = await this.run(() =>
      this.database.db
        .select()
        .from(bookmarkFolders)
        .where(and(eq(bookmarkFolders.id, folderId), eq(bookmarkFolders.userId, userId)))
        .limit(1),
    );
    if (!folder) throw new NotFoundApiException('folderNotFound');
    return folder;
  }

  async create(userId: string, body: CreateBookmarkFolderRequest): Promise<BookmarkFolderRecord> {
    if (isReservedFolderName(body.name)) throw new BookmarkFolderNameTakenException();
    const folders = await this.list(userId);
    if (folders.filter(({ builtIn }) => builtIn === null).length >= CUSTOM_BOOKMARK_FOLDERS_LIMIT) {
      throw new BookmarkFolderLimitException();
    }

    const position = Math.max(-1, ...folders.map((folder) => folder.position)) + 1;
    const [created] = await this.runUnique(() =>
      this.database.db
        .insert(bookmarkFolders)
        .values({ userId, builtIn: null, ...body, position })
        .returning(),
    );
    return created!;
  }

  async update(
    userId: string,
    folderId: string,
    body: UpdateBookmarkFolderRequest,
  ): Promise<BookmarkFolderRecord> {
    const folder = await this.get(userId, folderId);
    if (folder.builtIn !== null && changesBuiltInLook(body)) {
      throw new BuiltInBookmarkFolderReadonlyException();
    }
    if (body.name !== undefined && isReservedFolderName(body.name)) {
      throw new BookmarkFolderNameTakenException();
    }

    const [updated] = await this.runUnique(() =>
      this.database.db
        .update(bookmarkFolders)
        .set({ ...body, updatedAt: sql`now()` })
        .where(eq(bookmarkFolders.id, folder.id))
        .returning(),
    );
    if (body.trackUpdates === false) {
      await this.dropNewChapters(userId, await this.listTitleKeys(userId, folder.id));
    }
    return updated!;
  }

  async reorder(userId: string, ids: string[]): Promise<void> {
    const folders = await this.list(userId);
    if (
      !isCompleteOrder(
        ids,
        folders.map(({ id }) => id),
      )
    ) {
      throw new BadRequestApiException();
    }

    await this.run(() =>
      this.database.db.transaction(async (tx) => {
        for (const [position, id] of ids.entries()) {
          await tx
            .update(bookmarkFolders)
            .set({ position, updatedAt: sql`now()` })
            .where(eq(bookmarkFolders.id, id));
        }
      }),
    );
  }

  /** Без moveTo закладки папки удаляются вместе с ней; с ним — переезжают в moveTo. */
  async delete(userId: string, folderId: string, moveTo: string | undefined): Promise<void> {
    const folder = await this.get(userId, folderId);
    if (folder.builtIn !== null) throw new BuiltInBookmarkFolderReadonlyException();
    if (moveTo === folder.id) throw new BadRequestApiException();
    const target = moveTo === undefined ? null : await this.get(userId, moveTo);
    // Закладки уходят из слежения: удаляются вместе с папкой или переезжают в папку без неё.
    const unwatchedKeys =
      target?.trackUpdates === true ? [] : await this.listTitleKeys(userId, folder.id);

    await this.run(() =>
      this.database.db.transaction(async (tx) => {
        const ofFolder = and(eq(bookmarks.userId, userId), eq(bookmarks.folderId, folder.id));
        if (target) {
          await tx
            .update(bookmarks)
            .set({ folderId: target.id, updatedAt: sql`now()` })
            .where(ofFolder);
        } else {
          await tx.delete(bookmarks).where(ofFolder);
        }
        await tx.delete(bookmarkFolders).where(eq(bookmarkFolders.id, folder.id));
      }),
    );
    await this.dropNewChapters(userId, unwatchedKeys);
  }

  /** Ключи тайтлов закладок папки. */
  private async listTitleKeys(userId: string, folderId: string): Promise<string[]> {
    const rows = await this.run(() =>
      this.database.db
        .select({ titleKey: bookmarks.titleKey })
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.folderId, folderId))),
    );
    return rows.map(({ titleKey }) => titleKey);
  }

  /** Убирает «новые главы» этих закладок из ленты: за ними больше не следят. */
  private async dropNewChapters(userId: string, titleKeys: string[]): Promise<void> {
    if (titleKeys.length === 0) return;
    const canonical = await this.links.listCanonicalKeys(titleKeys);
    await this.notifications.removeNewChapters(userId, [
      ...new Set([...titleKeys, ...canonical.values()]),
    ]);
  }

  /**
   * Четыре встроенные папки — первыми, в порядке BUILT_IN_BOOKMARK_FOLDER. Гонка двух первых
   * запросов безопасна: уникальный индекс (userId, builtIn) пропустит только одну вставку.
   */
  private async ensureBuiltIns(userId: string): Promise<void> {
    await this.database.db
      .insert(bookmarkFolders)
      .values(
        BUILT_IN_ORDER.map((builtIn, position) => ({
          userId,
          builtIn,
          position,
          trackUpdates: isTrackedByDefault(builtIn),
        })),
      )
      .onConflictDoNothing();
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && 'getStatus' in error) throw error;
      throw new StorageUnavailableException();
    }
  }

  /** Имя занято — уникальный индекс по lower(name), без учёта регистра. */
  private async runUnique<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (getUniqueViolation(error) === 'bookmark_folders_user_name_lower_idx') {
        throw new BookmarkFolderNameTakenException();
      }
      throw new StorageUnavailableException();
    }
  }
}

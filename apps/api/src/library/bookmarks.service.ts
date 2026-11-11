import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_SORT,
  BOOKMARKS_PAGE_SIZE,
  CONTENT_RATING,
  NEW_CHAPTER_BOOKMARKS_LIMIT,
  SOURCE_STATUS,
  type BookmarkAvailability,
  type BookmarkFoldersResponse,
  type BookmarkItem,
  type BookmarkRow,
  type BookmarksLookupResponse,
  type BookmarksQuery,
  type BookmarksResponse,
  type NewChapterBookmarksResponse,
  type Source,
  type TitleBookmark,
} from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { toServerDateTime } from '../common/dates';
import {
  BadRequestApiException,
  BookmarkFolderConflictException,
  StorageUnavailableException,
} from '../common/errors';
import { decodeTitleId, splitCompositeId } from '../common/opaque-id';
import { DatabaseService } from '../database/database.service';
import { bookmarks, readingProgress, titleChapterSnapshots } from '../database/schema';
import { IMAGE_FORMAT } from '../img-proxy/models';
import { buildSignedImageUrl } from '../img-proxy/sign.util';
import { linkKeyOf, TitleLinksService } from '../matches/title-links.service';
import type { NewChaptersSnapshot } from '../notifications/models';
import { NotificationsService } from '../notifications/notifications.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import { SourcesService } from '../sources/sources.service';
import { BookmarkFoldersService } from './bookmark-folders.service';
import {
  buildBookmarkGroups,
  countBookmarkGroup,
  matchesBookmarkQuery,
  resolveGroupFolder,
  sortBookmarkGroups,
  toFolderCopies,
} from './bookmark-groups';
import type {
  BookmarkRecord,
  BookmarkState,
  BranchStat,
  CountedBookmarkGroup,
  SnapshotRecord,
} from './models';
import {
  attachBookmarkSnapshots,
  hydrateBookmarks,
  lockSnapshotKeys,
  lockSnapshotLifecycle,
  resolveTitleSnapshots,
  writeTitleFallbacks,
} from './title-snapshot-storage';
import { TitleSnapshotsService } from './title-snapshots.service';

/** Доступность источника для зрителя: скрытый настройкой 18+ в списке отсутствует вовсе. */
export const toSourceAvailability = (source: Source | undefined): BookmarkAvailability => {
  if (!source || !source.isEnabled) return BOOKMARK_AVAILABILITY.SOURCE_DISABLED;
  if (source.status === SOURCE_STATUS.DOWN) return BOOKMARK_AVAILABILITY.SOURCE_DOWN;
  return BOOKMARK_AVAILABILITY.AVAILABLE;
};

export const toBookmarkRow = (row: BookmarkRecord): BookmarkRow => ({
  titleKey: row.titleKey,
  sourceId: row.sourceId,
  titleId: row.titleId,
  folderId: row.folderId,
  name: row.name,
  coverUrl: row.coverUrl,
  contentRating: row.contentRating ?? CONTENT_RATING.SAFE,
  type: row.type,
  visitedAt: toServerDateTime(row.visitedAt.getTime()),
  createdAt: toServerDateTime(row.createdAt.getTime()),
});

/** Ключ тайтла по его полному Title.id — тот же, что в title_links и reading_progress. */
export const titleKeyOf = (titleId: string) => {
  const { sourceId, opaqueId } = splitCompositeId(titleId);
  return linkKeyOf(sourceId, decodeTitleId(opaqueId).url);
};

/**
 * Закладки пользователя. Хранятся строкой на тайтл на источнике, а показываются и правятся
 * группой подтверждённых совпадений: смена папки и удаление касаются всех строк группы.
 */
@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly folders: BookmarkFoldersService,
    private readonly links: TitleLinksService,
    private readonly snapshots: TitleSnapshotsService,
    private readonly sources: SourcesService,
    private readonly parsersClient: ParsersClientService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Папки по порядку вкладок со счётчиками — для вкладок, профиля и точки в шапке. */
  async listFolders(userId: string): Promise<BookmarkFoldersResponse> {
    const { folders, groups } = await this.loadGroups(userId);
    const items = folders.map((folder) => {
      const inFolder = groups.filter(({ folderId }) => folderId === folder.id);
      return {
        id: folder.id,
        builtIn: folder.builtIn,
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
        trackUpdates: folder.trackUpdates,
        count: inFolder.length,
        newCount: inFolder.filter(({ newChaptersCount }) => newChaptersCount > 0).length,
      };
    });
    return { items, hasNew: items.some(({ newCount }) => newCount > 0) };
  }

  async list(userId: string, query: BookmarksQuery): Promise<BookmarksResponse> {
    await this.folders.get(userId, query.folderId);
    const { groups } = await this.loadGroups(userId);
    const matching = sortBookmarkGroups(
      groups.filter(
        (group) => group.folderId === query.folderId && matchesBookmarkQuery(group, query.query),
      ),
      query.sort,
      query.direction,
    );
    const start = (query.page - 1) * BOOKMARKS_PAGE_SIZE;

    return {
      items: matching.slice(start, start + BOOKMARKS_PAGE_SIZE).map((group) => this.toItem(group)),
      page: query.page,
      total: matching.length,
    };
  }

  /**
   * «Новые главы в закладках» на главной: группы отслеживаемых папок, где вышли главы, — свежая
   * глава первой (порядок UPDATED, как на /bookmarks). Счётчик у неотслеживаемых папок всегда 0,
   * так что фильтра по папке здесь не нужно.
   */
  async listNewChapters(userId: string): Promise<NewChapterBookmarksResponse> {
    const { groups } = await this.loadGroups(userId);
    const withNew = sortBookmarkGroups(
      groups.filter(({ newChaptersCount }) => newChaptersCount > 0),
      BOOKMARK_SORT.UPDATED,
    );
    return {
      items: withNew.slice(0, NEW_CHAPTER_BOOKMARKS_LIMIT).map((group) => this.toItem(group)),
    };
  }

  /** Папка тайтла с учётом группы и разошедшиеся папки её копий, если они есть. */
  async getForTitle(userId: string, titleId: string): Promise<TitleBookmark> {
    const rows = await this.listGroupRows(userId, await this.groupKeysOf(titleKeyOf(titleId)));
    if (rows.length === 0) return { folderId: null, conflict: null };

    const copies = toFolderCopies(rows);
    return {
      folderId: resolveGroupFolder(rows),
      conflict: copies.length > 1 ? copies : null,
    };
  }

  /**
   * Кладёт тайтл в папку или переносит туда всю группу. Если группа уже в закладках, новая
   * строка не появляется — меняется папка существующих.
   */
  async setForTitle(userId: string, titleId: string, folderId: string): Promise<TitleBookmark> {
    await this.folders.get(userId, folderId);
    const titleKey = titleKeyOf(titleId);
    const groupKeys = await this.groupKeysOf(titleKey);
    const rows = await this.listGroupRows(userId, groupKeys);

    if (rows.length > 0) {
      await this.moveRows(userId, groupKeys, folderId);
      return { folderId, conflict: null };
    }

    // Снимок названия и обложки берём у источника, а не со слов клиента. Детали почти всегда
    // в кеше — человек только что открыл страницу тайтла.
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    const url = decodeTitleId(opaqueId).url;
    const result = await this.parsersClient.getDetails(sourceId, url);
    const raw = result.data;
    await this.write(() =>
      this.database.db.transaction(async (tx) => {
        await lockSnapshotKeys(tx, [titleKey]);
        await tx
          .insert(bookmarks)
          .values({ userId, titleKey, sourceId, folderId })
          .onConflictDoUpdate({
            target: [bookmarks.userId, bookmarks.titleKey],
            set: { folderId, updatedAt: sql`now()` },
          });
        await writeTitleFallbacks(tx, [
          {
            userId,
            titleKey,
            titleId,
            name: raw.title,
            coverUrl: raw.coverUrl,
            contentRating: raw.contentRating,
            type: raw.type ?? null,
            updatedAt: new Date(),
          },
        ]);
        await this.snapshots.record(sourceId, url, raw, { ...result, tx });
      }),
    );
    return { folderId, conflict: null };
  }

  /** Убирает закладку всей группы и отдаёт удалённые строки — для «Вернуть» в тосте. */
  async removeForTitle(userId: string, titleId: string): Promise<BookmarkRow[]> {
    const groupKeys = await this.groupKeysOf(titleKeyOf(titleId));
    const removed = await this.write(() =>
      this.database.db.transaction(async (tx) => {
        await lockSnapshotLifecycle(tx);
        const deleted = await tx
          .delete(bookmarks)
          .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, groupKeys)))
          .returning();
        return hydrateBookmarks(tx, userId, deleted);
      }),
    );
    await this.notifications.removeNewChapters(userId, groupKeys);
    return removed.map(toBookmarkRow);
  }

  /**
   * «Вернуть» после удаления: строки как были. Папки проверяются — строки пришли от клиента,
   * а папку за это время могли удалить. Ключ сверяется с titleId, чтобы строка не легла чужим
   * тайтлом. Источник, название и обложка снова берутся у источника, а не со слов клиента:
   * обложка уходит в подписанный img-прокси, и чужой адрес превратил бы его в открытый прокси.
   * Источник лежит — строка возвращается со своим названием, но без обложки: чаще всего удаляют
   * как раз мёртвые тайтлы, и «Вернуть» не должен из-за этого терять закладку.
   */
  async restore(userId: string, rows: BookmarkRow[]): Promise<void> {
    const folderIds = new Set((await this.folders.list(userId)).map(({ id }) => id));
    const isValid = (row: BookmarkRow) => {
      try {
        return folderIds.has(row.folderId) && titleKeyOf(row.titleId) === row.titleKey;
      } catch {
        return false;
      }
    };
    if (!rows.every(isValid)) throw new BadRequestApiException();

    const resolved = await Promise.all(
      rows.map(async (row) => {
        const { sourceId, opaqueId } = splitCompositeId(row.titleId);
        const url = decodeTitleId(opaqueId).url;
        const result = await this.parsersClient
          .getDetails(sourceId, url)
          .catch((error: unknown) => {
            this.logger.warn(`restore without details for ${row.titleId}: ${String(error)}`);
            return null;
          });
        return { row, sourceId, url, result };
      }),
    );
    await this.write(() =>
      this.database.db.transaction(async (tx) => {
        await lockSnapshotLifecycle(tx);
        await lockSnapshotKeys(
          tx,
          resolved.map(({ row }) => row.titleKey),
        );
        for (const { row, sourceId, url, result } of resolved) {
          const inserted = await tx
            .insert(bookmarks)
            .values({
              userId,
              titleKey: row.titleKey,
              sourceId,
              folderId: row.folderId,
              visitedAt: new Date(row.visitedAt),
              createdAt: new Date(row.createdAt),
            })
            .onConflictDoNothing()
            .returning();
          if (inserted.length === 0) continue;
          await writeTitleFallbacks(tx, [
            {
              userId,
              titleKey: row.titleKey,
              titleId: row.titleId,
              name: row.name,
              coverUrl: null,
              contentRating: row.contentRating,
              type: row.type,
              updatedAt: new Date(row.createdAt),
            },
          ]);
          if (result) await this.snapshots.record(sourceId, url, result.data, { ...result, tx });
        }
      }),
    );
  }

  /** Метки «в закладках» на карточках: titleId → папка его группы. */
  async lookup(userId: string, titleIds: string[]): Promise<BookmarksLookupResponse> {
    const keyById = new Map<string, string>();
    for (const titleId of titleIds) {
      try {
        keyById.set(titleId, titleKeyOf(titleId));
      } catch {
        // Битый id — просто без метки.
      }
    }

    const rows = await this.read(
      () => this.database.db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
      [],
    );
    if (rows.length === 0 || keyById.size === 0) return {};

    const canonical = await this.links.listCanonicalKeys([
      ...new Set([...keyById.values(), ...rows.map(({ titleKey }) => titleKey)]),
    ]);
    const keyOf = (titleKey: string) => canonical.get(titleKey) ?? titleKey;
    const rowsByGroup = new Map<string, BookmarkState[]>();
    for (const row of rows) {
      const key = keyOf(row.titleKey);
      rowsByGroup.set(key, [...(rowsByGroup.get(key) ?? []), row]);
    }

    const result: BookmarksLookupResponse = {};
    for (const [titleId, titleKey] of keyById) {
      const groupRows = rowsByGroup.get(keyOf(titleKey));
      if (groupRows) result[titleId] = resolveGroupFolder(groupRows);
    }
    return result;
  }

  /**
   * Визит на страницу тайтла: сначала свежий снимок его глав, потом — какие из них новые с
   * прошлого визита, и только потом визит засчитывается. В обратном порядке главы, найденные
   * этим же заходом, всплыли бы новыми в следующий раз.
   */
  async visit(userId: string, titleId: string): Promise<string[]> {
    const titleKey = titleKeyOf(titleId);
    const groupKeys = await this.groupKeysOf(titleKey);
    const rows = await this.listGroupRows(userId, groupKeys);
    if (rows.length === 0) return [];

    const { sourceId, opaqueId } = splitCompositeId(titleId);
    const url = decodeTitleId(opaqueId).url;
    try {
      const result = await this.parsersClient.getDetails(sourceId, url);
      await this.snapshots.record(sourceId, url, result.data, { ...result, force: true });
    } catch (error) {
      this.logger.warn(`Визит ${titleKey}: снимок не обновлён — ${(error as Error).message}`);
    }

    const visitedAt = rows.reduce(
      (latest, row) => (row.visitedAt > latest ? row.visitedAt : latest),
      rows[0]!.visitedAt,
    );
    const newChapterIds = await this.read(
      () => this.snapshots.listNewChapterIds(titleKey, visitedAt),
      [],
    );
    await this.touchGroup(userId, groupKeys);
    return newChapterIds;
  }

  /** Чтение главы — тоже визит: пометка «обновился» с карточки снимается. */
  async touchVisit(userId: string, titleKey: string): Promise<void> {
    await this.touchGroup(userId, await this.groupKeysOf(titleKey));
  }

  /**
   * Проверка перед подтверждением связи: если у пользователя обе стороны лежат в закладках в
   * разных папках, без выбранной папки связь не ставится (409). Возвращает, что сделать после
   * того, как связь записана, — перенести всю новую группу в выбранную папку.
   */
  async prepareLinkMerge(
    userId: string,
    titleKey: string,
    targetKey: string,
    folderId: string | undefined,
  ): Promise<() => Promise<void>> {
    const keys = [
      ...new Set([...(await this.groupKeysOf(titleKey)), ...(await this.groupKeysOf(targetKey))]),
    ];
    const rows = await this.listGroupRows(userId, keys);
    const copies = toFolderCopies(rows);
    if (copies.length <= 1) return async () => undefined;
    if (!folderId) throw new BookmarkFolderConflictException();

    await this.folders.get(userId, folderId);
    return () => this.moveRows(userId, keys, folderId);
  }

  /** Группы закладок с новыми главами — из них крон строит уведомления. */
  async listNewChaptersGroups(userId: string): Promise<NewChaptersSnapshot> {
    const { folders, groups } = await this.loadGroups(userId);
    const trackedFolders = new Set(
      folders.filter(({ trackUpdates }) => trackUpdates).map(({ id }) => id),
    );
    return {
      groups: groups
        .filter(({ newChaptersCount }) => newChaptersCount > 0)
        .map((group) => ({
          key: group.key,
          titleId: group.target.titleId,
          sourceId: group.target.sourceId,
          name: group.snapshot.name,
          coverUrl: group.snapshot.coverUrl,
          coverSourceId: group.snapshot.sourceId,
          count: group.newChaptersCount,
          latestNewAt: group.latestNewAt,
        })),
      // Источник лёг или выключен — счётчик обнулился, но главы не прочитаны.
      heldKeys: groups
        .filter(
          ({ newChaptersCount, target, folderIds }) =>
            newChaptersCount === 0 &&
            target.availability !== BOOKMARK_AVAILABILITY.AVAILABLE &&
            folderIds.some((id) => trackedFolders.has(id)),
        )
        .map(({ key }) => key),
    };
  }

  /** Все группы пользователя с посчитанными главами — основа списка и счётчиков. */
  private async loadGroups(userId: string) {
    const folders = await this.folders.list(userId);
    const [storedRows, progress, sources] = await Promise.all([
      this.read(
        () => this.database.db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
        [],
      ),
      this.read(
        () =>
          this.database.db
            .select({
              titleKey: readingProgress.titleKey,
              sourceId: readingProgress.sourceId,
              branchId: readingProgress.branchId,
              chapterVolume: readingProgress.chapterVolume,
              chapterNumber: readingProgress.chapterNumber,
              updatedAt: readingProgress.updatedAt,
            })
            .from(readingProgress)
            .where(eq(readingProgress.userId, userId)),
        [],
      ),
      this.sources.listSources(userId),
    ]);
    if (storedRows.length === 0) return { folders, groups: [] as CountedBookmarkGroup[] };

    const keys = [...new Set([...storedRows, ...progress].map(({ titleKey }) => titleKey))];
    const [canonical, snapshots, metadata] = await Promise.all([
      this.links.listCanonicalKeys(keys),
      this.loadSnapshots(keys),
      this.read(() => resolveTitleSnapshots(this.database.db, userId, keys, true), new Map()),
    ]);
    const rows = attachBookmarkSnapshots(storedRows, metadata);
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const groups = buildBookmarkGroups({
      rows,
      progress,
      canonical,
      snapshots,
      metadata,
      sourceAvailability: (sourceId) => toSourceAvailability(sourceById.get(sourceId)),
    });

    const stats = await this.loadBranchStats(
      groups.map(({ target, visitedAt, progress }) => ({
        titleKey: target.titleKey,
        visitedAt,
        markVolume: progress?.chapterVolume ?? null,
        markNumber: progress?.chapterNumber ?? null,
      })),
    );
    const trackedFolders = new Set(
      folders.filter(({ trackUpdates }) => trackUpdates).map(({ id }) => id),
    );
    return {
      folders,
      groups: groups.map((group) =>
        countBookmarkGroup(
          group,
          stats.filter(({ titleKey }) => titleKey === group.target.titleKey),
          trackedFolders.has(group.folderId),
        ),
      ),
    };
  }

  private toItem(group: CountedBookmarkGroup): BookmarkItem {
    const { snapshot, target, progress } = group;
    return {
      titleId: target.titleId,
      sourceId: target.sourceId,
      name: snapshot.name,
      // Обложка подписывается при чтении: подпись прокси живёт час, а снимок — годами.
      coverUrl: snapshot.coverUrl
        ? buildSignedImageUrl(this.env.IMG_SIGN_SECRET, snapshot.sourceId, snapshot.coverUrl, {
            width: 360,
            format: IMAGE_FORMAT.WEBP,
          })
        : '',
      contentRating: snapshot.contentRating ?? CONTENT_RATING.SAFE,
      type: snapshot.type,
      folderId: group.folderId,
      progress: progress && {
        chapterNumber: progress.chapterNumber,
        position: group.branchPosition,
        total: group.branchTotal,
      },
      chaptersCount: progress ? null : group.branchTotal,
      newChaptersCount: group.newChaptersCount,
      latestChapterNumber: group.latestChapterNumber,
      latestNewAt: group.latestNewAt ? toServerDateTime(group.latestNewAt.getTime()) : null,
      otherSources: group.otherSources.map(({ sourceId, titleId }) => ({ sourceId, titleId })),
      availability: target.availability,
    };
  }

  private async loadSnapshots(keys: string[]): Promise<Map<string, SnapshotRecord>> {
    const rows = await this.read(
      () =>
        this.database.db
          .select({
            titleKey: titleChapterSnapshots.titleKey,
            titleId: titleChapterSnapshots.titleId,
            checkedAt: titleChapterSnapshots.checkedAt,
            missing: titleChapterSnapshots.missing,
            chaptersCount: titleChapterSnapshots.chaptersCount,
          })
          .from(titleChapterSnapshots)
          .where(inArray(titleChapterSnapshots.titleKey, keys)),
      [],
    );
    return new Map(rows.map((row) => [row.titleKey, row]));
  }

  /**
   * Главы целей по веткам: сколько всего и сколько новых с визита их группы — одним запросом,
   * без выгрузки самих глав.
   */
  private async loadBranchStats(
    targets: {
      titleKey: string;
      visitedAt: Date;
      markVolume: number | null;
      markNumber: number | null;
    }[],
  ): Promise<BranchStat[]> {
    if (targets.length === 0) return [];
    const keys = sql.join(
      targets.map(({ titleKey }) => sql`${titleKey}`),
      sql`, `,
    );
    const visited = sql.join(
      targets.map(({ visitedAt }) => sql`${visitedAt.toISOString()}`),
      sql`, `,
    );

    const markVolumes = sql.join(
      targets.map(({ markVolume }) => sql`${markVolume}`),
      sql`, `,
    );
    const markNumbers = sql.join(
      targets.map(({ markNumber }) => sql`${markNumber}`),
      sql`, `,
    );

    type StatRow = {
      title_key: string;
      branch_id: string;
      total: number;
      position: number | null;
      new_count: number;
      latest_new_at: string | null;
      latest_number: number | null;
    };
    const rows = await this.read<StatRow[]>(
      async () => [
        ...(await this.database.db.execute<StatRow>(sql`
          SELECT t.title_key, s.branch_id,
            count(*)::int AS total,
            CASE WHEN t.mark_number IS NULL THEN NULL ELSE
              count(*) FILTER (
                WHERE s.chapter_number IS NOT NULL
                  AND (coalesce(s.chapter_volume, 'Infinity'::double precision), s.chapter_number)
                    <= (coalesce(t.mark_volume, 'Infinity'::double precision), t.mark_number)
              )::int
            END AS position,
            count(*) FILTER (WHERE NOT s.baseline AND s.first_seen_at > t.visited_at)::int
              AS new_count,
            max(s.first_seen_at) FILTER (WHERE NOT s.baseline AND s.first_seen_at > t.visited_at)
              AS latest_new_at,
            (array_agg(s.chapter_number ORDER BY
              coalesce(s.chapter_volume, 'Infinity'::double precision) DESC,
              s.chapter_number DESC
            ) FILTER (WHERE s.chapter_number IS NOT NULL))[1] AS latest_number
          FROM unnest(
            ARRAY[${keys}]::text[],
            ARRAY[${visited}]::timestamptz[],
            ARRAY[${markVolumes}]::double precision[],
            ARRAY[${markNumbers}]::double precision[]
          ) AS t(title_key, visited_at, mark_volume, mark_number)
          JOIN title_chapters_seen AS s ON s.title_key = t.title_key
          GROUP BY t.title_key, s.branch_id, t.mark_volume, t.mark_number
        `)),
      ],
      [],
    );
    return rows.map((row) => ({
      titleKey: row.title_key,
      branchId: row.branch_id,
      total: row.total,
      position: row.position,
      newCount: row.new_count,
      latestNewAt: row.latest_new_at ? new Date(row.latest_new_at) : null,
      latestNumber: row.latest_number,
    }));
  }

  /** Ключ тайтла и ключи всей его группы подтверждённых совпадений. */
  private async groupKeysOf(titleKey: string): Promise<string[]> {
    return [titleKey, ...(await this.links.listConfirmedGroup(titleKey))];
  }

  private async listGroupRows(userId: string, keys: string[]): Promise<BookmarkState[]> {
    return this.read(
      () =>
        this.database.db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, keys))),
      [],
    );
  }

  private async moveRows(userId: string, keys: string[], folderId: string): Promise<void> {
    await this.write(() =>
      this.database.db
        .update(bookmarks)
        .set({ folderId, updatedAt: sql`now()` })
        .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, keys))),
    );
    // В папке без слежения «новые главы» не показываются — из ленты они уходят сразу.
    const folder = await this.folders.get(userId, folderId);
    if (!folder.trackUpdates) {
      const canonical = await this.links.listCanonicalKeys(keys);
      await this.notifications.removeNewChapters(userId, [
        ...new Set([...keys, ...canonical.values()]),
      ]);
    }
  }

  private async touchGroup(userId: string, keys: string[]): Promise<void> {
    await this.write(() =>
      this.database.db
        .update(bookmarks)
        .set({ visitedAt: sql`now()` })
        .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.titleKey, keys))),
    );
    // Визит прочитывает «новые главы» группы.
    await this.notifications.removeNewChapters(userId, keys);
  }

  /** Чтение деградирует до пустого результата, как прогресс чтения на мёртвой базе. */
  private read<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    return this.database.withFallback(operation, fallback);
  }

  /** Запись при недоступной базе — ошибка: правка не должна потеряться молча. */
  private async write<T>(operation: () => Promise<T>): Promise<T> {
    const sentinel = Symbol('failed');
    const result = await this.database.withFallback<T | typeof sentinel>(operation, sentinel);
    if (result === sentinel) throw new StorageUnavailableException();
    return result;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  CONTENT_RATING,
  CONTINUE_READING_LIMIT,
  DEFAULT_BRANCH_ID,
  type ContinueReadingItem,
  type ContinueReadingResponse,
  type LinkedReadingProgress,
  type ReadingProgress,
  type ReadingProgressProjection,
  type TitleReadingProgressResponse,
  type UpdateReadingProgressRequest,
} from '@tanuki/contracts';
import { AdultContentService, isAdultSourceHidden } from '../adult-content/adult-content.service';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { toServerDateTime } from '../common/dates';
import { NotFoundApiException, StorageUnavailableException } from '../common/errors';
import { groupByBranch, normalizeChapter, titleIdOf } from '../common/normalize';
import { decodeChapterId, decodeTitleId, splitCompositeId } from '../common/opaque-id';
import { DatabaseService } from '../database/database.service';
import { BookmarksService } from '../library/bookmarks.service';
import { readingProgress } from '../database/schema';
import { IMAGE_FORMAT } from '../img-proxy/models';
import { buildSignedImageUrl } from '../img-proxy/sign.util';
import { SourcesService } from '../sources/sources.service';
import { linkKeyOf, parseLinkKey, TitleLinksService } from '../matches/title-links.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { alignBySnapshot, alignChapter } from './chapter-alignment';
import { pickContinueReadingRows } from './continue-reading';
import type { ReadingProgressRow } from './models';

/**
 * Сколько строк прогресса смотрится ради «Продолжить чтение». С запасом против
 * CONTINUE_READING_LIMIT: строки одной группы склеиваются, а часть отсеивается (источник
 * выключен, тайтл убран из ленты).
 */
const CONTINUE_READING_SCAN_LIMIT = 200;

/** Снимок тайтла для «Продолжить чтение» — из деталей, которые источник уже отдал. */
const toTitleSnapshot = (titleId: string, raw: RawTitle) => ({
  titleId,
  titleName: raw.title,
  coverUrl: raw.coverUrl,
  contentRating: raw.contentRating ?? CONTENT_RATING.SAFE,
  type: raw.type ?? null,
});

export const toReadingProgress = (row: ReadingProgressRow): ReadingProgress => ({
  sourceId: row.sourceId,
  chapterId: row.chapterId,
  chapterVolume: row.chapterVolume,
  chapterNumber: row.chapterNumber,
  chapterTitle: row.chapterTitle,
  branchId: row.branchId,
  pageIndex: row.pageIndex,
  updatedAt: toServerDateTime(row.updatedAt.getTime()),
});

/**
 * Раскладывает строки группы на строку самого тайтла и строки его совпадений. Строки приходят
 * уже отсортированными по свежести — порядок linked остаётся тем же.
 */
export const splitProgressRows = (rows: ReadingProgressRow[], titleKey: string) => ({
  own: rows.find((row) => row.titleKey === titleKey) ?? null,
  linked: rows.filter((row) => row.titleKey !== titleKey),
});

/**
 * Куда чужая отметка попадает в каждой ветке этого тайтла. Есть полный список глав её источника —
 * ветки выравниваются целиком; нет (источник лежит или глава с него пропала) — глава узнаётся по
 * снимку из строки.
 */
export const projectLinkedRow = (
  row: ReadingProgressRow,
  sourceChapters: RawChapter[] | null,
  targetChapters: RawChapter[],
  targetSourceId: string,
  targetTitleId: string,
): ReadingProgressProjection[] => {
  const markRef = decodeChapterId(splitCompositeId(row.chapterId).opaqueId);
  const sourceBranch = sourceChapters?.filter((chapter) => chapter.branch === markRef.branch);
  const hasMark = sourceBranch?.some((chapter) => chapter.id === markRef.id) ?? false;

  return groupByBranch(targetChapters).flatMap(({ key, items }) => {
    const aligned =
      sourceBranch && hasMark
        ? alignChapter(sourceBranch, markRef.id, items)
        : alignBySnapshot(
            { volume: row.chapterVolume, number: row.chapterNumber, title: row.chapterTitle },
            items,
          );
    if (!aligned) return [];

    return {
      branchId: key ?? DEFAULT_BRANCH_ID,
      chapterId: normalizeChapter(targetSourceId, targetTitleId, aligned.chapter).id,
      confidence: aligned.confidence,
    };
  });
};

/**
 * Глава тайтла вместе с его деталями — у источника, а не со слов клиента: снимок главы потом
 * узнают на других источниках. Детали кешированы и почти всегда тёплые — читалка только что
 * грузила по ним соседние главы.
 */
export const findTitleChapter = async (
  parsersClient: ParsersClientService,
  sourceId: string,
  titleId: string,
  chapterId: string,
) => {
  const titleRef = decodeTitleId(titleId);
  const { sourceId: chapterSourceId, opaqueId } = splitCompositeId(chapterId);
  if (chapterSourceId !== sourceId) throw new NotFoundApiException('chapterNotFromThisTitle');

  const chapterRef = decodeChapterId(opaqueId);
  const { data } = await parsersClient.getDetails(sourceId, titleRef.url);
  const chapter = (data.chapters ?? []).find(
    (item) => item.id === chapterRef.id && item.branch === chapterRef.branch,
  );
  if (!chapter) throw new NotFoundApiException('chapterNotFound');

  return { titleRef, details: data, chapter };
};

@Injectable()
export class ReadingProgressService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseService,
    private readonly links: TitleLinksService,
    private readonly parsersClient: ParsersClientService,
    private readonly adultContent: AdultContentService,
    private readonly bookmarks: BookmarksService,
    private readonly sources: SourcesService,
  ) {}

  /**
   * Отметка тайтла и отметки всей его группы подтверждённых совпадений, уже перенесённые на главы
   * этого тайтла. Детали источников почти всегда в кеше, а без полного списка глав обеих сторон
   * разную нумерацию и пропуски глав не выровнять.
   *
   * Недоступная база — пустой прогресс: страница тайтла из-за этого падать не должна.
   */
  async get(
    userId: string,
    sourceId: string,
    titleId: string,
  ): Promise<TitleReadingProgressResponse> {
    const titleKey = linkKeyOf(sourceId, decodeTitleId(titleId).url);
    const group = await this.links.listConfirmedGroup(titleKey);

    const rows = await this.database.withFallback(
      () =>
        this.database.db
          .select()
          .from(readingProgress)
          .where(
            and(
              eq(readingProgress.userId, userId),
              inArray(readingProgress.titleKey, [titleKey, ...group]),
            ),
          )
          .orderBy(desc(readingProgress.updatedAt)),
      [],
    );
    const { own, linked: allLinked } = splitProgressRows(rows, titleKey);
    // Отметка с источника 18+, скрытого настройками, вела бы на источник, которого у зрителя нет.
    const adultAccess = await this.adultContent.getAccess();
    const linked = allLinked.filter((row) => !isAdultSourceHidden(adultAccess, row.sourceId));

    return {
      own: own && toReadingProgress(own),
      linked: linked.length > 0 ? await this.projectLinked(linked, sourceId, titleId) : [],
    };
  }

  /** Упавший источник не роняет весь прогресс: его отметка узнаётся по снимку, а без деталей
   *  самого тайтла переносить отметки просто некуда. */
  private async projectLinked(
    rows: ReadingProgressRow[],
    sourceId: string,
    titleId: string,
  ): Promise<LinkedReadingProgress[]> {
    const loadDetails = async (detailsSourceId: string, url: string) => {
      const { data } = await this.parsersClient.getDetails(detailsSourceId, url);
      return data;
    };

    const [target, ...sources] = await Promise.allSettled([
      loadDetails(sourceId, decodeTitleId(titleId).url),
      ...rows.map((row) => {
        const { sourceId: rowSourceId, url } = parseLinkKey(row.titleKey);
        return loadDetails(rowSourceId, url);
      }),
    ]);
    const targetChapters = target?.status === 'fulfilled' ? (target.value.chapters ?? []) : [];

    return rows.map((row, index) => {
      const settled = sources[index];
      const source = settled?.status === 'fulfilled' ? settled.value : null;
      return {
        ...toReadingProgress(row),
        // Id берём из деталей, а не собираем из ключа: у части парсеров (desume) он в списке и
        // в деталях разный, а ключ хранит только адрес.
        titleId: source && titleIdOf(row.sourceId, source),
        projections: projectLinkedRow(
          row,
          source && (source.chapters ?? []),
          targetChapters,
          sourceId,
          titleId,
        ),
      };
    });
  }

  /** Номер, название и ветку главы берём у источника сами — см. findTitleChapter. */
  async update(
    userId: string,
    sourceId: string,
    titleId: string,
    body: UpdateReadingProgressRequest,
  ): Promise<ReadingProgress> {
    const { titleRef, details, chapter } = await findTitleChapter(
      this.parsersClient,
      sourceId,
      titleId,
      body.chapterId,
    );

    const values = {
      // Снимок обновляется вместе с отметкой: «Продолжить чтение» рисует карточку по нему.
      ...toTitleSnapshot(`${sourceId}:${titleId}`, details),
      sourceId,
      chapterId: body.chapterId,
      chapterVolume: chapter.volume,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      branchId: chapter.branch ?? DEFAULT_BRANCH_ID,
      pageIndex: body.pageIndex,
    };

    // Как и в остальных записях, недоступная база — ошибка: иначе отметка молча потеряется, а
    // интерфейс покажет её сохранённой.
    const row = await this.database.withFallback(async () => {
      const [saved] = await this.database.db
        .insert(readingProgress)
        .values({ userId, titleKey: linkKeyOf(sourceId, titleRef.url), ...values })
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.titleKey],
          set: { ...values, updatedAt: sql`now()` },
        })
        .returning();
      return saved ?? null;
    }, null);

    if (!row) throw new StorageUnavailableException();
    // Чтение главы — визит в группу: пометка «обновился» на карточке закладки снимается. Отметка
    // уже сохранена, так что неудача здесь её не отменяет.
    await this.bookmarks.touchVisit(userId, row.titleKey).catch(() => undefined);
    return toReadingProgress(row);
  }

  /**
   * «Продолжить чтение» — последние тайтлы, которые читал пользователь: группа совпадений —
   * одна карточка с источником и главой самой свежей отметки. Строкам без снимка (прогресс
   * старше снимков) он досниматься из деталей источника; не вышло — строка ждёт следующего
   * чтения. Недоступная база — пустая лента: главная из-за этого падать не должна.
   */
  async listRecent(userId: string): Promise<ContinueReadingResponse> {
    const rows = await this.database.withFallback(
      () =>
        this.database.db
          .select()
          .from(readingProgress)
          .where(eq(readingProgress.userId, userId))
          .orderBy(desc(readingProgress.updatedAt))
          .limit(CONTINUE_READING_SCAN_LIMIT),
      [],
    );
    if (rows.length === 0) return { items: [] };

    const [canonical, sources] = await Promise.all([
      this.links.listCanonicalKeys([...new Set(rows.map(({ titleKey }) => titleKey))]),
      this.sources.listSources(userId),
    ]);
    const shownSources = new Set(sources.filter(({ isEnabled }) => isEnabled).map(({ id }) => id));
    const picked = pickContinueReadingRows(rows, canonical, (sourceId) =>
      shownSources.has(sourceId),
    );

    const items: ContinueReadingItem[] = [];
    for (let start = 0; start < picked.length && items.length < CONTINUE_READING_LIMIT;) {
      const batch = picked.slice(start, start + CONTINUE_READING_LIMIT - items.length);
      start += batch.length;
      const resolved = await Promise.all(batch.map((row) => this.withSnapshot(row)));
      for (const row of resolved) {
        if (row) items.push(this.toContinueReadingItem(row));
      }
    }
    return { items };
  }

  /** Убирает тайтл из «Продолжить чтение» — всю его группу; прогресс остаётся как был. */
  async hideFromContinueReading(userId: string, sourceId: string, titleId: string) {
    await this.setHiddenAt(userId, sourceId, titleId, sql`now()`);
  }

  /** «Отменить» в тосте: тайтл возвращается в ленту на прежнее место. */
  async restoreToContinueReading(userId: string, sourceId: string, titleId: string) {
    await this.setHiddenAt(userId, sourceId, titleId, null);
  }

  private async setHiddenAt(
    userId: string,
    sourceId: string,
    titleId: string,
    hiddenAt: ReturnType<typeof sql> | null,
  ) {
    const titleKey = linkKeyOf(sourceId, decodeTitleId(titleId).url);
    const group = await this.links.listConfirmedGroup(titleKey);
    const applied = await this.database.withFallback(async () => {
      await this.database.db
        .update(readingProgress)
        // updated_at не трогаем: по нему тайтл и возвращается в ленту при следующем чтении.
        .set({ hiddenAt })
        .where(
          and(
            eq(readingProgress.userId, userId),
            inArray(readingProgress.titleKey, [titleKey, ...group]),
          ),
        );
      return true;
    }, false);
    if (!applied) throw new StorageUnavailableException();
  }

  /** Строка со снимком тайтла; без снимка — дописывает его из деталей источника. */
  private async withSnapshot(row: ReadingProgressRow): Promise<ReadingProgressRow | null> {
    if (row.titleId && row.titleName) return row;
    try {
      const { url } = parseLinkKey(row.titleKey);
      const { data } = await this.parsersClient.getDetails(row.sourceId, url);
      const snapshot = toTitleSnapshot(titleIdOf(row.sourceId, data), data);
      // Не записался (база недоступна) — карточку всё равно отдаём, снимок допишется в следующий раз.
      await this.database.withFallback(async () => {
        await this.database.db
          .update(readingProgress)
          .set(snapshot)
          .where(
            and(eq(readingProgress.userId, row.userId), eq(readingProgress.titleKey, row.titleKey)),
          );
      }, undefined);
      return { ...row, ...snapshot };
    } catch {
      return null;
    }
  }

  private toContinueReadingItem(row: ReadingProgressRow): ContinueReadingItem {
    return {
      title: {
        id: row.titleId ?? '',
        sourceId: row.sourceId,
        name: row.titleName ?? '',
        // Обложка подписывается при чтении: подпись прокси живёт час, а снимок — годами.
        coverUrl: row.coverUrl
          ? buildSignedImageUrl(this.env.IMG_SIGN_SECRET, row.sourceId, row.coverUrl, {
              width: 360,
              format: IMAGE_FORMAT.WEBP,
            })
          : '',
        contentRating: row.contentRating ?? CONTENT_RATING.SAFE,
        type: row.type,
      },
      chapter: {
        id: row.chapterId,
        number: row.chapterNumber,
        volume: row.chapterVolume,
        title: row.chapterTitle,
      },
      updatedAt: toServerDateTime(row.updatedAt.getTime()),
    };
  }
}

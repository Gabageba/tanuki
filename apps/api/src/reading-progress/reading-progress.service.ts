import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  DEFAULT_BRANCH_ID,
  type LinkedReadingProgress,
  type ReadingProgress,
  type ReadingProgressProjection,
  type TitleReadingProgressResponse,
  type UpdateReadingProgressRequest,
} from '@tanuki/contracts';
import { toServerDateTime } from '../common/dates';
import { NotFoundApiException, StorageUnavailableException } from '../common/errors';
import { groupByBranch, normalizeChapter, titleIdOf } from '../common/normalize';
import { decodeChapterId, decodeTitleId, splitCompositeId } from '../common/opaque-id';
import { DatabaseService } from '../database/database.service';
import { readingProgress } from '../database/schema';
import { linkKeyOf, parseLinkKey, TitleLinksService } from '../matches/title-links.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter } from '../parsers-client/parsers-client.types';
import { alignBySnapshot, alignChapter } from './chapter-alignment';

type ReadingProgressRow = typeof readingProgress.$inferSelect;

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

@Injectable()
export class ReadingProgressService {
  constructor(
    private readonly database: DatabaseService,
    private readonly links: TitleLinksService,
    private readonly parsersClient: ParsersClientService,
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
    const { own, linked } = splitProgressRows(rows, titleKey);

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

  /**
   * Номер, название и ветку главы берём у источника сами (детали кешированы и почти всегда
   * тёплые — читалка только что грузила по ним соседние главы), а не доверяем клиенту: по этому
   * снимку отметку потом узнают на других источниках.
   */
  async update(
    userId: string,
    sourceId: string,
    titleId: string,
    body: UpdateReadingProgressRequest,
  ): Promise<ReadingProgress> {
    const titleRef = decodeTitleId(titleId);
    const { sourceId: chapterSourceId, opaqueId } = splitCompositeId(body.chapterId);
    if (chapterSourceId !== sourceId) throw new NotFoundApiException('Глава не из этого тайтла');

    const chapterRef = decodeChapterId(opaqueId);
    const { data } = await this.parsersClient.getDetails(sourceId, titleRef.url);
    const chapter = (data.chapters ?? []).find(
      (item) => item.id === chapterRef.id && item.branch === chapterRef.branch,
    );
    if (!chapter) throw new NotFoundApiException('Глава не найдена');

    const values = {
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
    return toReadingProgress(row);
  }
}

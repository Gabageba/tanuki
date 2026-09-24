import { generatePath } from 'react-router';
import type { TFunction } from 'i18next';
import {
  CHAPTER_NUMBERING,
  DEFAULT_BRANCH_ID,
  READING_MARK_CONFIDENCE,
  SORT_DIRECTION,
  type Chapter,
  type ChapterNumbering,
  type ReadingProgress,
  type SortDirection,
  type TitleReadingProgressResponse,
} from '@tanuki/contracts';
import { READER_PAGE_SEARCH_PARAM, ROUTE_PATHS } from '@/shared/lib/routes';
import {
  CHAPTER_READ_STATUS,
  type ChapterReadStatus,
  type LinkedReadingMark,
  type ReadingMark,
} from './models';

type ChapterPosition = {
  volume: number | null;
  number: number;
};

/** Какая из двух глав дальше в порядке чтения. При нумерации по томам сначала сравнивается том:
 *  глава 5 есть в каждом сезоне, и номер без тома ничего не говорит. Том без номера — после всех
 *  томов, как свежие главы, которые ещё ни в один том не вошли. */
const comparePosition = (a: ChapterPosition, b: ChapterPosition, byVolume: boolean) =>
  byVolume && a.volume !== b.volume
    ? (a.volume ?? Number.POSITIVE_INFINITY) - (b.volume ?? Number.POSITIVE_INFINITY)
    : a.number - b.number;

/** Своя отметка из другой ветки того же источника: нумерация внутри источника одна, поэтому
 *  ищется глава с тем же номером (и томом, если ветка нумерует главы по томам), а если такой
 *  нет — ближайшая раньше неё. */
const findChapterByNumber = (
  progress: ReadingProgress,
  chapters: Chapter[],
  numbering: ChapterNumbering,
) => {
  const { chapterNumber, chapterVolume } = progress;
  if (chapterNumber === null) return undefined;

  const mark = { volume: chapterVolume, number: chapterNumber };
  const byVolume = numbering === CHAPTER_NUMBERING.PER_VOLUME && chapterVolume !== null;
  let best: (ChapterPosition & { chapter: Chapter }) | undefined;
  for (const chapter of chapters) {
    if (chapter.number === null) continue;
    const position = { volume: chapter.volume, number: chapter.number };
    if (comparePosition(position, mark, byVolume) > 0) continue;
    if (!best || comparePosition(position, best, byVolume) > 0) best = { ...position, chapter };
  }
  return best?.chapter;
};

/** Своя отметка в этом списке глав. Только по ней красится прочитанное и ведёт «Продолжить». */
export const resolveOwnMark = (
  progress: TitleReadingProgressResponse | undefined,
  chapters: Chapter[],
  numbering: ChapterNumbering,
): ReadingMark | undefined => {
  const own = progress?.own;
  if (!own) return undefined;

  const chapter =
    chapters.find((item) => item.id === own.chapterId) ??
    findChapterByNumber(own, chapters, numbering);
  if (!chapter) return undefined;

  return {
    chapter,
    pageIndex: chapter.id === own.chapterId ? own.pageIndex : 0,
    confidence: READING_MARK_CONFIDENCE.EXACT,
    progress: own,
  };
};

/**
 * Отметки других источников группы, которые сервер перенёс на главы этой ветки, свежие первыми.
 * Страницу не переносим: разбивка глав на страницы у источников своя.
 */
export const resolveLinkedMarks = (
  progress: TitleReadingProgressResponse | undefined,
  chapters: Chapter[],
  branchId: string,
): LinkedReadingMark[] =>
  (progress?.linked ?? []).flatMap((item) => {
    const projection = item.projections.find((entry) => entry.branchId === branchId);
    const chapter = chapters.find((entry) => entry.id === projection?.chapterId);
    return projection && chapter
      ? { chapter, pageIndex: 0, confidence: projection.confidence, progress: item }
      : [];
  });

/**
 * Отметки других источников, которые не встали ни на одну главу этого списка: сервер не нашёл им
 * места в ветке или нашёл главу, которой в списке нет. Дополняет resolveLinkedMarks — вместе они
 * покрывают все отметки.
 */
export const getUnplacedLinkedProgress = (
  progress: TitleReadingProgressResponse | undefined,
  chapters: Chapter[],
  branchId: string,
) =>
  (progress?.linked ?? []).filter((item) => {
    const projection = item.projections.find((entry) => entry.branchId === branchId);
    return !projection || !chapters.some((entry) => entry.id === projection.chapterId);
  });

/** Глава отметки так, как её называет источник отметки: «Т. 3 Гл. 12», «Гл. 12» или название. */
export const getProgressChapterLabel = (progress: ReadingProgress, t: TFunction) => {
  const { chapterVolume, chapterNumber, chapterTitle } = progress;
  if (chapterNumber === null) return chapterTitle ?? t('untitled');
  return chapterVolume === null
    ? t('chapterNumberAbbrev', { number: chapterNumber })
    : t('volumeChapterNumberAbbrev', { volume: chapterVolume, number: chapterNumber });
};

/** Номер главы: «Т. 2 Гл. 5», если ветка нумерует главы по томам и без тома номер неоднозначен
 *  (глава 5 есть в каждом сезоне), иначе «Гл. 5». */
export const getChapterNumberLabel = (
  chapter: Chapter,
  numbering: ChapterNumbering,
  t: TFunction,
) =>
  numbering === CHAPTER_NUMBERING.PER_VOLUME && chapter.volume !== null
    ? t('volumeChapterNumberAbbrev', { volume: chapter.volume, number: chapter.number })
    : t('chapterNumberAbbrev', { number: chapter.number });

/** Глава этого тайтла так, как её показывает «Продолжить»: номер или название. */
export const getChapterLabel = (chapter: Chapter, numbering: ChapterNumbering, t: TFunction) =>
  chapter.number === null
    ? (chapter.title ?? t('untitled'))
    : getChapterNumberLabel(chapter, numbering, t);

export const getChapterBranchId = (chapter: Chapter) => chapter.branch ?? DEFAULT_BRANCH_ID;

export const getChapterReadStatus = (
  index: number,
  ownIndex: number,
  direction: SortDirection,
): ChapterReadStatus => {
  if (ownIndex === -1) return CHAPTER_READ_STATUS.UNREAD;
  if (index === ownIndex) return CHAPTER_READ_STATUS.CURRENT;

  const isOlder = direction === SORT_DIRECTION.DESC ? index > ownIndex : index < ownIndex;
  return isOlder ? CHAPTER_READ_STATUS.READ : CHAPTER_READ_STATUS.UNREAD;
};

export const getReaderPath = (titleId: string, chapterId: string, pageIndex = 0) => {
  const path = generatePath(ROUTE_PATHS.READER, { titleId, chapterId });
  return pageIndex > 0 ? `${path}?${READER_PAGE_SEARCH_PARAM}=${pageIndex + 1}` : path;
};

/** Отметка, какой её вернёт сервер, — чтобы показать новое место сразу, не дожидаясь ответа. */
export const toOptimisticProgress = (chapter: Chapter, pageIndex: number): ReadingProgress => ({
  sourceId: chapter.id.slice(0, chapter.id.indexOf(':')),
  chapterId: chapter.id,
  chapterVolume: chapter.volume,
  chapterNumber: chapter.number,
  chapterTitle: chapter.title,
  branchId: getChapterBranchId(chapter),
  pageIndex,
  updatedAt: `${new Date().toISOString().slice(0, 19)}Z`,
});

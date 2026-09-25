import {
  READING_MARK_CONFIDENCE,
  SORT_DIRECTION,
  type Chapter,
  type ReadingMarkConfidence,
  type ReadingProgress,
} from '@tanuki/contracts';
import {
  APPROXIMATE_STYLE,
  type ApproximateStyle,
  type DemoBranch,
  type DemoMark,
  type DemoState,
  type PlacedMark,
  type SourceStackItem,
  TIMELINE_ZONE,
  type TimelineZone,
} from './models';
import { CHAPTER_READ_STATUS } from '@/entities/title/models';
import { getChapterReadStatus } from '@/entities/title/readingProgress';

const CHAPTER_TITLES = [
  'Пролог',
  'Незнакомец у ворот',
  'Цена обещания',
  'Затишье',
  'Первая кровь',
  'Дом на холме',
  'Бегство',
  'Старые долги',
  'Буря',
  'Разлом',
  'Молчание',
  'Эпилог тома',
];

export const toServerDateTime = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;

export const minutesAgo = (minutes: number) =>
  toServerDateTime(new Date(Date.now() - minutes * 60_000));

export const getChapterId = (branchId: string, position: number) =>
  `readmanga_ru:${branchId}-${position}`;

/** Главы ветки в порядке чтения. Позиция — сквозной номер 1–12, общий для всех веток. */
export const buildChapters = (branch: DemoBranch): Chapter[] =>
  CHAPTER_TITLES.map((title, index) => {
    const position = index + 1;
    return {
      id: getChapterId(branch.id, position),
      titleId: 'readmanga_ru:demo',
      number: branch.isPerVolume ? ((position - 1) % 6) + 1 : position,
      volume: branch.isPerVolume ? Math.ceil(position / 6) : null,
      title,
      branch: branch.name,
      scanlator: null,
      uploadedAt: `2026-0${Math.ceil(position / 3) + 1}-${String(position * 2).padStart(2, '0')}T12:00:00Z`,
      url: '',
    };
  });

export const placeMark = (
  mark: DemoMark,
  branchId: string,
  chapters: Chapter[],
): PlacedMark | undefined => {
  const placement = mark.placements.find((item) => item.branchId === branchId);
  const chapter = chapters.find(
    (item) => placement && item.id === getChapterId(branchId, placement.position),
  );
  return placement && chapter ? { mark, chapter, confidence: placement.confidence } : undefined;
};

export const getChapterMarks = (demo: DemoState, chapterId: string) =>
  demo.placed.filter((item) => item.chapter.id === chapterId);

export const findPlacedMark = (demo: DemoState, mark: DemoMark) =>
  demo.placed.find((item) => item.mark.source.id === mark.source.id);

export const isApproximate = (confidence: ReadingMarkConfidence | undefined) =>
  confidence === READING_MARK_CONFIDENCE.APPROXIMATE;

/** Старый стиль — только полупрозрачная иконка с пунктирной обводкой. */
export const isDimmedApproximate = (
  style: ApproximateStyle,
  confidence: ReadingMarkConfidence | undefined,
) => isApproximate(confidence) && style === APPROXIMATE_STYLE.DIMMED;

/** Бейдж «?» на иконке; им же обозначается диапазон там, где макет его не рисует. */
export const hasQuestionBadge = (
  style: ApproximateStyle,
  confidence: ReadingMarkConfidence | undefined,
) => {
  if (!isApproximate(confidence)) return false;
  switch (style) {
    case APPROXIMATE_STYLE.QUESTION_BADGE:
    case APPROXIMATE_STYLE.RANGE:
      return true;
    case APPROXIMATE_STYLE.DIMMED:
    case APPROXIMATE_STYLE.CAPTION:
      return false;
  }
};

/** «≈» перед главой в тексте: во всех стилях, кроме старого приглушённого. */
export const hasApproximateSymbol = (
  style: ApproximateStyle,
  confidence: ReadingMarkConfidence | undefined,
) => isApproximate(confidence) && style !== APPROXIMATE_STYLE.DIMMED;

export const getApproximateStyleLabel = (style: ApproximateStyle) => {
  switch (style) {
    case APPROXIMATE_STYLE.DIMMED:
      return 'Приглушённо';
    case APPROXIMATE_STYLE.QUESTION_BADGE:
      return 'Бейдж «?»';
    case APPROXIMATE_STYLE.CAPTION:
      return 'Подпись';
    case APPROXIMATE_STYLE.RANGE:
      return 'Диапазон';
  }
};

export const toStackItems = (marks: PlacedMark[]): SourceStackItem[] =>
  marks.map((item) => ({ source: item.mark.source, confidence: item.confidence }));

/** Индекс главы в списке показа; -1 — главы в списке нет. */
export const getChapterIndex = (demo: DemoState, chapter: Chapter | undefined) =>
  chapter ? demo.chapters.findIndex((item) => item.id === chapter.id) : -1;

/** Отметка, ушедшая дальше всех (и дальше своей), — для подписи в сводке S2. */
export const getFurthestPlacedMark = (demo: DemoState) => {
  const ownIndex = getChapterIndex(demo, demo.own?.chapter);
  const isNewer = (a: number, b: number) =>
    demo.direction === SORT_DIRECTION.DESC ? a < b : a > b;

  let furthest: PlacedMark | undefined;
  for (const item of demo.placed) {
    const index = getChapterIndex(demo, item.chapter);
    const bestIndex = furthest ? getChapterIndex(demo, furthest.chapter) : ownIndex;
    if (bestIndex === -1 || isNewer(index, bestIndex)) furthest = item;
  }
  return furthest;
};

/** «Т. 2 Гл. 4» или «Гл. 10» — номер главы, как его показывают в списке; без номера — название. */
const formatChapterLabel = (volume: number | null, number: number | null, title: string | null) => {
  if (number === null) return title ?? 'Без названия';
  return volume === null ? `Гл. ${number}` : `Т. ${volume} Гл. ${number}`;
};

/** Глава этого тайтла в нумерации её ветки. */
export const getChapterLabel = (chapter: Chapter) =>
  formatChapterLabel(chapter.volume, chapter.number, chapter.title);

/** Глава отметки так, как её называет источник отметки. */
export const getProgressLabel = (progress: ReadingProgress) =>
  formatChapterLabel(progress.chapterVolume, progress.chapterNumber, progress.chapterTitle);

/** Иконки всех источников, где читали, свежие первыми, — для стопки в сводке. */
export const getSummaryStackItems = (demo: DemoState): SourceStackItem[] =>
  demo.marks.map((mark) => ({
    source: mark.source,
    confidence: findPlacedMark(demo, mark)?.confidence,
  }));

/** Ширина стопки SourceStack: иконки перекрываются на треть, лишние уходят в «+N». */
export const getStackWidth = (count: number, size: number, max: number) => {
  const visibleCount = Math.min(count, max);
  return visibleCount === 0 ? 0 : size + (visibleCount - 1) * ((size * 2) / 3);
};

/** Больше всего отметок на одной главе в выбранной ветке — по нему считается ширина слота. */
export const getMaxChapterMarkCount = (demo: DemoState) =>
  Math.max(0, ...demo.chapters.map((chapter) => getChapterMarks(demo, chapter.id).length));

export const hasApproximateMarks = (marks: PlacedMark[]) =>
  marks.length > 0 && marks.every((item) => isApproximate(item.confidence));

/** Подпись под мелкой иконкой не влезает — там вместо неё бейдж «?». */
export const getCompactApproximateStyle = (style: ApproximateStyle) =>
  style === APPROXIMATE_STYLE.CAPTION ? APPROXIMATE_STYLE.QUESTION_BADGE : style;

/**
 * J: главы после своей отметки, но не дальше самой дальней чужой, — «прочитано где-то ещё». Всё
 * остальное — как у своего прогресса.
 */
export const getTimelineZone = (demo: DemoState, index: number): TimelineZone => {
  const ownIndex = getChapterIndex(demo, demo.own?.chapter);
  const status = getChapterReadStatus(index, ownIndex, demo.direction);
  if (status === CHAPTER_READ_STATUS.READ) return TIMELINE_ZONE.READ;
  if (status === CHAPTER_READ_STATUS.CURRENT) return TIMELINE_ZONE.CURRENT;

  const furthestIndex = getChapterIndex(demo, getFurthestPlacedMark(demo)?.chapter);
  if (furthestIndex === -1) return TIMELINE_ZONE.UNREAD;
  const isWithin =
    demo.direction === SORT_DIRECTION.DESC ? index >= furthestIndex : index <= furthestIndex;
  return isWithin ? TIMELINE_ZONE.ELSEWHERE : TIMELINE_ZONE.UNREAD;
};

/** Главы в порядке чтения — от первой к последней, как бы ни был отсортирован список. */
export const getReadingOrder = (demo: DemoState) =>
  demo.direction === SORT_DIRECTION.DESC ? [...demo.chapters].reverse() : demo.chapters;

/** Номер главы по порядку чтения, с нуля; -1 — главы в ветке нет. */
export const getReadingPosition = (demo: DemoState, chapter: Chapter | undefined) =>
  chapter ? getReadingOrder(demo).findIndex((item) => item.id === chapter.id) : -1;

/** Сколько глав прочитано, если остановились на этой: позиция + 1. */
export const getReadCount = (demo: DemoState, chapter: Chapter | undefined) =>
  getReadingPosition(demo, chapter) + 1;

/** Кто дочитал до этой главы или дальше: своя отметка и чужие, нашедшие место в ветке. */
export const getCoveringMarks = (demo: DemoState, chapter: Chapter) => {
  const position = getReadingPosition(demo, chapter);
  return [...(demo.own ? [demo.own] : []), ...demo.placed].filter(
    (item) => getReadingPosition(demo, item.chapter) >= position,
  );
};

/** «1 глава», «4 главы», «6 глав» — песочница без i18n, склонение вручную. */
export const formatChapterCount = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} глав`;
  if (last === 1) return `${count} глава`;
  if (last >= 2 && last <= 4) return `${count} главы`;
  return `${count} глав`;
};

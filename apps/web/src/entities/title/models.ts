import type {
  Chapter,
  EnumLiteralsOf,
  LinkedReadingProgress,
  ReadingMarkConfidence,
  ReadingProgress,
} from '@tanuki/contracts';

export const CHAPTER_READ_STATUS = {
  READ: 'read',
  CURRENT: 'current',
  UNREAD: 'unread',
} as const;
export type ChapterReadStatus = EnumLiteralsOf<typeof CHAPTER_READ_STATUS>;

export type ReadingMark = {
  chapter: Chapter;
  pageIndex: number;
  confidence: ReadingMarkConfidence;
  progress: ReadingProgress;
};

/** Отметка другого источника группы — знает, где лежит её тайтл. */
export type LinkedReadingMark = ReadingMark & {
  progress: LinkedReadingProgress;
};

/** Размытие скрытой обложки 18+ в px — в каталоге и в закладках. */
export const HIDDEN_COVER_BLUR = 20;

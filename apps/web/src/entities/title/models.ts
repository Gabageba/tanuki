import type {
  Chapter,
  EnumLiteralsOf,
  LinkedReadingProgress,
  ReadingMarkConfidence,
  ReadingProgress,
  Title,
} from '@tanuki/contracts';

/** «Продолжить чтение» на главной — сбрасывается, когда сохраняется позиция чтения. */
export const CONTINUE_READING_QUERY_KEY = ['continue-reading'] as const;

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

/** Поля, которых хватает обложке, — их есть и у `Title`, и у закладки, и у «Продолжить чтение». */
export type TitleCoverData = Pick<Title, 'coverUrl' | 'name' | 'sourceId' | 'contentRating'>;

/** Оценка на обложке: рейтинг, а без него лайки. Бывает не у всех — у снимков тайтла её нет. */
export type TitleScoreData = Partial<Pick<Title, 'rating' | 'likes'>>;

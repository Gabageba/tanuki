import type { ReadingMarkConfidence } from '@tanuki/contracts';
import type { readingProgress } from '../database/schema';
import type { RawChapter } from '../parsers-client/parsers-client.types';

/** Пара глав, совпавших однозначно: индексы в порядке чтения первого и второго списка. */
export type ChapterAnchor = {
  sourceIndex: number;
  targetIndex: number;
};

/** Якорь-кандидат и сколько весят ключи, на которых совпали его главы. */
export type WeightedAnchor = ChapterAnchor & {
  weight: number;
};

export type AlignedChapter = {
  chapter: RawChapter;
  confidence: ReadingMarkConfidence;
};

/** То, что о главе отметки известно без полного списка глав её источника. */
export type ChapterSnapshot = Pick<RawChapter, 'volume' | 'number' | 'title'>;

export type ReadingProgressRow = typeof readingProgress.$inferSelect;

/**
 * Последняя глава ветки по снимку глав: том и номер самой поздней и наибольший номер в ветке —
 * без учёта тома, на случай устаревших строк снимка (глава переехала в другой том).
 */
export type LatestChapter = Pick<ChapterSnapshot, 'volume'> & {
  number: number;
  maxNumber: number;
};

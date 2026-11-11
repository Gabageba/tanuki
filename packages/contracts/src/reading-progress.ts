import { z } from 'zod';
import { ContentRatingSchema, TitleTypeSchema } from './title';
import type { EnumLiteralsOf } from './utils';

/**
 * Где пользователь остановился в тайтле на одном источнике. Том, номер и название главы — снимок
 * на момент сохранения: по нему отметку узнают на подтверждённых совпадениях, когда полного
 * списка глав её источника под рукой нет.
 */
export const ReadingProgressSchema = z.object({
  sourceId: z.string(),
  chapterId: z.string(), // Chapter.id — "sourceId:opaqueId"
  chapterVolume: z.number().nullable(),
  chapterNumber: z.number().nullable(),
  chapterTitle: z.string().nullable(),
  branchId: z.string(), // Branch.id: имя ветки или DEFAULT_BRANCH_ID
  pageIndex: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});
export type ReadingProgress = z.infer<typeof ReadingProgressSchema>;

/**
 * Насколько точно отметка другого источника перенесена на главу этого тайтла. EXACT — глава
 * совпала сама (том и номер, сквозной номер или название); APPROXIMATE — её место вычислено
 * между соседними совпавшими главами, и промах на пару глав возможен.
 */
export const READING_MARK_CONFIDENCE = {
  EXACT: 'exact',
  APPROXIMATE: 'approximate',
} as const;
export type ReadingMarkConfidence = EnumLiteralsOf<typeof READING_MARK_CONFIDENCE>;

export const ReadingMarkConfidenceSchema = z.enum(READING_MARK_CONFIDENCE);

/** Глава этого тайтла, на которую пришлась чужая отметка, — по одной на ветку. */
export const ReadingProgressProjectionSchema = z.object({
  branchId: z.string(), // Branch.id этого тайтла
  chapterId: z.string(), // Chapter.id этого тайтла
  confidence: ReadingMarkConfidenceSchema,
});
export type ReadingProgressProjection = z.infer<typeof ReadingProgressProjectionSchema>;

export const LinkedReadingProgressSchema = ReadingProgressSchema.extend({
  /** Title.id отметки на её источнике — чтобы туда перейти; null — источник сейчас не ответил. */
  titleId: z.string().nullable(),
  /** Пустой — в этом тайтле место отметки не нашлось ни в одной ветке. */
  projections: z.array(ReadingProgressProjectionSchema),
});
export type LinkedReadingProgress = z.infer<typeof LinkedReadingProgressSchema>;

export const TitleReadingProgressResponseSchema = z.object({
  /** Отметка на источнике этого тайтла; null — здесь ещё не читали. */
  own: ReadingProgressSchema.nullable(),
  /** Отметки на подтверждённых совпадениях тайтла, свежие первыми. */
  linked: z.array(LinkedReadingProgressSchema),
});
export type TitleReadingProgressResponse = z.infer<typeof TitleReadingProgressResponseSchema>;

/** Том, номер и название главы сервер берёт у источника сам — клиенту достаточно id главы. */
export const UpdateReadingProgressRequestSchema = z.object({
  chapterId: z.string().min(1),
  pageIndex: z.number().int().min(0),
});
export type UpdateReadingProgressRequest = z.infer<typeof UpdateReadingProgressRequestSchema>;

/** Сколько тайтлов в «Продолжить чтение». */
export const CONTINUE_READING_LIMIT = 20;

/**
 * Карточка «Продолжить чтение» — одна на группу подтверждённых совпадений: источник и глава самой
 * свежей отметки. Название, обложка, рейтинг и тип — общий снимок этого источника, иначе личный резерв.
 */
export const ContinueReadingItemSchema = z.object({
  title: z.object({
    id: z.string(), // Title.id — куда ведёт карточка
    sourceId: z.string(),
    name: z.string(),
    coverUrl: z.string(), // уже проксированный /api/v1/img?...
    contentRating: ContentRatingSchema,
    type: TitleTypeSchema.nullable(),
  }),
  chapter: z.object({
    id: z.string(),
    number: z.number().nullable(),
    volume: z.number().nullable(),
    title: z.string().nullable(),
  }),
  updatedAt: z.string().datetime(),
});
export type ContinueReadingItem = z.infer<typeof ContinueReadingItemSchema>;

export const ContinueReadingResponseSchema = z.object({
  /** Свежие первыми, до CONTINUE_READING_LIMIT. */
  items: z.array(ContinueReadingItemSchema),
});
export type ContinueReadingResponse = z.infer<typeof ContinueReadingResponseSchema>;

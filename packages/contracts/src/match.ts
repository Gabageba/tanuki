import { z } from 'zod';
import { TitleSchema } from './title';
import { SearchGroupStatusSchema } from './search';
import type { EnumLiteralsOf } from './utils';

/**
 * Насколько мы уверены, что найденный на другом источнике тайтл — тот же самый.
 *
 * CONFIRMED стоит особняком: это не результат скоринга, а решение человека (см.
 * TITLE_LINK_VERDICT), и оно бьёт любой алгоритмический уровень. Остальные три — градация
 * доверия к текстовому совпадению названий, уточнённая метаданными.
 */
export const MATCH_CONFIDENCE = {
  CONFIRMED: 'confirmed',
  EXACT: 'exact',
  HIGH: 'high',
  LOW: 'low',
} as const;
export type MatchConfidence = EnumLiteralsOf<typeof MATCH_CONFIDENCE>;

export const MatchConfidenceSchema = z.enum(MATCH_CONFIDENCE);

/**
 * Ручная правка связи между двумя тайтлами. NONE — не хранимое состояние, а команда «забудь
 * мою пометку»: связь возвращается к тому, что скажет алгоритм.
 */
export const TITLE_LINK_VERDICT = {
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  NONE: 'none',
} as const;
export type TitleLinkVerdict = EnumLiteralsOf<typeof TITLE_LINK_VERDICT>;

export const TitleLinkVerdictSchema = z.enum(TITLE_LINK_VERDICT);

export const TitleMatchSchema = z.object({
  title: TitleSchema,
  score: z.number().min(0).max(1),
  confidence: MatchConfidenceSchema,
  /** Вариант названия, давший максимум — UI показывает его, когда он отличается от title.name. */
  matchedName: z.string(),
  /**
   * true, если с этого же источника пришёл ещё один почти такой же кандидат и мы не смогли
   * выбрать между ними. UI рисует такие строки одной группой.
   */
  tied: z.boolean(),
});

export type TitleMatch = z.infer<typeof TitleMatchSchema>;

export const TitleMatchesResponseSchema = z.object({
  /** Подтверждённые вручную идут первыми, остальные — по убыванию score. */
  items: z.array(TitleMatchSchema),
  /** Источники, не отдавшие результат: status тут никогда не бывает ok. */
  failures: z.array(
    z.object({
      sourceId: z.string(),
      status: SearchGroupStatusSchema,
    }),
  ),
  stale: z.boolean().optional(),
});

export type TitleMatchesResponse = z.infer<typeof TitleMatchesResponseSchema>;

export const TitleLinkRequestSchema = z.object({
  /** Полный Title.id второй стороны связи — "sourceId:opaqueId". */
  targetId: z.string().min(1),
  verdict: TitleLinkVerdictSchema,
  /**
   * Папка, в которой оставить закладку, если обе стороны связи лежат в закладках в разных папках.
   * Без неё подтверждение такой связи отвечает 409 bookmarkFolderConflict.
   */
  bookmarkFolderId: z.string().uuid().optional(),
});

export type TitleLinkRequest = z.infer<typeof TitleLinkRequestSchema>;

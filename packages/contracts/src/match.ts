import { z } from 'zod';
import { MangaSchema } from './manga';
import { SearchGroupStatusSchema } from './search';
import type { EnumLiteralsOf } from './utils';

/**
 * Насколько мы уверены, что найденный на другом источнике тайтл — тот же самый.
 *
 * CONFIRMED стоит особняком: это не результат скоринга, а решение человека (см.
 * MANGA_LINK_VERDICT), и оно бьёт любой алгоритмический уровень. Остальные три — градация
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
export const MANGA_LINK_VERDICT = {
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  NONE: 'none',
} as const;
export type MangaLinkVerdict = EnumLiteralsOf<typeof MANGA_LINK_VERDICT>;

export const MangaLinkVerdictSchema = z.enum(MANGA_LINK_VERDICT);

export const MangaMatchSchema = z.object({
  manga: MangaSchema,
  score: z.number().min(0).max(1),
  confidence: MatchConfidenceSchema,
  /** Вариант названия, давший максимум — UI показывает его, когда он отличается от manga.title. */
  matchedTitle: z.string(),
  /**
   * true, если с этого же источника пришёл ещё один почти такой же кандидат и мы не смогли
   * выбрать между ними. UI рисует такие строки одной группой.
   */
  tied: z.boolean(),
});

export type MangaMatch = z.infer<typeof MangaMatchSchema>;

export const MangaMatchesResponseSchema = z.object({
  /** Подтверждённые вручную идут первыми, остальные — по убыванию score. */
  items: z.array(MangaMatchSchema),
  /** Источники, не отдавшие результат: status тут никогда не бывает ok. */
  failures: z.array(
    z.object({
      sourceId: z.string(),
      status: SearchGroupStatusSchema,
    }),
  ),
  stale: z.boolean().optional(),
});

export type MangaMatchesResponse = z.infer<typeof MangaMatchesResponseSchema>;

export const MangaLinkRequestSchema = z.object({
  /** Полный Manga.id второй стороны связи — "sourceId:opaqueId". */
  targetId: z.string().min(1),
  verdict: MangaLinkVerdictSchema,
});

export type MangaLinkRequest = z.infer<typeof MangaLinkRequestSchema>;

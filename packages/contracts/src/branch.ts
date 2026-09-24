import { z } from 'zod';

/** Источник без веток помечает главы `branch: null` — наружу такая ветка уходит под этим
 *  синтетическим id. Одно правило и для API, и для фронта, который по главе вычисляет её ветку. */
export const DEFAULT_BRANCH_ID = 'default';

export const BranchSchema = z.object({
  id: z.string(), // null branch normalized to DEFAULT_BRANCH_ID
  name: z.string().nullable(),
  scanlator: z.string().nullable(),
  chaptersCount: z.number(),
  lastUpdatedAt: z.string().datetime().nullable(),
});

export type Branch = z.infer<typeof BranchSchema>;

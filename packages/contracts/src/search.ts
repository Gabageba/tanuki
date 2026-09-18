import { z } from 'zod';
import { TitleSchema } from './title';
import type { EnumLiteralsOf } from './utils';

/** Исход опроса одного источника в веере мультипоиска. */
export const SEARCH_GROUP_STATUS = {
  OK: 'ok',
  TIMEOUT: 'timeout',
  ERROR: 'error',
} as const;
export type SearchGroupStatus = EnumLiteralsOf<typeof SEARCH_GROUP_STATUS>;

export const SearchGroupStatusSchema = z.enum(SEARCH_GROUP_STATUS);

export const SearchGroupSchema = z.object({
  sourceId: z.string(),
  status: SearchGroupStatusSchema,
  items: z.array(TitleSchema),
});

export type SearchGroup = z.infer<typeof SearchGroupSchema>;

export const SearchResponseSchema = z.object({
  groups: z.array(SearchGroupSchema),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

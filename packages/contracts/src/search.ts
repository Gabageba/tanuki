import { z } from 'zod';
import { MangaSchema } from './manga';

export const SearchGroupSchema = z.object({
  sourceId: z.string(),
  status: z.enum(['ok', 'timeout', 'error']),
  items: z.array(MangaSchema),
});

export type SearchGroup = z.infer<typeof SearchGroupSchema>;

export const SearchResponseSchema = z.object({
  groups: z.array(SearchGroupSchema),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

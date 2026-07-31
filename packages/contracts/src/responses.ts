import { z } from 'zod';
import { BranchSchema } from './branch';
import { ChapterSchema } from './chapter';
import { MangaSchema } from './manga';
import { PageSchema } from './page';
import { SourceSchema } from './source';

export const SourcesResponseSchema = z.object({
  items: z.array(SourceSchema),
});

export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;

export const CatalogResponseSchema = z.object({
  items: z.array(MangaSchema),
  page: z.number(),
  hasNext: z.boolean(),
  stale: z.boolean().optional(),
});

export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

export const MangaDetailsResponseSchema = z.object({
  manga: MangaSchema,
  branches: z.array(BranchSchema),
});

export type MangaDetailsResponse = z.infer<typeof MangaDetailsResponseSchema>;

export const ChaptersResponseSchema = z.object({
  items: z.array(ChapterSchema),
});

export type ChaptersResponse = z.infer<typeof ChaptersResponseSchema>;

export const PagesResponseSchema = z.object({
  items: z.array(PageSchema),
  prevChapterId: z.string().nullable(),
  nextChapterId: z.string().nullable(),
});

export type PagesResponse = z.infer<typeof PagesResponseSchema>;

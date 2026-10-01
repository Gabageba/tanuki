import { z } from 'zod';
import { BranchSchema } from './branch';
import { ChapterNumberingSchema, ChapterSchema } from './chapter';
import { FilterGroupSchema } from './filter';
import { TitleSchema } from './title';
import { PageSchema } from './page';
import { SourceContentTypeSchema, SourceSchema } from './source';

/**
 * Grouped by contentType rather than a flat `items` list: the UI renders one section per kind
 * of content. Every key is always present (empty array if no source of that type is enabled),
 * so consumers can iterate the groups without null checks.
 */
export const SourcesResponseSchema = z.record(SourceContentTypeSchema, z.array(SourceSchema));

export type SourcesResponse = z.infer<typeof SourcesResponseSchema>;

/**
 * Сколько источников сейчас работает — без настроек зрителя: в счёт идут и источники 18+, и
 * выключенные кем-то, поэтому число одно и то же для гостя и для любого пользователя.
 */
export const SourcesCountResponseSchema = z.object({
  count: z.number(),
});

export type SourcesCountResponse = z.infer<typeof SourcesCountResponseSchema>;

export const CatalogResponseSchema = z.object({
  items: z.array(TitleSchema),
  page: z.number(),
  hasNext: z.boolean(),
  stale: z.boolean().optional(),
});

export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

export const TitleDetailsResponseSchema = z.object({
  title: TitleSchema,
  branches: z.array(BranchSchema),
  stale: z.boolean().optional(),
});

export type TitleDetailsResponse = z.infer<typeof TitleDetailsResponseSchema>;

export const ChaptersResponseSchema = z.object({
  items: z.array(ChapterSchema),
  /** Как ветка нумерует главы: при нумерации по томам номер показывается вместе с томом. */
  numbering: ChapterNumberingSchema,
  stale: z.boolean().optional(),
});

export type ChaptersResponse = z.infer<typeof ChaptersResponseSchema>;

export const PagesResponseSchema = z.object({
  items: z.array(PageSchema),
  prevChapterId: z.string().nullable(),
  nextChapterId: z.string().nullable(),
  stale: z.boolean().optional(),
});

export type PagesResponse = z.infer<typeof PagesResponseSchema>;

export const FiltersResponseSchema = z.object({
  groups: z.array(FilterGroupSchema),
});

export type FiltersResponse = z.infer<typeof FiltersResponseSchema>;

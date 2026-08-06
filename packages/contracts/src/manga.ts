import { z } from 'zod';
import { TagSchema } from './tag';
import type { EnumLiteralsOf } from './utils';

/**
 * Публичные статусы тайтла. Парсеры расширяют этот же набор своим RESTRICTED
 * (см. RAW_MANGA_STATE в @tanuki/parsers) — сюда он не выходит.
 */
export const MANGA_STATE = {
  ONGOING: 'ONGOING',
  FINISHED: 'FINISHED',
  PAUSED: 'PAUSED',
  ABANDONED: 'ABANDONED',
  UPCOMING: 'UPCOMING',
} as const;
export type MangaState = EnumLiteralsOf<typeof MANGA_STATE>;

export const MangaStateSchema = z.enum(MANGA_STATE);

export const CONTENT_RATING = {
  SAFE: 'SAFE',
  SUGGESTIVE: 'SUGGESTIVE',
  ADULT: 'ADULT',
} as const;
export type ContentRating = EnumLiteralsOf<typeof CONTENT_RATING>;

export const ContentRatingSchema = z.enum(CONTENT_RATING);

export const MANGA_TYPE = {
  MANGA: 'MANGA',
  MANHWA: 'MANHWA',
  MANHUA: 'MANHUA',
  COMICS: 'COMICS',
  OTHER: 'OTHER',
} as const;
export type MangaType = EnumLiteralsOf<typeof MANGA_TYPE>;

export const MangaTypeSchema = z.enum(MANGA_TYPE);

export const MangaSchema = z.object({
  id: z.string(), // "READMANGA:solo-leveling"
  sourceId: z.string(),
  slug: z.string(),

  title: z.string(), // локализованное название источника
  altTitles: z.array(z.string()), // оригинал, англ., синонимы

  coverUrl: z.string(), // уже проксированный /api/v1/img?...
  largeCoverUrl: z.string().nullable(),

  description: z.string().nullable(),
  authors: z.array(z.string()),
  tags: z.array(TagSchema),

  state: MangaStateSchema.nullable(),
  contentRating: ContentRatingSchema,
  type: MangaTypeSchema.nullable(),

  rating: z.number().min(0).max(1).nullable(), // нормализовано к 0..1
  chaptersCount: z.number().nullable(),

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});

export type Manga = z.infer<typeof MangaSchema>;

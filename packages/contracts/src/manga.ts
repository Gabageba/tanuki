import { z } from 'zod';
import { TagSchema } from './tag';
import type { EnumLiteralsOf } from './utils';

/** Публичные статусы тайтла — публикация как таковая, не доступность его глав. */
export const MANGA_STATE = {
  ONGOING: 'ongoing',
  FINISHED: 'finished',
  PAUSED: 'paused',
  ABANDONED: 'abandoned',
  UPCOMING: 'upcoming',
} as const;
export type MangaState = EnumLiteralsOf<typeof MANGA_STATE>;

export const MangaStateSchema = z.enum(MANGA_STATE);

/**
 * Причина, по которой источник не отдаёт главы тайтла целиком: GEO — гео-ограничение,
 * LEGAL — блокировка по требованию правообладателя, PAYWALL — все главы платные.
 */
export const MANGA_RESTRICTION = {
  GEO: 'geo',
  LEGAL: 'legal',
  PAYWALL: 'paywall',
} as const;
export type MangaRestriction = EnumLiteralsOf<typeof MANGA_RESTRICTION>;

export const MangaRestrictionSchema = z.enum(MANGA_RESTRICTION);

export const CONTENT_RATING = {
  SAFE: 'safe',
  SUGGESTIVE: 'suggestive',
  ADULT: 'adult',
} as const;
export type ContentRating = EnumLiteralsOf<typeof CONTENT_RATING>;

export const ContentRatingSchema = z.enum(CONTENT_RATING);

export const MANGA_TYPE = {
  MANGA: 'manga',
  MANHWA: 'manhwa',
  MANHUA: 'manhua',
  COMICS: 'comics',
  OTHER: 'other',
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
  restriction: MangaRestrictionSchema.nullable(),
  contentRating: ContentRatingSchema,
  type: MangaTypeSchema.nullable(),
  year: z.number().nullable(),

  rating: z.number().min(0).max(10).nullable(), // приведено к единой шкале 0..10
  likes: z.number().nullable(), // неограниченный счётчик лайков/плюсиков, если source не даёт rating
  chaptersCount: z.number().nullable(),
  pages: z.number().nullable(), // число страниц тайтла целиком, если source отдаёт его на уровне манги

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});

export type Manga = z.infer<typeof MangaSchema>;

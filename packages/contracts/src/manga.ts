import { z } from 'zod';
import { TagSchema } from './tag';
import type { EnumLiteralsOf } from './utils';

/**
 * Публичные статусы тайтла. Один и тот же набор значений обслуживает два независимых поля на
 * `Manga` — `releaseState` (выход оригинала) и `translationState` (готовность перевода на
 * источнике) — источник может знать одно, оба или ни одного из двух.
 */
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

  releaseState: MangaStateSchema.nullable(),
  translationState: MangaStateSchema.nullable(),
  restriction: MangaRestrictionSchema.nullable(),
  contentRating: ContentRatingSchema,
  type: MangaTypeSchema.nullable(),
  year: z.number().nullable(), // для карточек — см. releaseDate для полной даты
  releaseDate: z.string().nullable(), // YYYY-MM-DD, если source отдаёт больше, чем один год
  lastUpdatedAt: z.string().nullable(), // YYYY-MM-DDTHH:MM:SSZ — дата выхода последней главы

  rating: z.number().min(0).max(10).nullable(), // приведено к единой шкале 0..10, округлено до 1 знака после запятой
  likes: z.number().nullable(), // неограниченный счётчик лайков/плюсиков, если source не даёт rating
  chaptersCount: z.number().nullable(),
  pages: z.number().nullable(), // число страниц тайтла целиком, если source отдаёт его на уровне манги

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});

export type Manga = z.infer<typeof MangaSchema>;

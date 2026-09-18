import { z } from 'zod';
import { TagSchema } from './tag';
import type { EnumLiteralsOf } from './utils';

/**
 * Публичные статусы тайтла. Один и тот же набор значений обслуживает два независимых поля на
 * `Title` — `releaseState` (выход оригинала) и `translationState` (готовность перевода на
 * источнике) — источник может знать одно, оба или ни одного из двух.
 */
export const TITLE_STATE = {
  ONGOING: 'ongoing',
  FINISHED: 'finished',
  PAUSED: 'paused',
  ABANDONED: 'abandoned',
  UPCOMING: 'upcoming',
} as const;
export type TitleState = EnumLiteralsOf<typeof TITLE_STATE>;

export const TitleStateSchema = z.enum(TITLE_STATE);

/**
 * Причина, по которой источник не отдаёт главы тайтла целиком: GEO — гео-ограничение,
 * LEGAL — блокировка по требованию правообладателя, PAYWALL — все главы платные.
 */
export const TITLE_RESTRICTION = {
  GEO: 'geo',
  LEGAL: 'legal',
  PAYWALL: 'paywall',
} as const;
export type TitleRestriction = EnumLiteralsOf<typeof TITLE_RESTRICTION>;

export const TitleRestrictionSchema = z.enum(TITLE_RESTRICTION);

export const CONTENT_RATING = {
  SAFE: 'safe',
  SUGGESTIVE: 'suggestive',
  ADULT: 'adult',
} as const;
export type ContentRating = EnumLiteralsOf<typeof CONTENT_RATING>;

export const ContentRatingSchema = z.enum(CONTENT_RATING);

export const TITLE_TYPE = {
  MANGA: 'manga',
  MANHWA: 'manhwa',
  MANHUA: 'manhua',
  COMICS: 'comics',
  OTHER: 'other',
} as const;
export type TitleType = EnumLiteralsOf<typeof TITLE_TYPE>;

export const TitleTypeSchema = z.enum(TITLE_TYPE);

export const TitleSchema = z.object({
  id: z.string(), // "READMANGA:solo-leveling" — sourceId + opaqueId, use as-is for routes/API calls
  sourceId: z.string(),
  slug: z.string(),

  name: z.string(), // локализованное название источника
  originalNames: z.array(z.string()), // название(я) на языке оригинала — иногда это несколько
  // равноправных вариантов разом (романизация + нативное письмо), а не один текст
  altNames: z.array(z.string()), // синонимы, отдельные от оригинала и локализованного названия

  coverUrl: z.string(), // уже проксированный /api/v1/img?...
  largeCoverUrl: z.string().nullable(),

  description: z.string().nullable(),
  authors: z.array(z.string()),
  artists: z.array(z.string()),
  publishers: z.array(z.string()),
  magazines: z.array(z.string()),
  translators: z.array(z.string()),
  tags: z.array(TagSchema),

  releaseState: TitleStateSchema.nullable(),
  translationState: TitleStateSchema.nullable(),
  restriction: TitleRestrictionSchema.nullable(),
  contentRating: ContentRatingSchema,
  type: TitleTypeSchema.nullable(),
  country: z.string().nullable(), // страна происхождения оригинала, если source отдаёт её отдельно от type
  series: z.array(z.string()), // франшиза/первоисточник, по которому нарисован тайтл (Naruto для додзинси)
  year: z.number().nullable(), // для карточек — см. releaseDate для полной даты
  releaseDate: z.string().nullable(), // YYYY-MM-DD, если source отдаёт больше, чем один год
  releaseFormats: z.array(z.string()), // формат выпуска оригинала (веб, цветной, ёнкома...)
  addedAt: z.string().nullable(), // YYYY-MM-DDTHH:MM:SSZ — когда тайтл добавили в каталог source
  lastUpdatedAt: z.string().nullable(), // YYYY-MM-DDTHH:MM:SSZ — дата выхода последней главы

  rating: z.number().min(0).max(10).nullable(), // приведено к единой шкале 0..10, округлено до 1 знака после запятой
  votesCount: z.number().nullable(), // число голосов, формирующих rating, если source отдаёт его отдельно
  likes: z.number().nullable(), // неограниченный счётчик лайков/плюсиков, если source не даёт rating
  views: z.number().nullable(), // счётчик просмотров/прочтений, если source его ведёт
  chaptersCount: z.number().nullable(),
  pages: z.number().nullable(), // число страниц тайтла целиком, если source отдаёт его на уровне тайтла

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});

export type Title = z.infer<typeof TitleSchema>;

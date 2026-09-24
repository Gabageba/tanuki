import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Как ветка нумерует главы. PER_VOLUME — номер начинается заново в каждом томе или сезоне
 * («Т. 2 Гл. 5»), и без тома номер неоднозначен; GLOBAL — сквозной через все тома. Номера двух
 * веток сравнимы, только если способ один.
 */
export const CHAPTER_NUMBERING = {
  PER_VOLUME: 'perVolume',
  GLOBAL: 'global',
} as const;
export type ChapterNumbering = EnumLiteralsOf<typeof CHAPTER_NUMBERING>;

export const ChapterNumberingSchema = z.enum(CHAPTER_NUMBERING);

export const ChapterSchema = z.object({
  id: z.string(), // sourceId + opaqueId, see Title.id — use as-is for routes/API calls
  titleId: z.string(),

  number: z.number().nullable(), // 145.5 — дробные бывают
  volume: z.number().nullable(),
  title: z.string().nullable(),

  branch: z.string().nullable(), // "Команда Ронин" — критично для RU
  scanlator: z.string().nullable(),
  uploadedAt: z.string().datetime().nullable(),

  url: z.string(), // внутренний, наружу не отдаётся как есть
});

export type Chapter = z.infer<typeof ChapterSchema>;

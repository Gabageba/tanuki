import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Вид контента источника — он же ключ группировки в SourcesResponse. Значения объявлены здесь
 * один раз и переиспользуются парсерами (SOURCE_CATALOG, RawSourceInfo), поэтому API отдаёт их
 * наружу как есть, без приведения регистра.
 */
export const SOURCE_CONTENT_TYPE = {
  manga: 'manga',
  hentai: 'hentai',
  comics: 'comics',
  other: 'other',
} as const;
export type SourceContentType = EnumLiteralsOf<typeof SOURCE_CONTENT_TYPE>;

export const SourceContentTypeSchema = z.enum(SOURCE_CONTENT_TYPE);

export const SOURCE_STATUS = {
  ok: 'ok',
  degraded: 'degraded',
  down: 'down',
} as const;
export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;

export const SourceStatusSchema = z.enum(SOURCE_STATUS);

export const SourceSchema = z.object({
  id: z.string(), // "DESUME"
  title: z.string(),
  /**
   * Canonical host, no scheme: "web.usagi.one". Whichever mirror the parser currently talks to
   * — sources rotate domains, so use `id` (not this) as the stable key for anything persisted.
   */
  domain: z.string(),
  locale: z.string(),
  contentType: SourceContentTypeSchema,
  status: SourceStatusSchema,
  isAdult: z.boolean(),
});

export type Source = z.infer<typeof SourceSchema>;

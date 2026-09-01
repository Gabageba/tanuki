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

/**
 * Canonical vocabulary of catalog sort orders. Each source only supports a subset — the actual
 * per-source list travels as Source.sortOrders — so this is just the shared key space, not a
 * claim that every source offers every value.
 */
export const SORT_ORDER = {
  UPDATED: 'UPDATED',
  NEWEST: 'NEWEST',
  ADDED: 'ADDED',
  POPULARITY: 'POPULARITY',
  POPULARITY_TODAY: 'POPULARITY_TODAY',
  POPULARITY_WEEK: 'POPULARITY_WEEK',
  POPULARITY_MONTH: 'POPULARITY_MONTH',
  RATING: 'RATING',
  RATING_COUNT: 'RATING_COUNT',
  LIKES: 'LIKES',
  VIEWS: 'VIEWS',
  CHAPTERS: 'CHAPTERS',
  BOOKMARKS: 'BOOKMARKS',
  ALPHABETICAL: 'ALPHABETICAL',
  ALPHABETICAL_RU: 'ALPHABETICAL_RU',
  ALPHABETICAL_EN: 'ALPHABETICAL_EN',
} as const;
export type SortOrder = EnumLiteralsOf<typeof SORT_ORDER>;

export const SortOrderSchema = z.enum(SORT_ORDER);

/**
 * Whether the source's own catalog actually reverses order for the chosen `SortOrder` — most
 * sources bake a fixed direction into each SORT_ORDER value and ignore `ListParams.direction`.
 */
export const SORT_DIRECTION = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;
export type SortDirection = EnumLiteralsOf<typeof SORT_DIRECTION>;

export const SortDirectionSchema = z.enum(SORT_DIRECTION);

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
  /** Source is blocked for RU IPs and needs a VPN to reach. */
  requiresVpn: z.boolean(),
  /** Empty when the source doesn't support choosing an order — ListParams.order is then ignored. */
  sortOrders: z.array(SortOrderSchema),
  /** True when the source actually reverses order for the chosen SortOrder — most sources ignore
   *  ListParams.direction, so their UI hides the direction toggle entirely. */
  supportsDirection: z.boolean(),
});

export type Source = z.infer<typeof SourceSchema>;

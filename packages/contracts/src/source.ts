import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Вид контента источника — он же ключ группировки в SourcesResponse. Значения объявлены здесь
 * один раз и переиспользуются парсерами (SOURCE_CATALOG, RawSourceInfo), поэтому API отдаёт их
 * наружу как есть, без приведения регистра.
 */
export const SOURCE_CONTENT_TYPE = {
  MANGA: 'manga',
  HENTAI: 'hentai',
  COMICS: 'comics',
  OTHER: 'other',
} as const;
export type SourceContentType = EnumLiteralsOf<typeof SOURCE_CONTENT_TYPE>;

export const SourceContentTypeSchema = z.enum(SOURCE_CONTENT_TYPE);

export const SOURCE_STATUS = {
  OK: 'ok',
  DEGRADED: 'degraded',
  DOWN: 'down',
} as const;
export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;

export const SourceStatusSchema = z.enum(SOURCE_STATUS);

/**
 * Почему источник в своём текущем статусе. Статус «липкий» — он держится, пока его не сменит
 * явное событие, — поэтому без причины по нему нельзя понять, кто его выставил: ночной пробник
 * или живой трафик. Ручного сброса нет намеренно (см. SourceStatusService) — статус меняет
 * только реальный сигнал о состоянии источника, а не человек, нажавший кнопку.
 */
export const SOURCE_STATUS_REASON = {
  /** isBroken в SOURCE_CATALOG — жёсткий оверрайд, автоматика такой источник не трогает. */
  BROKEN: 'broken',
  /** Упала ночная проверка полной цепочки getList → getDetails → getPages. */
  PROBE_FAILED: 'probeFailed',
  /** На живом трафике открылся circuit breaker источника. */
  REQUEST_FAILURES: 'requestFailures',
  /** Источник снова отвечает — успешный пробник или серия успешных живых запросов. */
  RECOVERED: 'recovered',
} as const;
export type SourceStatusReason = EnumLiteralsOf<typeof SOURCE_STATUS_REASON>;

export const SourceStatusReasonSchema = z.enum(SOURCE_STATUS_REASON);

export const SOURCE_LOCALE = {
  RU: 'ru',
  EN: 'en',
} as const;
export type SourceLocale = EnumLiteralsOf<typeof SOURCE_LOCALE>;

export const SourceLocaleSchema = z.enum(SOURCE_LOCALE);

/**
 * Canonical vocabulary of catalog sort orders. Each source only supports a subset — the actual
 * per-source list travels as Source.sortOrders — so this is just the shared key space, not a
 * claim that every source offers every value.
 */
export const SORT_ORDER = {
  UPDATED: 'updated',
  RELEASED: 'released',
  ADDED: 'added',
  POPULARITY: 'popularity',
  RATING: 'rating',
  RATING_COUNT: 'ratingCount',
  LIKES: 'likes',
  COMMENTS: 'comments',
  VIEWS: 'views',
  VIEWS_TODAY: 'viewsToday',
  VIEWS_WEEK: 'viewsWeek',
  VIEWS_MONTH: 'viewsMonth',
  CHAPTERS: 'chapters',
  PAGES: 'pages',
  BOOKMARKS: 'bookmarks',
  ALPHABETICAL: 'alphabetical',
  ALPHABETICAL_RU: 'alphabeticalRu',
  ALPHABETICAL_EN: 'alphabeticalEn',
} as const;
export type SortOrder = EnumLiteralsOf<typeof SORT_ORDER>;

export const SortOrderSchema = z.enum(SORT_ORDER);

/**
 * Whether the source's own catalog actually reverses order for the chosen `SortOrder` — most
 * sources bake a fixed direction into each SORT_ORDER value and ignore `ListParams.direction`.
 */
export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortDirection = EnumLiteralsOf<typeof SORT_DIRECTION>;

export const SortDirectionSchema = z.enum(SORT_DIRECTION);

export const SourceSchema = z.object({
  id: z.string(), // "desume"
  title: z.string(),
  /**
   * Canonical host, no scheme: "web.usagi.one". Whichever mirror the parser currently talks to
   * — sources rotate domains, so use `id` (not this) as the stable key for anything persisted.
   */
  domain: z.string(),
  locale: SourceLocaleSchema,
  contentType: SourceContentTypeSchema,
  status: SourceStatusSchema,
  /**
   * Кто выставил текущий статус. null — до источника ещё не доходила ни автоматика, ни человек:
   * он просто считается рабочим по умолчанию.
   */
  statusReason: SourceStatusReasonSchema.nullable(),
  /** Когда статус стал текущим, YYYY-MM-DDTHH:MM:SSZ. */
  statusChangedAt: z.string().nullable(),
  /** Когда по источнику последний раз отработал ночной пробник. */
  checkedAt: z.string().nullable(),
  /** Сколько ночных проверок подряд упало — 0 у рабочего источника. */
  failedProbeStreak: z.number(),
  /** Текст ошибки, из-за которой статус стал текущим, — читается на странице здоровья. */
  lastError: z.string().nullable(),
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

import { z } from 'zod';
import { FilterSelectionSchema, type FilterSelection } from './filter';
import { TitleSchema, type TitleState, type TitleType } from './title';
import type { EnumLiteralsOf } from './utils';

/** Исход опроса одного источника в веере мультипоиска. */
export const SEARCH_GROUP_STATUS = {
  OK: 'ok',
  TIMEOUT: 'timeout',
  ERROR: 'error',
  /** Источник закрыт: у пользователя нет своего аккаунта на нём. */
  LOCKED: 'locked',
  /** Источник в статусе degraded/down: веер его не опрашивает. */
  UNAVAILABLE: 'unavailable',
} as const;
export type SearchGroupStatus = EnumLiteralsOf<typeof SEARCH_GROUP_STATUS>;

export const SearchGroupStatusSchema = z.enum(SEARCH_GROUP_STATUS);

/** Фильтры поиска; значения совпадают с параметрами адреса и `GET /search`. */
export const SEARCH_FILTER_GROUP = {
  SOURCES: 'sources',
  TYPES: 'types',
  STATES: 'states',
} as const;
export type SearchFilterGroup = EnumLiteralsOf<typeof SEARCH_FILTER_GROUP>;

export const SearchFilterGroupSchema = z.enum(SEARCH_FILTER_GROUP);

/** Что искать: пустой или отсутствующий список — без ограничения. */
export type SearchFilterCriteria = {
  types?: TitleType[];
  states?: TitleState[];
};

/** Критерии поиска в виде фильтров источника и те, что источник применить не смог. */
export type ResolvedSearchFilters = {
  filters: FilterSelection[];
  unapplied: SearchFilterGroup[];
};

export const SearchGroupSchema = z.object({
  sourceId: z.string(),
  status: SearchGroupStatusSchema,
  items: z.array(TitleSchema),
  /**
   * Выбранные фильтры (`types`/`states`), которых этот источник не применил: у него нет такого
   * фильтра, нет нужной опции или поиск по названию не сочетается с фильтрами. Выдача по ним не
   * сужена. `sources` сюда не попадает — он отбирает источники, а не тайтлы.
   */
  unappliedFilters: z.array(SearchFilterGroupSchema),
  /** Фильтры источника, с которыми он искал, — «Все результаты» открывает каталог с теми же. */
  filters: z.array(FilterSelectionSchema),
});

export type SearchGroup = z.infer<typeof SearchGroupSchema>;

/**
 * События потока `GET /search` (SSE): сначала `sources` — порядок мест, затем по `group` на
 * источник по мере ответов, в конце `done` — ответили все или вышел общий дедлайн.
 */
export const SEARCH_STREAM_EVENT = {
  SOURCES: 'sources',
  GROUP: 'group',
  DONE: 'done',
} as const;
export type SearchStreamEvent = EnumLiteralsOf<typeof SEARCH_STREAM_EVENT>;

/** Первое событие потока: источники, которые ответят, в порядке пользователя. */
export const SearchSourcesEventSchema = z.object({
  sourceIds: z.array(z.string()),
});

export type SearchSourcesEvent = z.infer<typeof SearchSourcesEventSchema>;

/** Сколько недавних запросов хранится на пользователя: при вставке следующего старейший уходит. */
export const SEARCH_HISTORY_LIMIT = 10;

export const SearchHistoryItemSchema = z.object({
  /** Как набрано последним: пробелы схлопнуты, регистр сохранён. */
  query: z.string(),
  /** YYYY-MM-DDTHH:MM:SSZ */
  searchedAt: z.string(),
});

export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;

/** Свежие сверху. */
export const SearchHistoryResponseSchema = z.object({
  items: z.array(SearchHistoryItemSchema),
});

export type SearchHistoryResponse = z.infer<typeof SearchHistoryResponseSchema>;

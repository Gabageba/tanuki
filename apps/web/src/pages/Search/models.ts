import type useSearchPageQuery from './hooks/useSearchPageQuery';
import type { MissStatus } from '@/entities/source/models';
import type { SEARCH_STREAM_EVENT } from '@tanuki/contracts';
import {
  type FilterSelection,
  type SearchFilterGroup,
  type SearchGroup,
  type SearchSourcesEvent,
  type Source,
  type Title,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';

/** Пустой список в группе — без ограничения. */
export type SearchFilters = {
  sources: string[];
  types: TitleType[];
  states: TitleState[];
};

export type SearchPageQuery = ReturnType<typeof useSearchPageQuery>;

export const EMPTY_SEARCH_FILTERS: SearchFilters = { sources: [], types: [], states: [] };

/** Сколько карточек видно в виде «список» до «Показать ещё». */
export const LIST_PREVIEW_COUNT = 3;

/** Источник, где что-то нашлось. */
export type FoundGroup = {
  source: Source;
  items: Title[];
  /** Выбранные фильтры, которых источник не применил: выдача по ним не сужена. */
  unappliedFilters: SearchFilterGroup[];
  /** Фильтры источника, с которыми он искал: «Все результаты» переносит их в каталог. */
  filters: FilterSelection[];
};

/** Источник из блока «Не ответили». */
export type MissedGroup = {
  source: Source;
  status: MissStatus;
};

/** Выдача поиска по ходу потока. */
export type SearchStreamData = {
  /** Порядок мест — источники, которые ответят, в порядке пользователя. */
  sourceIds: string[];
  /** Ответившие источники — в порядке ответа, не мест. */
  groups: SearchGroup[];
  /** Ответили все или вышел общий дедлайн. */
  isDone: boolean;
};

export const INITIAL_SEARCH_STREAM_DATA: SearchStreamData = {
  sourceIds: [],
  groups: [],
  isDone: false,
};

/** Событие потока `GET /search` с разобранными данными. */
export type SearchStreamMessage =
  | { type: typeof SEARCH_STREAM_EVENT.SOURCES; data: SearchSourcesEvent }
  | { type: typeof SEARCH_STREAM_EVENT.GROUP; data: SearchGroup }
  | { type: typeof SEARCH_STREAM_EVENT.DONE };

/** Место секции источника: `found` — нашлось, null — источник ещё не ответил (скелетон). */
export type SearchPlace = {
  sourceId: string;
  found: FoundGroup | null;
};

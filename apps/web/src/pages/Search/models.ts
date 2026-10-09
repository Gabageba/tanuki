import type { SEARCH_GROUP_STATUS } from '@tanuki/contracts';
import {
  type FilterSelection,
  type SearchFilterGroup,
  type SearchGroupStatus,
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

export const EMPTY_SEARCH_FILTERS: SearchFilters = { sources: [], types: [], states: [] };

/** Сколько карточек видно в виде «список» до «Показать ещё». */
export const LIST_PREVIEW_COUNT = 3;

export type MissStatus = Exclude<SearchGroupStatus, typeof SEARCH_GROUP_STATUS.OK>;

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

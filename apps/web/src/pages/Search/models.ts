import type useSearchPageQuery from './hooks/useSearchPageQuery';
import type { MissStatus } from '@/entities/source/models';
import {
  type FilterSelection,
  type SearchFilterGroup,
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

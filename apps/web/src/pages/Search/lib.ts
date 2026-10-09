import type { TFunction } from 'i18next';
import {
  FILTER_TYPE,
  SEARCH_FILTER_GROUP,
  SEARCH_GROUP_STATUS,
  TITLE_STATE,
  TITLE_TYPE,
  TitleStateSchema,
  TitleTypeSchema,
  type FilterGroup,
  type FilterSelection,
  type SearchFilterGroup,
  type SearchGroup,
  type Source,
  type TitleState,
  type TitleType,
} from '@tanuki/contracts';
import { getLabelByTitleType } from '@/entities/source/lib';
import { getTitleStateLabel } from '@/entities/title/card/lib';
import type { FoundGroup, MissStatus, MissedGroup, SearchFilters } from './models';

/** Причина в блоке «Не ответили». */
export const getMissReasonLabel = (status: MissStatus, t: TFunction) => {
  switch (status) {
    case SEARCH_GROUP_STATUS.TIMEOUT:
      return t('timedOut');
    case SEARCH_GROUP_STATUS.ERROR:
      return t('error');
    case SEARCH_GROUP_STATUS.LOCKED:
      return t('loginRequired');
    case SEARCH_GROUP_STATUS.UNAVAILABLE:
      return t('unavailable');
  }
};

export const getSearchFilterGroupTitle = (group: SearchFilterGroup, t: TFunction) => {
  switch (group) {
    case SEARCH_FILTER_GROUP.SOURCES:
      return t('sources');
    case SEARCH_FILTER_GROUP.TYPES:
      return t('type');
    case SEARCH_FILTER_GROUP.STATES:
      return t('status');
  }
};

const toCheckboxGroup = (
  id: SearchFilterGroup,
  options: { key: string; title: string }[],
  t: TFunction,
): FilterGroup => ({
  id,
  title: getSearchFilterGroupTitle(id, t),
  type: FILTER_TYPE.CHECKBOX,
  options: options.map((option) => ({ ...option, count: null })),
});

/** Три группы в виде фильтров каталога — чтобы поиск рисовал их теми же компонентами. */
export const buildSearchFilterGroups = (sources: Source[], t: TFunction): FilterGroup[] => [
  toCheckboxGroup(
    SEARCH_FILTER_GROUP.SOURCES,
    sources.map(({ id, title }) => ({ key: id, title })),
    t,
  ),
  toCheckboxGroup(
    SEARCH_FILTER_GROUP.TYPES,
    Object.values(TITLE_TYPE).map((type) => ({
      key: type,
      title: getLabelByTitleType(type, t) ?? type,
    })),
    t,
  ),
  toCheckboxGroup(
    SEARCH_FILTER_GROUP.STATES,
    Object.values(TITLE_STATE).map((state) => ({
      key: state,
      title: getTitleStateLabel(state, t),
    })),
    t,
  ),
];

/** Фильтры поиска → выбор фильтров каталога. */
export const toFilterSelection = (filters: SearchFilters): FilterSelection[] =>
  Object.values(SEARCH_FILTER_GROUP).flatMap((groupId) =>
    filters[groupId].map((key) => ({ groupId, key })),
  );

const isAnyString = (value: string): value is string => Boolean(value);
const isTitleType = (value: string): value is TitleType => TitleTypeSchema.safeParse(value).success;
const isTitleState = (value: string): value is TitleState =>
  TitleStateSchema.safeParse(value).success;

/** Ключи группы из выбора; значения, которых нет в схеме (руками в адресе), отбрасываются. */
const getSelectedKeys = <T extends string>(
  selection: FilterSelection[],
  groupId: SearchFilterGroup,
  isValid: (value: string) => value is T,
): T[] =>
  selection.flatMap((item) =>
    'key' in item && item.groupId === groupId && isValid(item.key) ? [item.key] : [],
  );

/** Выбор фильтров каталога → фильтры поиска. */
export const fromFilterSelection = (selection: FilterSelection[]): SearchFilters => ({
  sources: getSelectedKeys(selection, SEARCH_FILTER_GROUP.SOURCES, isAnyString),
  types: getSelectedKeys(selection, SEARCH_FILTER_GROUP.TYPES, isTitleType),
  states: getSelectedKeys(selection, SEARCH_FILTER_GROUP.STATES, isTitleState),
});

export const countSearchFilters = (filters: SearchFilters) =>
  filters.sources.length + filters.types.length + filters.states.length;

/** Ответ поиска по местам: где нашлось (пустые `ok` не рисуются) и кто не ответил. */
export const splitSearchGroups = (groups: SearchGroup[], sources: Source[]) => {
  const found: FoundGroup[] = [];
  const missed: MissedGroup[] = [];
  for (const { sourceId, status, items, unappliedFilters, filters } of groups) {
    const source = sources.find(({ id }) => id === sourceId);
    if (!source) continue;
    if (status !== SEARCH_GROUP_STATUS.OK) missed.push({ source, status });
    else if (items.length) found.push({ source, items, unappliedFilters, filters });
  }
  return { found, missed };
};

/** Якорь секции источника — к нему прокручивает чип «Нашлось на:». */
export const getSourceSectionId = (sourceId: string) => `search-source-${sourceId}`;

/** Список через запятую из адреса; значения не из enum'а (руками в адресе) отбрасываются. */
const readListParam = <T extends string>(
  searchParams: URLSearchParams,
  groupId: SearchFilterGroup,
  isValid: (value: string) => value is T,
): T[] =>
  (searchParams.get(groupId) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(isValid);

export const readSearchFilters = (searchParams: URLSearchParams): SearchFilters => ({
  sources: readListParam(searchParams, SEARCH_FILTER_GROUP.SOURCES, isAnyString),
  types: readListParam(searchParams, SEARCH_FILTER_GROUP.TYPES, isTitleType),
  states: readListParam(searchParams, SEARCH_FILTER_GROUP.STATES, isTitleState),
});

/** Те же параметры, что у `GET /search`: пустая группа в адрес не пишется. */
export const writeSearchFilters = (searchParams: URLSearchParams, filters: SearchFilters) => {
  const next = new URLSearchParams(searchParams);
  for (const groupId of Object.values(SEARCH_FILTER_GROUP)) {
    if (filters[groupId].length) next.set(groupId, filters[groupId].join(','));
    else next.delete(groupId);
  }
  return next;
};

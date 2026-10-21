import type { TFunction } from 'i18next';
import {
  API_ERROR_CODE,
  FILTER_TYPE,
  SEARCH_FILTER_GROUP,
  SEARCH_GROUP_STATUS,
  SEARCH_STREAM_EVENT,
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
import { ApiRequestError, apiStream } from '@/shared/api/client';
import { I18N } from '@/shared/lib/i18n';
import { getLabelByTitleType } from '@/entities/source/lib';
import { getTitleStateLabel } from '@/entities/title/card/lib';
import type {
  FoundGroup,
  MissedGroup,
  SearchFilters,
  SearchPlace,
  SearchStreamData,
  SearchStreamMessage,
} from './models';

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

/** Источник, чей ответ не дошёл из-за обрыва потока: его место уходит в «Не ответили». */
export const createErrorGroupMessage = (sourceId: string): SearchStreamMessage => ({
  type: SEARCH_STREAM_EVENT.GROUP,
  data: {
    sourceId,
    status: SEARCH_GROUP_STATUS.ERROR,
    items: [],
    unappliedFilters: [],
    filters: [],
  },
});

/** Событие, которым Nest закрывает SSE-поток, когда обработчик упал. */
const STREAM_ERROR_EVENT = 'error';

const createStreamError = () =>
  new ApiRequestError(I18N.t('somethingWentWrong'), API_ERROR_CODE.INTERNAL, 500);

/**
 * События потока поиска с разобранными данными; незнакомые пропускаются. Поток, упавший на
 * сервере или оборвавшийся без `done`, — ошибка: иначе недоехавшая выдача сошла бы за полную.
 */
export async function* readSearchStream(path: string, signal?: AbortSignal) {
  for await (const { event, data } of apiStream(path, { signal })) {
    switch (event) {
      case SEARCH_STREAM_EVENT.SOURCES:
      case SEARCH_STREAM_EVENT.GROUP:
        yield { type: event, data: JSON.parse(data) } as SearchStreamMessage;
        break;
      case SEARCH_STREAM_EVENT.DONE:
        yield { type: event } satisfies SearchStreamMessage;
        return;
      case STREAM_ERROR_EVENT:
        throw createStreamError();
    }
  }
  signal?.throwIfAborted();
  throw createStreamError();
}

/** Выдача после очередного события потока. Повторный ответ источника (повтор) заменяет прежний. */
export const applySearchEvent = (
  data: SearchStreamData,
  message: SearchStreamMessage,
): SearchStreamData => {
  switch (message.type) {
    case SEARCH_STREAM_EVENT.SOURCES:
      return { ...data, sourceIds: message.data.sourceIds };
    case SEARCH_STREAM_EVENT.GROUP:
      return {
        ...data,
        groups: [
          ...data.groups.filter(({ sourceId }) => sourceId !== message.data.sourceId),
          message.data,
        ],
      };
    case SEARCH_STREAM_EVENT.DONE:
      return { ...data, isDone: true };
  }
};

/**
 * Выдача по местам источников: место ещё не ответившего — скелетон, нашедшего — его секция,
 * ничего не нашедшего или не ответившего — схлопывается. «Нашлось на:» и «Не ответили» — в порядке
 * мест, а не ответов.
 */
export const getSearchPlaces = ({ sourceIds, groups }: SearchStreamData, sources: Source[]) => {
  const ordered = sourceIds.flatMap((id) => groups.filter(({ sourceId }) => sourceId === id));
  const { found, missed } = splitSearchGroups(ordered, sources);
  const places = sourceIds.flatMap((sourceId): SearchPlace[] => {
    if (!groups.some((group) => group.sourceId === sourceId)) return [{ sourceId, found: null }];
    const group = found.find(({ source }) => source.id === sourceId);
    return group ? [{ sourceId, found: group }] : [];
  });
  return { found, missed, places };
};

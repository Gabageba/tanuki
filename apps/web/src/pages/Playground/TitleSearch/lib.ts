import { TITLE_STATE, TITLE_TYPE, type TitleState, type TitleType } from '@tanuki/contracts';
import { MOCK_SEARCHABLE_SOURCES } from './mocks';
import {
  MOCK_GROUP_STATUS,
  type FoundGroup,
  type MissStatus,
  type MissedGroup,
  type SearchFilterGroup,
  type SearchFilters,
} from './models';

/** Причина в строке «Не ответили» — термины из плана. */
export const getMissReasonLabel = (status: MissStatus) => {
  switch (status) {
    case MOCK_GROUP_STATUS.TIMEOUT:
      return 'не успел';
    case MOCK_GROUP_STATUS.ERROR:
      return 'ошибка';
    case MOCK_GROUP_STATUS.LOCKED:
      return 'нужен вход';
    case MOCK_GROUP_STATUS.UNAVAILABLE:
      return 'недоступен';
  }
};

/** В приложении — `getLabelByTitleType`; здесь литералы, песочница не ходит в i18n. */
export const getTypeLabel = (type: TitleType) => {
  switch (type) {
    case TITLE_TYPE.MANGA:
      return 'Манга';
    case TITLE_TYPE.MANHWA:
      return 'Манхва';
    case TITLE_TYPE.MANHUA:
      return 'Маньхуа';
    case TITLE_TYPE.COMICS:
      return 'Комикс';
    case TITLE_TYPE.OTHER:
      return 'Другое';
  }
};

/** В приложении — `getTitleStateLabel`. */
export const getStateLabel = (state: TitleState) => {
  switch (state) {
    case TITLE_STATE.ONGOING:
      return 'Выходит';
    case TITLE_STATE.FINISHED:
      return 'Завершён';
    case TITLE_STATE.PAUSED:
      return 'Приостановлен';
    case TITLE_STATE.ABANDONED:
      return 'Заброшен';
    case TITLE_STATE.UPCOMING:
      return 'Анонс';
  }
};

export const TYPE_OPTIONS = Object.values(TITLE_TYPE).map((value) => ({
  value,
  label: getTypeLabel(value),
}));

export const STATE_OPTIONS = Object.values(TITLE_STATE).map((value) => ({
  value,
  label: getStateLabel(value),
}));

export const countFilters = (filters: SearchFilters) =>
  filters.sources.length + filters.types.length + filters.states.length;

/** Три группы фильтров поиска в порядке плана: «Источники», «Тип», «Статус». */
export const SEARCH_FILTER_GROUPS: SearchFilterGroup[] = [
  {
    key: 'sources',
    title: 'Источники',
    options: MOCK_SEARCHABLE_SOURCES.map(({ id, title }) => ({ value: id, label: title })),
  },
  { key: 'types', title: 'Тип', options: TYPE_OPTIONS },
  { key: 'states', title: 'Статус', options: STATE_OPTIONS },
];

/** Как сервер по плану: пересечение с выбранными источниками, тип и статус — по первой странице,
 *  тайтл без типа/статуса фильтром не отсекается, пустые группы не рисуются. */
export const applyFilters = (found: FoundGroup[], filters: SearchFilters) =>
  found
    .filter(({ source }) => !filters.sources.length || filters.sources.includes(source.id))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        ({ type, releaseState }) =>
          (!type || !filters.types.length || filters.types.includes(type)) &&
          (!releaseState || !filters.states.length || filters.states.includes(releaseState)),
      ),
    }))
    .filter(({ items }) => items.length > 0);

export const applySourceFilter = (missed: MissedGroup[], filters: SearchFilters) =>
  missed.filter(({ source }) => !filters.sources.length || filters.sources.includes(source.id));

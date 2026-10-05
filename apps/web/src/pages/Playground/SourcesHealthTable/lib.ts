import {
  SORT_DIRECTION,
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  type SortDirection,
  type SourceContentType,
  type SourceStatus,
  type SourceStatusReason,
} from '@tanuki/contracts';
import {
  DRAWER_LAYOUT,
  HEALTH_SORT,
  TABLE_LAYOUT,
  type DrawerLayout,
  type HealthSort,
  type MockSource,
  type SortState,
  type TableLayout,
} from './models';

export const getStatusLabel = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.OK:
      return 'Онлайн';
    case SOURCE_STATUS.DEGRADED:
      return 'Нестабилен';
    case SOURCE_STATUS.DOWN:
      return 'Недоступен';
  }
};

export const getReasonLabel = (reason: SourceStatusReason) => {
  switch (reason) {
    case SOURCE_STATUS_REASON.BROKEN:
      return 'Источник не парсится в принципе';
    case SOURCE_STATUS_REASON.PROBE_FAILED:
      return 'Упала ночная проверка';
    case SOURCE_STATUS_REASON.REQUEST_FAILURES:
      return 'Запросы перестали проходить';
    case SOURCE_STATUS_REASON.RECOVERED:
      return 'Источник снова отвечает';
  }
};

export const getContentTypeLabel = (contentType: SourceContentType) => {
  switch (contentType) {
    case SOURCE_CONTENT_TYPE.MANGA:
      return 'Манга и манхва';
    case SOURCE_CONTENT_TYPE.HENTAI:
      return 'Хентай';
    case SOURCE_CONTENT_TYPE.COMICS:
      return 'Комиксы';
    case SOURCE_CONTENT_TYPE.OTHER:
      return 'Другое';
  }
};

/** «Ночи подряд» склоняются: 1 ночь, 3 ночи, 11 ночей. */
export const formatNightsInRow = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count}\u00a0ночей подряд`;
  if (last === 1) return `${count}\u00a0ночь подряд`;
  if (last >= 2 && last <= 4) return `${count}\u00a0ночи подряд`;
  return `${count}\u00a0ночей подряд`;
};

const getStatusWeight = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.DOWN:
      return 0;
    case SOURCE_STATUS.DEGRADED:
      return 1;
    case SOURCE_STATUS.OK:
      return 2;
  }
};

/** С чего начинает ключ, выбранный впервые: даты и серия — свежие и длинные сверху, статус —
 *  лежащие сверху, название — по алфавиту. */
export const getDefaultDirection = (sort: HealthSort): SortDirection => {
  switch (sort) {
    case HEALTH_SORT.TITLE:
    case HEALTH_SORT.STATUS:
      return SORT_DIRECTION.ASC;
    case HEALTH_SORT.STATUS_CHANGED_AT:
    case HEALTH_SORT.CHECKED_AT:
    case HEALTH_SORT.FAILED_PROBE_STREAK:
      return SORT_DIRECTION.DESC;
  }
};

export const toggleSort = (current: SortState, sort: HealthSort): SortState =>
  current.sort === sort
    ? {
        sort,
        direction:
          current.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
      }
    : { sort, direction: getDefaultDirection(sort) };

const getSortValue = (source: MockSource, sort: HealthSort): string | number | null => {
  switch (sort) {
    case HEALTH_SORT.TITLE:
      return source.title.toLocaleLowerCase('ru');
    case HEALTH_SORT.STATUS:
      return getStatusWeight(source.status);
    case HEALTH_SORT.STATUS_CHANGED_AT:
      return source.statusChangedAt ? Date.parse(source.statusChangedAt) : null;
    case HEALTH_SORT.CHECKED_AT:
      return source.checkedAt ? Date.parse(source.checkedAt) : null;
    case HEALTH_SORT.FAILED_PROBE_STREAK:
      return source.failedProbeStreak;
  }
};

/** Пустые значения — всегда внизу, при равенстве — по названию. */
export const sortSources = (sources: MockSource[], { sort, direction }: SortState) => {
  const sign = direction === SORT_DIRECTION.ASC ? 1 : -1;

  return [...sources].sort((left, right) => {
    const a = getSortValue(left, sort);
    const b = getSortValue(right, sort);
    if (a === null && b !== null) return 1;
    if (b === null && a !== null) return -1;
    if (a !== null && b !== null && a !== b) {
      const compared =
        typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b, 'ru') : +a - +b;
      return compared * sign;
    }
    return left.title.localeCompare(right.title, 'ru');
  });
};

/** Есть ли у раскладки четвёртый столбец — ошибка (T1), полоска ночей (T4) или причина (T5). */
export const hasExtraColumn = (layout: TableLayout) => {
  switch (layout) {
    case TABLE_LAYOUT.ERROR_COLUMN:
    case TABLE_LAYOUT.NIGHTS_STRIP:
    case TABLE_LAYOUT.REASON_COLUMN:
      return true;
    case TABLE_LAYOUT.CURRENT:
    case TABLE_LAYOUT.ERROR_UNDER_STATUS:
    case TABLE_LAYOUT.ERROR_IN_DRAWER:
      return false;
  }
};

export const getExtraColumnTitle = (layout: TableLayout) => {
  switch (layout) {
    case TABLE_LAYOUT.ERROR_COLUMN:
      return 'Ошибка';
    case TABLE_LAYOUT.NIGHTS_STRIP:
      return '30 ночей';
    case TABLE_LAYOUT.REASON_COLUMN:
      return 'Причина';
    case TABLE_LAYOUT.CURRENT:
    case TABLE_LAYOUT.ERROR_UNDER_STATUS:
    case TABLE_LAYOUT.ERROR_IN_DRAWER:
      return null;
  }
};

/** D3 и D4: причина — заголовком над ошибкой, а не полем среди прочих. */
export const isReasonWithError = (layout: DrawerLayout) => {
  switch (layout) {
    case DRAWER_LAYOUT.REASON_WITH_ERROR:
    case DRAWER_LAYOUT.REASON_WITH_ERROR_FIRST:
      return true;
    case DRAWER_LAYOUT.FIELDS:
    case DRAWER_LAYOUT.ERROR_FIRST:
    case DRAWER_LAYOUT.FIELDS_TITLED:
      return false;
  }
};

/** D5: иконка, название и домен — в заголовке `Drawer` вместо «Источник» и блока в теле. */
export const isSourceInTitle = (layout: DrawerLayout) => {
  switch (layout) {
    case DRAWER_LAYOUT.FIELDS_TITLED:
      return true;
    case DRAWER_LAYOUT.FIELDS:
    case DRAWER_LAYOUT.ERROR_FIRST:
    case DRAWER_LAYOUT.REASON_WITH_ERROR:
    case DRAWER_LAYOUT.REASON_WITH_ERROR_FIRST:
      return false;
  }
};

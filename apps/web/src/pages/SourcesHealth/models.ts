import {
  SORT_DIRECTION,
  SOURCE_STATUS,
  type EnumLiteralsOf,
  type Source,
  type SourceContentType,
  type SortDirection,
  type SourceStatus,
} from '@tanuki/contracts';
import type useSourcesHealth from './hooks/useSourcesHealth';

export type SourcesHealthQuery = ReturnType<typeof useSourcesHealth>;

export const HEALTH_REFETCH_INTERVAL_MS = 10_000;

/** Ключи сортировки таблицы. Источников два десятка и все приходят одним `GET /sources`, поэтому
 *  сортирует клиент, и на сервер эти значения не уходят. */
export const HEALTH_SORT = {
  TITLE: 'title',
  STATUS: 'status',
  STATUS_CHANGED_AT: 'statusChangedAt',
  CHECKED_AT: 'checkedAt',
  FAILED_PROBE_STREAK: 'failedProbeStreak',
} as const;
export type HealthSort = EnumLiteralsOf<typeof HEALTH_SORT>;

export type HealthFilterValues = {
  status: SourceStatus[];
  contentType: SourceContentType[];
};

/** Ширины столбцов: таблица раскладывается по ним, а не по содержимому, — иначе при сортировке
 *  и фильтрах столбцы скачут вслед за строками. */
export const HEALTH_COLUMN_WIDTH = {
  SOURCE: '26%',
  STATUS: '20%',
  CHECK: '20%',
  REASON: '34%',
} as const;

/** Направление при первом клике по столбцу: название по алфавиту, статус — лежащие сверху, даты
 *  и серия упавших ночей — свежие и длинные сверху. */
export const getDefaultSortDirection = (sort: HealthSort): SortDirection => {
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

const getSortValue = (source: Source, sort: HealthSort): string | number | null => {
  switch (sort) {
    case HEALTH_SORT.TITLE:
      return source.title;
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
export const sortSources = (sources: Source[], sort: HealthSort, direction: SortDirection) => {
  const sign = direction === SORT_DIRECTION.ASC ? 1 : -1;

  return [...sources].sort((left, right) => {
    const a = getSortValue(left, sort);
    const b = getSortValue(right, sort);
    if (a === null && b !== null) return 1;
    if (b === null && a !== null) return -1;
    if (a !== null && b !== null && a !== b) {
      const compared =
        typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : Number(a) - Number(b);
      return compared * sign;
    }
    return left.title.localeCompare(right.title);
  });
};

/** Ничего не выбрано в фильтре — без ограничения. */
export const filterSources = (sources: Source[], { status, contentType }: HealthFilterValues) =>
  sources.filter(
    (source) =>
      (!status.length || status.includes(source.status)) &&
      (!contentType.length || contentType.includes(source.contentType)),
  );

import type { SEARCH_GROUP_STATUS, SearchGroupStatus } from '@tanuki/contracts';

/** Подписи для источников, не отдавших результат: у `ok` бейджа нет. */
export const GROUP_STATUS_LABEL: Record<
  Exclude<SearchGroupStatus, typeof SEARCH_GROUP_STATUS.ok>,
  string
> = {
  timeout: 'не успел ответить',
  error: 'ошибка',
};

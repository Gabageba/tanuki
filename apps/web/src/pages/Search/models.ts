import type { TFunction } from 'i18next';
import { SEARCH_GROUP_STATUS, type SearchGroupStatus } from '@tanuki/contracts';

/** Подпись для источников, не отдавших результат: у `ok` бейджа нет. */
export const getGroupStatusLabel = (
  status: Exclude<SearchGroupStatus, typeof SEARCH_GROUP_STATUS.OK>,
  t: TFunction,
) => {
  switch (status) {
    case SEARCH_GROUP_STATUS.TIMEOUT:
      return t('timedOut');
    case SEARCH_GROUP_STATUS.ERROR:
      return t('error');
  }
};

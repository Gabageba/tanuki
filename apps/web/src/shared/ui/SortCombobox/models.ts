import type { TFunction } from 'i18next';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';

export type SortOption<T extends string> = {
  value: T;
  label: string;
};

export const getSortDirectionLabel = (direction: SortDirection, t: TFunction): string => {
  switch (direction) {
    case SORT_DIRECTION.DESC:
      return t('descending');
    case SORT_DIRECTION.ASC:
      return t('ascending');
  }
};

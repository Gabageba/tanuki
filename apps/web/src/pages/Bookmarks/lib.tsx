import { CloudSlashIcon, PlugsIcon, QuestionIcon } from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import {
  BOOKMARK_AVAILABILITY,
  BOOKMARK_SORT,
  type BookmarkAvailability,
  type BookmarkSort,
} from '@tanuki/contracts';
import { HIDDEN_COVER_BLUR } from '@/entities/title/models';

export const getBookmarkSortLabel = (sort: BookmarkSort, t: TFunction) => {
  switch (sort) {
    case BOOKMARK_SORT.UPDATED:
      return t('byUpdate');
    case BOOKMARK_SORT.READ:
      return t('byReading');
    case BOOKMARK_SORT.ADDED:
      return t('byDateAdded');
    case BOOKMARK_SORT.ALPHABETICAL:
      return t('alphabetically');
  }
};

/** Почему закладку не открыть; у доступной причины нет. */
export const getBookmarkAvailabilityLabel = (availability: BookmarkAvailability, t: TFunction) => {
  switch (availability) {
    case BOOKMARK_AVAILABILITY.AVAILABLE:
      return null;
    case BOOKMARK_AVAILABILITY.SOURCE_DISABLED:
      return t('sourceDisabled');
    case BOOKMARK_AVAILABILITY.SOURCE_DOWN:
      return t('sourceUnavailable');
    case BOOKMARK_AVAILABILITY.TITLE_MISSING:
      return t('titleNotFoundOnSource');
  }
};

/** Иконка причины на затемнении обложки (U3a). */
export const renderBookmarkAvailabilityIcon = (
  availability: BookmarkAvailability,
  size: number,
) => {
  switch (availability) {
    case BOOKMARK_AVAILABILITY.AVAILABLE:
      return null;
    case BOOKMARK_AVAILABILITY.SOURCE_DISABLED:
      return <PlugsIcon size={size} />;
    case BOOKMARK_AVAILABILITY.SOURCE_DOWN:
      return <CloudSlashIcon size={size} />;
    case BOOKMARK_AVAILABILITY.TITLE_MISSING:
      return <QuestionIcon size={size} />;
  }
};

/** Размытие обложки закладки в px: 18+ прячется сильнее, чем просто недоступная (U3a), а на
 *  маленькой обложке списка размытие недоступной слабее. */
export const getCoverBlur = (isHidden: boolean, isUnavailable: boolean, compact: boolean) => {
  if (isHidden) {
    return HIDDEN_COVER_BLUR;
  }
  if (isUnavailable) {
    return compact ? 3 : 6;
  }
  return 0;
};

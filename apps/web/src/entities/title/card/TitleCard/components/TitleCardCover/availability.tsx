import { CloudSlashIcon, PlugsIcon, QuestionIcon } from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import { BOOKMARK_AVAILABILITY, type BookmarkAvailability } from '@tanuki/contracts';

/** Почему закладку не открыть; у доступной причины нет. */
export const getTitleCardAvailabilityLabel = (availability: BookmarkAvailability, t: TFunction) => {
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
export const getTitleCardAvailabilityIcon = (availability: BookmarkAvailability, size: number) => {
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

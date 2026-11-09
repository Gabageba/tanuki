import type { TFunction } from 'i18next';
import { SORT_ORDER, type SortOrder } from '@tanuki/contracts';

export const getSortOrderLabel = (
  order: SortOrder,
  t: TFunction,
  withPreposition = false,
): string => {
  switch (order) {
    case SORT_ORDER.UPDATED:
      return t('updateDate');
    case SORT_ORDER.RELEASED:
      return t('releaseDate');
    case SORT_ORDER.ADDED:
      return t('addedDate');
    case SORT_ORDER.POPULARITY:
      return t('popularity');
    case SORT_ORDER.VIEWS_TODAY:
      return t('viewsToday');
    case SORT_ORDER.VIEWS_WEEK:
      return t('viewsWeek');
    case SORT_ORDER.VIEWS_MONTH:
      return t('viewsMonth');
    case SORT_ORDER.RATING:
      return t('rating');
    case SORT_ORDER.RATING_COUNT:
      return t('scoresCount');
    case SORT_ORDER.LIKES:
      return withPreposition ? t('byLikes') : t('likes');
    case SORT_ORDER.COMMENTS:
      return t('reviews');
    case SORT_ORDER.VIEWS:
      return withPreposition ? t('byViews') : t('views');
    case SORT_ORDER.CHAPTERS:
      return t('chaptersCount');
    case SORT_ORDER.PAGES:
      return t('pagesCount');
    case SORT_ORDER.BOOKMARKS:
      return t('bookmarks');
    case SORT_ORDER.ALPHABETICAL:
      return t('title');
    case SORT_ORDER.ALPHABETICAL_EN:
      return t('titleLatin');
    case SORT_ORDER.ALPHABETICAL_RU:
      return t('titleCyrillic');
  }
};

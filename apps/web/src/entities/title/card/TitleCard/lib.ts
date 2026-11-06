import { generatePath } from 'react-router';
import { BOOKMARK_AVAILABILITY } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  TITLE_CARD_COMPACT_COVER_WIDTH,
  TITLE_CARD_COVER_WIDTH,
  TITLE_CARD_LIST_SIZE,
  type TitleCardData,
  type TitleCardListSize,
} from './models';

export const getTitleCardPath = (id: string) => generatePath(ROUTE_PATHS.TITLE, { titleId: id });

export const isTitleCardUnavailable = (data: TitleCardData) =>
  data.availability != null && data.availability !== BOOKMARK_AVAILABILITY.AVAILABLE;

export const getTitleCardCoverWidth = (listSize: TitleCardListSize) => {
  switch (listSize) {
    case TITLE_CARD_LIST_SIZE.REGULAR:
      return TITLE_CARD_COVER_WIDTH;
    case TITLE_CARD_LIST_SIZE.COMPACT:
      return TITLE_CARD_COMPACT_COVER_WIDTH;
  }
};

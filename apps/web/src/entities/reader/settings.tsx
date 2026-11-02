import type { TFunction } from 'i18next';
import {
  ArrowsHorizontalIcon,
  ArrowsLeftRightIcon,
  ArrowsOutLineHorizontalIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsVerticalIcon,
  BookOpenIcon,
  BookOpenTextIcon,
} from '@phosphor-icons/react';
import {
  READER_READING_MODE,
  READER_PAGE_FIT,
  READER_DIRECTION,
  READER_PAGE_LAYOUT,
} from '@tanuki/contracts';

export const getReadingModeChoices = (t: TFunction) =>
  Object.values(READER_READING_MODE).map((id) => {
    switch (id) {
      case READER_READING_MODE.VERTICAL:
        return {
          id,
          title: t('vertical'),
          description: t('pagesStackedContinuousScroll'),
          icon: <ArrowsVerticalIcon />,
        };
      case READER_READING_MODE.HORIZONTAL:
        return {
          id,
          title: t('pageByPage'),
          description: t('turningPages'),
          icon: <ArrowsHorizontalIcon />,
        };
    }
  });

export const getPageFitChoices = (t: TFunction) =>
  Object.values(READER_PAGE_FIT).map((id) => {
    switch (id) {
      case READER_PAGE_FIT.FIT_WIDTH:
        return {
          id,
          title: t('byWidth'),
          description: t('pageFillsContainerWidth'),
          icon: <ArrowsOutLineHorizontalIcon />,
        };
      case READER_PAGE_FIT.FIT_HEIGHT:
        return {
          id,
          title: t('whole'),
          description: t('heightFitsScreenFully'),
          icon: <ArrowsOutLineVerticalIcon />,
        };
    }
  });

export const getDirectionChoices = (t: TFunction) =>
  Object.values(READER_DIRECTION).map((id) => {
    switch (id) {
      case READER_DIRECTION.LTR:
        return {
          id,
          title: t('leftToRight'),
          description: t('nextPageOnRight'),
          icon: <ArrowsLeftRightIcon />,
        };
      case READER_DIRECTION.RTL:
        return {
          id,
          title: t('rightToLeft'),
          description: t('nextPageOnLeft'),
          icon: <ArrowsLeftRightIcon />,
        };
    }
  });

export const getPageLayoutChoices = (t: TFunction) =>
  Object.values(READER_PAGE_LAYOUT).map((id) => {
    switch (id) {
      case READER_PAGE_LAYOUT.SINGLE:
        return {
          id,
          title: t('oneAtATime'),
          description: t('onePageOnScreen'),
          icon: <BookOpenTextIcon />,
        };
      case READER_PAGE_LAYOUT.SPREAD:
        return {
          id,
          title: t('spread'),
          description: t('twoPagesOnScreen'),
          icon: <BookOpenIcon />,
        };
    }
  });

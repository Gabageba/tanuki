import {
  ClockCounterClockwiseIcon,
  FireIcon,
  SparkleIcon,
  TrendUpIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import {
  HOME_SECTION_KIND,
  HOME_SECTION_PERIOD,
  HomeSectionPeriodSchema,
  type HomeSectionInfo,
  type HomeSectionKind,
  type HomeSectionPeriod,
} from '@tanuki/contracts';

/** Иконка вкладки по смыслу блока: названия у сайтов свои, вид — общий. */
export const getHomeSectionKindIcon = (kind: HomeSectionKind, size = 16) => {
  switch (kind) {
    case HOME_SECTION_KIND.NEW:
      return <SparkleIcon size={size} />;
    case HOME_SECTION_KIND.TRENDING:
      return <TrendUpIcon size={size} />;
    case HOME_SECTION_KIND.POPULAR:
      return <FireIcon size={size} />;
    case HOME_SECTION_KIND.TOP:
      return <TrophyIcon size={size} />;
    case HOME_SECTION_KIND.UPDATES:
      return <ClockCounterClockwiseIcon size={size} />;
  }
};

export const getHomeSectionPeriodLabel = (period: HomeSectionPeriod, t: TFunction) => {
  switch (period) {
    case HOME_SECTION_PERIOD.DAY:
      return t('pastDay');
    case HOME_SECTION_PERIOD.WEEK:
      return t('pastWeek');
    case HOME_SECTION_PERIOD.MONTH:
      return t('pastMonth');
  }
};

/** Период из адреса; чужое значение — как будто его нет. */
export const parseHomeSectionPeriod = (value: string | null): HomeSectionPeriod | undefined => {
  const parsed = HomeSectionPeriodSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** Открытый блок: из адреса, если он среди показываемых, иначе первый. */
export const resolveSelectionsSection = (
  sections: HomeSectionInfo[],
  requestedId: string | null,
): HomeSectionInfo | undefined => sections.find(({ id }) => id === requestedId) ?? sections[0];

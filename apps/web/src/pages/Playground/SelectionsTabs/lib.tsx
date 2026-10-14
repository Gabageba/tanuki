import {
  ClockCounterClockwiseIcon,
  FireIcon,
  SparkleIcon,
  TrendUpIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import { BLOCK_KIND, READING_PERIOD, type BlockKind, type ReadingPeriod } from './models';

/** Иконка вкладки по смыслу блока: названия у сайтов свои, вид — общий. */
export const getBlockKindIcon = (kind: BlockKind, size = 16) => {
  switch (kind) {
    case BLOCK_KIND.NEW:
      return <SparkleIcon size={size} />;
    case BLOCK_KIND.TRENDING:
      return <TrendUpIcon size={size} />;
    case BLOCK_KIND.POPULAR:
      return <FireIcon size={size} />;
    case BLOCK_KIND.TOP:
      return <TrophyIcon size={size} />;
    case BLOCK_KIND.UPDATES:
      return <ClockCounterClockwiseIcon size={size} />;
  }
};

/** Подпись периода «Сейчас читают». */
export const getReadingPeriodLabel = (period: ReadingPeriod) => {
  switch (period) {
    case READING_PERIOD.DAY:
      return 'За день';
    case READING_PERIOD.WEEK:
      return 'За неделю';
    case READING_PERIOD.MONTH:
      return 'За месяц';
  }
};

export const READING_PERIOD_OPTIONS = Object.values(READING_PERIOD).map((value) => ({
  value,
  label: getReadingPeriodLabel(value),
}));

export const isReadingPeriod = (value: string): value is ReadingPeriod =>
  Object.values<string>(READING_PERIOD).includes(value);

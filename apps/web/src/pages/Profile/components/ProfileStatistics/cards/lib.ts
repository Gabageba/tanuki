import type { EnumLiteralsOf } from '@tanuki/contracts';

export const STATISTIC_PERIOD = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
} as const;
export type StatisticPeriod = EnumLiteralsOf<typeof STATISTIC_PERIOD>;

export type ChaptersReadPoint = {
  date: string;
  count: number;
};

export type GenreStatistic = {
  name: string;
  chapters: number;
};

export type ReadingTimeStatistic = {
  totalMinutes: number;
  averagePerDayMinutes: number;
  weekdaysPerDayMinutes: number;
  weekendsPerDayMinutes: number;
  peakFrom: string;
  peakTo: string;
  peakPercent: number;
  averageSessionMinutes: number;
};

/** «пн» / «25» / «сент» — подпись под столбиком. */
export const formatBarLabel = (isoDate: string, period: StatisticPeriod, locale: string) => {
  const date = new Date(isoDate);

  switch (period) {
    case STATISTIC_PERIOD.WEEK:
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    case STATISTIC_PERIOD.MONTH:
      return String(date.getDate());
    case STATISTIC_PERIOD.YEAR:
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
  }
};

/** «пт, 25 сентября» / «сентябрь 2026 г.» — заголовок подсказки над столбиком. */
export const formatBarDate = (isoDate: string, period: StatisticPeriod, locale: string) => {
  const date = new Date(isoDate);

  switch (period) {
    case STATISTIC_PERIOD.WEEK:
    case STATISTIC_PERIOD.MONTH:
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      }).format(date);
    case STATISTIC_PERIOD.YEAR:
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  }
};

export type SourceStatistic = {
  id: string;
  title: string;
  chapters: number;
};

import type { EnumLiteralsOf } from '@tanuki/contracts';

export const STATISTIC_PERIOD = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
} as const;
export type StatisticPeriod = EnumLiteralsOf<typeof STATISTIC_PERIOD>;

/**
 * Дата столбика — уже календарная дата в поясе пользователя, так что собирается как местная:
 * new Date('YYYY-MM-DD') прочитал бы её как полночь UTC, и западнее Гринвича подпись съехала бы
 * на день назад.
 */
const toLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year!, month! - 1, day);
};

/**
 * «пн» / «25.09» / «сент» — подпись под столбиком. За месяц подписан не каждый день, а ряд
 * переходит через границу месяцев, поэтому одного числа мало — нужен и месяц.
 */
export const formatBarLabel = (isoDate: string, period: StatisticPeriod, locale: string) => {
  const date = toLocalDate(isoDate);

  switch (period) {
    case STATISTIC_PERIOD.WEEK:
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    case STATISTIC_PERIOD.MONTH:
      return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(date);
    case STATISTIC_PERIOD.YEAR:
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
  }
};

/** «пт, 25 сентября» / «сентябрь 2026 г.» — заголовок подсказки над столбиком. */
export const formatBarDate = (isoDate: string, period: StatisticPeriod, locale: string) => {
  const date = toLocalDate(isoDate);

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

/** Час начала окна → «22:00». */
export const formatHour = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;

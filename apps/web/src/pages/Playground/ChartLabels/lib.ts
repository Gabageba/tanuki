import { BAR_GAP, GROUP_GAP, LABEL_ALIGN, WEEK_DAYS } from './models';

const LOCALE = 'ru';

export const toLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year!, month! - 1, day);
};

export const toIsoDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

/** «28.09» */
export const formatDayMonth = (isoDate: string) =>
  new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' }).format(
    toLocalDate(isoDate),
  );

/** «28» */
export const formatDay = (isoDate: string) => String(toLocalDate(isoDate).getDate());

/** «сент» */
export const formatMonth = (isoDate: string) =>
  new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(toLocalDate(isoDate)).replace('.', '');

/** «пн, 28 сентября» */
export const formatWeekdayDate = (isoDate: string) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'long' }).format(
    toLocalDate(isoDate),
  );

/** «22–28.09», а через границу месяцев — «31.08–06.09». */
export const formatRange = (startIsoDate: string, endIsoDate: string) => {
  const isSameMonth = startIsoDate.slice(0, 7) === endIsoDate.slice(0, 7);
  const start = isSameMonth
    ? String(toLocalDate(startIsoDate).getDate()).padStart(2, '0')
    : formatDayMonth(startIsoDate);
  return `${start}–${formatDayMonth(endIsoDate)}`;
};

/** Каждый седьмой от последнего — все подписи попадают на тот же день недели, что и сегодня. */
export const isWeeklyIndex = (index: number, count: number) =>
  (count - 1 - index) % WEEK_DAYS === 0;

/** Подпись у крайних столбиков прижимается к краю графика, чтобы не вылезать за карточку. */
export const getEdgeAlign = (index: number, count: number) => {
  if (index === 0) {
    return LABEL_ALIGN.START;
  }
  if (index === count - 1) {
    return LABEL_ALIGN.END;
  }
  return LABEL_ALIGN.CENTER;
};

/** Недели отсчитываются от последнего дня: последняя всегда полная, первая может быть обрывком. */
const isGroupStart = (index: number, count: number, groupSize: number) =>
  index > 0 && (count - index) % groupSize === 0;

export const getBarMarginLeft = (index: number, count: number, groupSize?: number) =>
  groupSize && isGroupStart(index, count, groupSize) ? GROUP_GAP - BAR_GAP : 0;

export const getWeekGroups = (count: number) => {
  const groups: { start: number; end: number }[] = [];
  for (let end = count - 1; end >= 0; end -= WEEK_DAYS) {
    groups.unshift({ start: Math.max(0, end - WEEK_DAYS + 1), end });
  }
  return groups;
};

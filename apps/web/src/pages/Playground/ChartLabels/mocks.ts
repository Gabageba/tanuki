import { DEMO_DATA, type DemoData, type DemoPoint } from './models';
import { toIsoDate, toLocalDate } from './lib';

const TODAY = '2026-09-28';
const DAYS = 30;
const LIVE_COUNTS = [
  0, 3, 5, 0, 0, 2, 8, 12, 4, 0, 0, 1, 6, 3, 0, 9, 15, 7, 2, 0, 0, 4, 5, 11, 3, 0, 6, 2, 8, 2,
];

const DATES = Array.from({ length: DAYS }, (_, index) => {
  const date = toLocalDate(TODAY);
  date.setDate(date.getDate() - (DAYS - 1 - index));
  return toIsoDate(date);
});

/** «Как у меня» — месяц без чтения и две главы сегодня, как на скриншоте; «Живые» — обычный месяц. */
export const getDemoPoints = (data: DemoData): DemoPoint[] =>
  DATES.map((date, index) => ({
    date,
    count: data === DEMO_DATA.MINE ? (index === DAYS - 1 ? 2 : 0) : (LIVE_COUNTS[index] ?? 0),
  }));

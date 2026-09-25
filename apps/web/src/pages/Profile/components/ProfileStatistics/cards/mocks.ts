import type {
  ChaptersReadPoint,
  GenreStatistic,
  ReadingTimeStatistic,
  SourceStatistic,
  StatisticPeriod,
} from './lib';
import { STATISTIC_PERIOD } from './lib';

const toIsoDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};

const buildDailyMock = (counts: number[]): ChaptersReadPoint[] =>
  counts.map((count, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (counts.length - 1 - index));
    return { date: toIsoDate(date), count };
  });

const buildMonthlyMock = (counts: number[]): ChaptersReadPoint[] =>
  counts.map((count, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (counts.length - 1 - index));
    return { date: toIsoDate(date), count };
  });

// TODO: заменить на данные из API, когда появится эндпоинт статистики.
export const getChaptersReadMock = (period: StatisticPeriod) => {
  switch (period) {
    case STATISTIC_PERIOD.WEEK:
      return buildDailyMock([6, 11, 4, 0, 9, 13, 9]);
    case STATISTIC_PERIOD.MONTH:
      return buildDailyMock([
        5, 8, 0, 3, 12, 7, 6, 9, 4, 0, 2, 10, 14, 8, 6, 5, 7, 11, 3, 0, 9, 6, 11, 4, 0, 9, 13, 9, 7,
        8,
      ]);
    case STATISTIC_PERIOD.YEAR:
      return buildMonthlyMock([182, 240, 205, 310, 268, 190, 145, 233, 301, 276, 223, 214]);
  }
};

export const READING_TIME_MOCK: ReadingTimeStatistic = {
  totalMinutes: 2300,
  averagePerDayMinutes: 77,
  weekdaysPerDayMinutes: 52,
  weekendsPerDayMinutes: 161,
  peakFrom: '22:00',
  peakTo: '00:00',
  peakPercent: 41,
  averageSessionMinutes: 26,
};

export const GENRES_MOCK: GenreStatistic[] = [
  { name: 'Экшен', chapters: 1284 },
  { name: 'Фэнтези', chapters: 962 },
  { name: 'Приключения', chapters: 731 },
  { name: 'Комедия', chapters: 548 },
  { name: 'Драма', chapters: 407 },
  { name: 'Романтика', chapters: 263 },
];

export const SOURCES_MOCK: SourceStatistic[] = [
  { id: 'mangalib', title: 'MangaLib', chapters: 1902 },
  { id: 'remanga', title: 'Remanga', chapters: 1140 },
  { id: 'mangadex', title: 'MangaDex', chapters: 824 },
  { id: 'local', title: 'Локальные загрузки', chapters: 352 },
];

import {
  DOWNLOAD_ERROR,
  DOWNLOAD_STATUS,
  type MockChapter,
  type MockDownloadedTitle,
  type MockQueueItem,
} from './models';

/** Свободно на устройстве по `estimate()`: обычный случай и почти полный диск. */
export const FREE_SPACE_MB = 3300;
export const LOW_FREE_SPACE_MB = 420;

/** Средний объём главы для оценки в модалке. */
export const AVERAGE_CHAPTER_MB = 24;

/** Ветка тайтла для модалки: 120 глав, прочитано до 82-й, 1–12 уже скачаны, 13–15 в очереди. */
export const BRANCH_TOTAL = 120;
export const BRANCH_READ_UP_TO = 82;
export const BRANCH_DOWNLOADED = 12;
export const BRANCH_QUEUED = 3;

/** Строки списка глав: по одной на каждое состояние иконки. */
export const CHAPTER_ROWS: MockChapter[] = [
  {
    id: 'c88',
    number: 88,
    title: 'Возвращение домой',
    date: '2026-10-12',
    status: null,
    pagesDone: 0,
    pagesTotal: 32,
    sizeMb: 0,
  },
  {
    id: 'c87',
    number: 87,
    title: 'Буря над перевалом',
    date: '2026-10-05',
    status: DOWNLOAD_STATUS.QUEUED,
    pagesDone: 0,
    pagesTotal: 30,
    sizeMb: 0,
  },
  {
    id: 'c86',
    number: 86,
    title: 'Тишина',
    date: '2026-09-28',
    status: DOWNLOAD_STATUS.DOWNLOADING,
    pagesDone: 12,
    pagesTotal: 30,
    sizeMb: 9,
  },
  {
    id: 'c85',
    number: 85,
    title: 'Начало пути, которое никто не заметил, пока не стало поздно',
    date: '2026-09-21',
    status: DOWNLOAD_STATUS.DONE,
    pagesDone: 28,
    pagesTotal: 28,
    sizeMb: 24,
  },
  {
    id: 'c84',
    number: 84,
    title: 'Старый мост',
    date: '2026-09-14',
    status: DOWNLOAD_STATUS.FAILED,
    error: DOWNLOAD_ERROR.SOURCE,
    pagesDone: 7,
    pagesTotal: 26,
    sizeMb: 5,
  },
  {
    id: 'c83',
    number: 83,
    title: 'Последний вагон',
    date: '2026-09-07',
    status: DOWNLOAD_STATUS.FAILED,
    error: DOWNLOAD_ERROR.QUOTA,
    pagesDone: 3,
    pagesTotal: 31,
    sizeMb: 2,
  },
];

/** Список глав без сети: скачанные читаются, остальные приглушены. */
export const OFFLINE_CHAPTER_ROWS: MockChapter[] = CHAPTER_ROWS.slice(0, 5).map((chapter) => {
  const isDone = chapter.number === 86 || chapter.number === 85;
  return {
    ...chapter,
    status: isDone ? DOWNLOAD_STATUS.DONE : null,
    error: undefined,
    pagesDone: isDone ? chapter.pagesTotal : 0,
  };
});

const makeDone = (number: number, title: string | null, sizeMb: number): MockChapter => ({
  id: `d${number}-${sizeMb}`,
  number,
  title,
  date: '2026-09-01',
  status: DOWNLOAD_STATUS.DONE,
  pagesDone: 30,
  pagesTotal: 30,
  sizeMb,
});

export const DOWNLOADED_TITLES: MockDownloadedTitle[] = [
  {
    id: 't1',
    name: 'Поднятие уровня в одиночку',
    source: 'Mangalib',
    coverSeed: 'solo',
    chapters: [
      makeDone(1, 'Пробуждение', 31),
      makeDone(2, 'Двойное подземелье', 28),
      makeDone(3, 'Система', 26),
      { ...makeDone(4, 'Испытание', 24), isMissingAtSource: true },
      makeDone(5, null, 22),
    ],
  },
  {
    id: 't2',
    name: 'Я переродился в мире, где все слизни умеют говорить, и стал их королём поневоле',
    source: 'Реманга',
    coverSeed: 'slime',
    chapters: [makeDone(12, 'Совет', 18), makeDone(13, 'Война', 19), makeDone(14, 'Мир', 21)],
  },
  {
    id: 't3',
    name: 'Ванпанчмен',
    source: 'Mangalib',
    coverSeed: 'onepunch',
    chapters: Array.from({ length: 12 }, (_, index) => makeDone(150 + index, null, 27)),
  },
  {
    id: 't4',
    name: 'Берсерк',
    source: 'Desu',
    coverSeed: 'berserk',
    chapters: [makeDone(1, 'Чёрный мечник', 42)],
  },
  {
    id: 't5',
    name: 'Магическая битва',
    source: 'Реманга',
    coverSeed: 'jujutsu',
    chapters: [makeDone(236, null, 25), makeDone(237, null, 23)],
  },
];

export const QUEUE_ITEMS: MockQueueItem[] = [
  {
    id: 'q1',
    titleName: 'Магическая битва',
    chapterLabel: 'Гл.\u00a0238',
    status: DOWNLOAD_STATUS.DOWNLOADING,
    pagesDone: 12,
    pagesTotal: 30,
  },
  {
    id: 'q2',
    titleName: 'Магическая битва',
    chapterLabel: 'Гл.\u00a0239',
    status: DOWNLOAD_STATUS.QUEUED,
    pagesDone: 0,
    pagesTotal: 0,
  },
  {
    id: 'q3',
    titleName: 'Я переродился в мире, где все слизни умеют говорить, и стал их королём поневоле',
    chapterLabel: 'Гл.\u00a015',
    status: DOWNLOAD_STATUS.QUEUED,
    pagesDone: 0,
    pagesTotal: 0,
  },
  {
    id: 'q4',
    titleName: 'Берсерк',
    chapterLabel: 'Гл.\u00a02',
    status: DOWNLOAD_STATUS.QUEUED,
    pagesDone: 0,
    pagesTotal: 0,
  },
  {
    id: 'q5',
    titleName: 'Ванпанчмен',
    chapterLabel: 'Гл.\u00a0162',
    status: DOWNLOAD_STATUS.FAILED,
    error: DOWNLOAD_ERROR.SOURCE,
    pagesDone: 4,
    pagesTotal: 28,
  },
];

/** Скачанные тайтлы источника для офлайн-каталога. */
export const OFFLINE_CATALOG_TITLES = DOWNLOADED_TITLES.filter(
  (title) => title.source === 'Mangalib',
);

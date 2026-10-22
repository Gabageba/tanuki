import {
  CHAPTER_NUMBERING,
  DEFAULT_BRANCH_ID,
  type Chapter,
  type ChaptersResponse,
  type Title,
} from '@tanuki/contracts';
import {
  DEFAULT_CHAPTERS_LIST_KEY,
  DOWNLOAD_ERROR,
  DOWNLOAD_STATUS,
  type DownloadError,
  type DownloadRow,
  type DownloadStatus,
} from '@/entities/download/models';
import { toServerDateTime } from '@/shared/lib/serverDateTime';
import type { OfflineDbSeed } from './models';
import { BRANCHES, CHAPTERS_RESPONSE, TITLE, TITLES } from './titles';

/** Скачанное зрителя для историй: «Загрузки», карточка загрузок и главы тайтла, читалка без сети.
 *  Даты фиксированные, размеры считаются от номера главы — истории не меняются от запуска к запуску. */

type SeedTitle = {
  title: Title;
  chaptersList: ChaptersResponse;
};

type RowSpec = {
  chapter: Chapter;
  status: DownloadStatus;
  error?: DownloadError;
  /** Сколько страниц текущей или упавшей главы уже скачано. */
  pagesDone?: number;
};

const PAGES_TOTAL = 24;
const CREATED_AT = '2026-10-20T18:00:00Z';
const FIRST_DONE_AT = Date.UTC(2026, 9, 21, 9);

const findTitle = (name: string) => TITLES.find((title) => title.name === name) ?? TITLE;

const createChapters = (title: Title, count: number): Chapter[] =>
  Array.from({ length: count }, (_, index) => {
    const number = count - index;
    return {
      id: `${title.id}:ch-${number}`,
      titleId: title.id,
      number,
      volume: Math.ceil(number / 10),
      title: null,
      branch: null,
      scanlator: null,
      uploadedAt: '2026-10-01T12:00:00Z',
      url: '',
    };
  });

const createSeedTitle = (name: string, chaptersCount: number): SeedTitle => {
  const title = findTitle(name);
  return {
    title,
    chaptersList: {
      items: createChapters(title, chaptersCount),
      numbering: CHAPTER_NUMBERING.GLOBAL,
    },
  };
};

const BERSERK: SeedTitle = { title: TITLE, chaptersList: CHAPTERS_RESPONSE };
const VAGABOND = createSeedTitle('Бродяга', 30);
const MONSTER = createSeedTitle('Монстр', 20);

/** Глава, которой на источнике уже нет: её нет в сохранённом списке глав тайтла. */
const MONSTER_EXTRA: Chapter = {
  ...MONSTER.chaptersList.items[0]!,
  id: `${MONSTER.title.id}:ch-extra`,
  number: 4.5,
  title: 'Экстра',
};

const getChapter = ({ chaptersList }: SeedTitle, number: number) =>
  chaptersList.items.find((chapter) => chapter.number === number) ?? chaptersList.items[0]!;

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

const pick = (seedTitle: SeedTitle, numbers: number[], spec: Omit<RowSpec, 'chapter'>) =>
  numbers.map((number): RowSpec => ({ ...spec, chapter: getChapter(seedTitle, number) }));

const getChapterBytes = (chapter: Chapter) =>
  PAGES_TOTAL * (900_000 + (Math.round(chapter.number ?? 0) % 5) * 120_000);

const createRow = ({ chapter, status, error, pagesDone = 0 }: RowSpec, index: number) => {
  const isDone = status === DOWNLOAD_STATUS.DONE;
  return {
    chapterId: chapter.id,
    titleId: chapter.titleId,
    branchId: DEFAULT_BRANCH_ID,
    status,
    error,
    order: index + 1,
    pagesDone: isDone ? PAGES_TOTAL : pagesDone,
    pagesTotal: status === DOWNLOAD_STATUS.QUEUED ? 0 : PAGES_TOTAL,
    bytes: isDone
      ? getChapterBytes(chapter)
      : Math.round((getChapterBytes(chapter) * pagesDone) / PAGES_TOTAL),
    createdAt: CREATED_AT,
    // Чем позже в списке, тем свежее: «Скачанное» показывает свежескачанные тайтлы первыми.
    doneAt: isDone ? toServerDateTime(new Date(FIRST_DONE_AT + index * 60_000)) : undefined,
  } satisfies DownloadRow;
};

const SEED_TITLES = [BERSERK, VAGABOND, MONSTER];

const createSeed = (specs: RowSpec[], isPaused = false): OfflineDbSeed => {
  const titleIds = new Set(specs.map(({ chapter }) => chapter.titleId));
  return {
    downloads: specs.map(createRow),
    chapters: specs.map(({ chapter }) => ({
      chapterId: chapter.id,
      titleId: chapter.titleId,
      chapter,
      numbering: CHAPTER_NUMBERING.GLOBAL,
      pages: [],
      prevChapterId: null,
      nextChapterId: null,
    })),
    titles: SEED_TITLES.filter(({ title }) => titleIds.has(title.id)).map(
      ({ title, chaptersList }) => ({
        titleId: title.id,
        sourceId: title.sourceId,
        details: { title, branches: title.id === TITLE.id ? BRANCHES : [] },
        chapterLists: { [DEFAULT_CHAPTERS_LIST_KEY]: chaptersList },
        coverKey: null,
        createdAt: CREATED_AT,
      }),
    ),
    isPaused,
  };
};

/** Берсерк — свежие главы, их видно сверху списка глав: 29–34 скачаны, 35 качается, дальше
 *  очередь. */
const BERSERK_DONE = pick(BERSERK, range(29, 34), { status: DOWNLOAD_STATUS.DONE });
const BERSERK_DOWNLOADING = pick(BERSERK, [35], {
  status: DOWNLOAD_STATUS.DOWNLOADING,
  pagesDone: 9,
});
const BERSERK_QUEUED = pick(BERSERK, range(36, 39), { status: DOWNLOAD_STATUS.QUEUED });
const BERSERK_FAILED = pick(BERSERK, [40], {
  status: DOWNLOAD_STATUS.FAILED,
  error: DOWNLOAD_ERROR.SOURCE,
});

const OTHER_DONE = [
  ...pick(MONSTER, range(1, 4), { status: DOWNLOAD_STATUS.DONE }),
  { chapter: MONSTER_EXTRA, status: DOWNLOAD_STATUS.DONE },
  ...pick(VAGABOND, range(1, 3), { status: DOWNLOAD_STATUS.DONE }),
];

const MIXED_SPECS = [
  ...OTHER_DONE,
  ...BERSERK_DONE,
  ...BERSERK_DOWNLOADING,
  ...BERSERK_QUEUED,
  ...pick(VAGABOND, [4, 5], { status: DOWNLOAD_STATUS.QUEUED }),
  ...BERSERK_FAILED,
  ...pick(VAGABOND, [6], { status: DOWNLOAD_STATUS.FAILED, error: DOWNLOAD_ERROR.NETWORK }),
];

/** Всё сразу: очередь с текущей, ждущими и упавшими главами и три скачанных тайтла. */
export const DOWNLOADS_SEED = createSeed(MIXED_SPECS);

export const DOWNLOADS_PAUSED_SEED = createSeed(MIXED_SPECS, true);

/** Кончилось место: текущая глава упала с QUOTA, очередь встала на паузу. */
export const DOWNLOADS_QUOTA_SEED = createSeed(
  [
    ...OTHER_DONE,
    ...BERSERK_DONE,
    ...pick(BERSERK, [35], {
      status: DOWNLOAD_STATUS.FAILED,
      error: DOWNLOAD_ERROR.QUOTA,
      pagesDone: 15,
    }),
    ...BERSERK_QUEUED,
  ],
  true,
);

/** Очереди нет — только скачанное. */
export const DOWNLOADED_SEED = createSeed([...OTHER_DONE, ...BERSERK_DONE]);

/** Загрузки одного Берсерка — карточка на странице тайтла в каждом из состояний. */
const BERSERK_ACTIVE = [...BERSERK_DONE, ...BERSERK_DOWNLOADING, ...BERSERK_QUEUED];

export const TITLE_DOWNLOADING_SEED = createSeed(BERSERK_ACTIVE);

export const TITLE_PAUSED_SEED = createSeed(BERSERK_ACTIVE, true);

export const TITLE_FAILED_SEED = createSeed([
  ...BERSERK_DONE,
  ...pick(BERSERK, [35, 36], { status: DOWNLOAD_STATUS.FAILED, error: DOWNLOAD_ERROR.NETWORK }),
]);

export const TITLE_DOWNLOADED_SEED = createSeed(BERSERK_DONE);

/** Строка главы во всех состояниях: скачана, качается, в очереди, упала. */
export const TITLE_CHAPTERS_SEED = createSeed([
  ...BERSERK_DONE,
  ...BERSERK_DOWNLOADING,
  ...BERSERK_QUEUED,
  ...BERSERK_FAILED,
]);

/** Записи Берсерка из `DOWNLOADS_SEED` по id главы — проп `downloads` модалки «Скачать главы». */
export const TITLE_DOWNLOADS = new Map(
  DOWNLOADS_SEED.downloads
    .filter((row) => row.titleId === TITLE.id)
    .map((row) => [row.chapterId, row] as const),
);

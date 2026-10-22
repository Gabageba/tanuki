import {
  CHAPTER_NUMBERING,
  CONTENT_RATING,
  DEFAULT_BRANCH_ID,
  HOME_SECTION_KIND,
  MATCH_CONFIDENCE,
  READING_MARK_CONFIDENCE,
  SEARCH_GROUP_STATUS,
  TITLE_STATE,
  TITLE_TYPE,
  type Branch,
  type LinkedReadingProgress,
  type CatalogResponse,
  type Chapter,
  type ChaptersResponse,
  type ContinueReadingResponse,
  type PagesResponse,
  type SearchHistoryResponse,
  type SearchGroup,
  type SelectionsResponse,
  type Title,
  type TitleDetailsResponse,
  type TitleMatchesResponse,
  type TitleReadingProgressResponse,
} from '@tanuki/contracts';
import { getCoverUrl, getPageUrl, PAGE_SIZE } from './images';

/** Тайтлы историй: каталог, поиск, подборки, страница тайтла и читалка. */

type TitleSeed = {
  slug: string;
  name: string;
  sourceId?: string;
  type?: Title['type'];
  rating?: number | null;
  year?: number;
  chaptersCount?: number;
  tags?: string[];
  contentRating?: Title['contentRating'];
  releaseState?: Title['releaseState'];
};

const TAG_IDS = new Map<string, string>();
const toTag = (title: string) => {
  if (!TAG_IDS.has(title)) TAG_IDS.set(title, `tag-${TAG_IDS.size + 1}`);
  return { id: TAG_IDS.get(title)!, title };
};

export const createTitle = ({
  slug,
  name,
  sourceId = 'readmanga_ru',
  type = TITLE_TYPE.MANGA,
  rating = 8.4,
  year = 2015,
  chaptersCount = 120,
  tags = ['Драма', 'Приключения', 'Фэнтези'],
  contentRating = CONTENT_RATING.SAFE,
  releaseState = TITLE_STATE.ONGOING,
}: TitleSeed): Title => ({
  id: `${sourceId}:${slug}`,
  sourceId,
  slug,
  name,
  originalNames: [slug.replace(/-/g, ' ')],
  altNames: [],
  coverUrl: getCoverUrl(name),
  largeCoverUrl: null,
  description:
    'Мир, где за каждым поворотом ждёт новая опасность. Герой отправляется в путь, чтобы найти ответы на вопросы, которые давно не дают ему покоя, — и узнаёт о себе больше, чем хотел бы. Длинное описание сворачивается до нескольких строк и раскрывается по кнопке.',
  authors: ['Кэнтаро Миура'],
  artists: [],
  publishers: ['Hakusensha'],
  magazines: [],
  translators: ['Команда Ронин'],
  tags: tags.map(toTag),
  releaseState,
  translationState: TITLE_STATE.ONGOING,
  restriction: null,
  contentRating,
  type,
  country: null,
  series: [],
  year,
  releaseDate: null,
  releaseFormats: [],
  addedAt: '2024-05-01T10:00:00Z',
  lastUpdatedAt: '2026-10-14T18:00:00Z',
  rating,
  votesCount: 12840,
  likes: null,
  views: 1_250_000,
  chaptersCount,
  pages: null,
  publicUrl: `https://example.com/${slug}`,
});

export const TITLE = createTitle({
  slug: 'berserk',
  name: 'Берсерк',
  rating: 9.4,
  year: 1989,
  chaptersCount: 374,
  tags: ['Сэйнэн', 'Драма', 'Фэнтези', 'Ужасы', 'Боевик', 'Психология', 'Тёмное фэнтези'],
  contentRating: CONTENT_RATING.SUGGESTIVE,
});

const SEEDS: TitleSeed[] = [
  { slug: 'vagabond', name: 'Бродяга', rating: 9.1, year: 1998, chaptersCount: 327 },
  { slug: 'dorohedoro', name: 'Дорохедоро', rating: 8.7, year: 2000, chaptersCount: 167 },
  { slug: 'monster', name: 'Монстр', rating: 9.0, year: 1994, chaptersCount: 162 },
  { slug: 'pluto', name: 'Плутон', rating: 8.8, year: 2003, chaptersCount: 65 },
  {
    slug: 'solo-leveling',
    name: 'Поднятие уровня в одиночку',
    type: TITLE_TYPE.MANHWA,
    rating: 8.9,
    year: 2018,
    chaptersCount: 200,
    releaseState: TITLE_STATE.FINISHED,
  },
  {
    slug: 'tower-of-god',
    name: 'Башня Бога',
    type: TITLE_TYPE.MANHWA,
    rating: 8.5,
    year: 2010,
    chaptersCount: 640,
  },
  {
    slug: 'the-kings-avatar',
    name: 'Аватар короля',
    type: TITLE_TYPE.MANHUA,
    rating: 8.1,
    year: 2017,
    chaptersCount: 310,
  },
  { slug: 'blame', name: 'BLAME!', rating: null, year: 1997, chaptersCount: 65 },
  { slug: 'mushishi', name: 'Мастер Муси', rating: 8.9, year: 1999, chaptersCount: 50 },
  { slug: 'oyasumi-punpun', name: 'Спокойной ночи, Пунпун', rating: 9.0, year: 2007 },
  { slug: 'chainsaw-man', name: 'Человек-бензопила', rating: 8.6, year: 2018 },
  { slug: 'frieren', name: 'Провожающая в последний путь Фрирен', rating: 9.2, year: 2020 },
  { slug: 'dungeon-meshi', name: 'Подземелье вкусностей', rating: 8.9, year: 2014 },
  { slug: 'blue-period', name: 'Голубой период', rating: 8.3, year: 2017 },
  { slug: 'kingdom', name: 'Царство', rating: 8.8, year: 2006, chaptersCount: 820 },
  {
    slug: 'adult-sample',
    name: 'Тайтл 18+',
    rating: 7.2,
    contentRating: CONTENT_RATING.ADULT,
  },
];

export const TITLES: Title[] = [TITLE, ...SEEDS.map(createTitle)];

export const BRANCHES: Branch[] = [
  {
    id: DEFAULT_BRANCH_ID,
    name: null,
    scanlator: 'Команда Ронин',
    chaptersCount: 374,
    lastUpdatedAt: '2026-10-14T18:00:00Z',
  },
];

export const TITLE_DETAILS_RESPONSE: TitleDetailsResponse = { title: TITLE, branches: BRANCHES };

const CHAPTERS_COUNT = 40;

export const TITLE_CHAPTERS: Chapter[] = Array.from({ length: CHAPTERS_COUNT }, (_, index) => {
  const number = CHAPTERS_COUNT - index;
  return {
    id: `${TITLE.id}:ch-${number}`,
    titleId: TITLE.id,
    number,
    volume: Math.ceil(number / 10),
    title: number % 7 === 0 ? `Затмение, часть ${number / 7}` : null,
    branch: null,
    scanlator: 'Команда Ронин',
    uploadedAt: new Date(Date.UTC(2026, 9, 14) - index * 4 * 86_400_000).toISOString(),
    url: '',
  };
});

export const CHAPTERS_RESPONSE: ChaptersResponse = {
  items: TITLE_CHAPTERS,
  numbering: CHAPTER_NUMBERING.GLOBAL,
};

/** Читаем главу 12: её открывает история читалки. */
export const READING_CHAPTER = TITLE_CHAPTERS[CHAPTERS_COUNT - 12]!;

export const getPagesResponse = (chapterId: string): PagesResponse => {
  const index = TITLE_CHAPTERS.findIndex(({ id }) => id === chapterId);
  return {
    items: Array.from({ length: 8 }, (_, page) => ({
      index: page,
      url: getPageUrl(chapterId, page),
      ...PAGE_SIZE,
    })),
    prevChapterId: TITLE_CHAPTERS[index + 1]?.id ?? null,
    nextChapterId: TITLE_CHAPTERS[index - 1]?.id ?? null,
  };
};

export const READING_PROGRESS_RESPONSE: TitleReadingProgressResponse = {
  own: {
    sourceId: TITLE.sourceId,
    chapterId: READING_CHAPTER.id,
    chapterVolume: READING_CHAPTER.volume,
    chapterNumber: READING_CHAPTER.number,
    chapterTitle: READING_CHAPTER.title,
    branchId: DEFAULT_BRANCH_ID,
    pageIndex: 3,
    updatedAt: '2026-10-14T21:00:00Z',
  },
  linked: [],
};

/** Отметка на копии тайтла на MintManga — дальше своей: «Продолжить с другого источника». */
export const LINKED_PROGRESS: LinkedReadingProgress = {
  sourceId: 'mintmanga',
  chapterId: 'mintmanga:berserk:ch-20',
  chapterVolume: 2,
  chapterNumber: 20,
  chapterTitle: null,
  branchId: DEFAULT_BRANCH_ID,
  pageIndex: 0,
  updatedAt: '2026-10-15T08:00:00Z',
  titleId: 'mintmanga:berserk',
  projections: [
    {
      branchId: DEFAULT_BRANCH_ID,
      chapterId: TITLE_CHAPTERS[CHAPTERS_COUNT - 20]!.id,
      confidence: READING_MARK_CONFIDENCE.EXACT,
    },
  ],
};

export const LINKED_READING_PROGRESS_RESPONSE: TitleReadingProgressResponse = {
  ...READING_PROGRESS_RESPONSE,
  linked: [LINKED_PROGRESS],
};

export const CATALOG_RESPONSE: CatalogResponse = { items: TITLES, page: 1, hasNext: true };

export const TITLE_MATCHES_RESPONSE: TitleMatchesResponse = {
  items: [
    {
      title: createTitle({ slug: 'berserk', name: 'Берсерк', sourceId: 'mintmanga', rating: 9.3 }),
      score: 1,
      confidence: MATCH_CONFIDENCE.CONFIRMED,
      matchedName: 'Берсерк',
      tied: false,
    },
    {
      title: createTitle({ slug: 'berserk', name: 'Берсерк', sourceId: 'mangalib', rating: 9.5 }),
      score: 0.97,
      confidence: MATCH_CONFIDENCE.EXACT,
      matchedName: 'Berserk',
      tied: false,
    },
    {
      title: createTitle({
        slug: 'berserk-prototype',
        name: 'Берсерк: Прототип',
        sourceId: 'seimanga',
        rating: 7.9,
      }),
      score: 0.62,
      confidence: MATCH_CONFIDENCE.LOW,
      matchedName: 'Берсерк',
      tied: false,
    },
  ],
  failures: [{ sourceId: 'allhentai', status: SEARCH_GROUP_STATUS.LOCKED }],
};

export const CONTINUE_READING_RESPONSE: ContinueReadingResponse = {
  items: TITLES.slice(0, 6).map((title, index) => ({
    title: {
      id: title.id,
      sourceId: title.sourceId,
      name: title.name,
      coverUrl: title.coverUrl,
      contentRating: title.contentRating,
      type: title.type,
    },
    chapter: { id: `${title.id}:ch-${12 + index}`, number: 12 + index, volume: null, title: null },
    updatedAt: new Date(Date.UTC(2026, 9, 15) - index * 7 * 3_600_000).toISOString(),
  })),
};

/** Ответы источников на поиск «берсерк» — в порядке мест. */
export const SEARCH_GROUPS: SearchGroup[] = [
  {
    sourceId: 'readmanga_ru',
    status: SEARCH_GROUP_STATUS.OK,
    items: TITLES.slice(0, 5),
    unappliedFilters: [],
    filters: [],
  },
  {
    sourceId: 'mintmanga',
    status: SEARCH_GROUP_STATUS.OK,
    items: TITLES.slice(5, 8).map((title) => ({ ...title, sourceId: 'mintmanga' })),
    unappliedFilters: [],
    filters: [],
  },
  {
    sourceId: 'mangalib',
    status: SEARCH_GROUP_STATUS.TIMEOUT,
    items: [],
    unappliedFilters: [],
    filters: [],
  },
  {
    sourceId: 'allhentai',
    status: SEARCH_GROUP_STATUS.LOCKED,
    items: [],
    unappliedFilters: [],
    filters: [],
  },
];

export const SEARCH_HISTORY_RESPONSE: SearchHistoryResponse = {
  items: ['берсерк', 'Монстр', 'башня бога'].map((query, index) => ({
    query,
    searchedAt: new Date(Date.UTC(2026, 9, 15) - index * 86_400_000).toISOString(),
  })),
};

/** Источники с главной сайта: у них есть подборки. */
export const SELECTIONS_SOURCE_IDS = ['readmanga_ru', 'mintmanga'];

export const HOME_SECTIONS = [
  { id: 'new', title: 'Горячие новинки', kind: HOME_SECTION_KIND.NEW, variants: [] },
  {
    id: 'trending',
    title: 'Сейчас читают',
    kind: HOME_SECTION_KIND.TRENDING,
    variants: [
      { id: 'day', title: 'За день' },
      { id: 'week', title: 'За неделю' },
    ],
  },
  { id: 'top', title: 'Топ', kind: HOME_SECTION_KIND.TOP, variants: [] },
];

export const getSelectionsResponse = (sourceId: string): SelectionsResponse => ({
  sourceId,
  status: SEARCH_GROUP_STATUS.OK,
  sections: HOME_SECTIONS.map((section, index) => ({
    ...section,
    items: TITLES.slice(index * 4, index * 4 + 12),
  })),
});

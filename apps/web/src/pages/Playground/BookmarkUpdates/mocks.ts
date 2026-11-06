import { CONTENT_RATING, TITLE_TYPE } from '@tanuki/contracts';
import { MOCK_BOOKMARKS, MOCK_UNAVAILABLE_BOOKMARKS } from '../Bookmarks/mocks';
import type { MockBookmark } from '../Bookmarks/models';
import { BASIC_EXAMPLES } from '../TitleBookmarkMarkers/mocks';
import type { BookmarkExample } from './models';

// Сценарии прежних макетов закладок; обложки — локальные вымышленные иллюстрации
// из макетов маркеров, чтобы сравнение не зависело от внешнего сервиса картинок.
const toExample = (mock: MockBookmark, index: number): BookmarkExample => {
  const [sourceId, ...otherSources] = mock.sourceIds;
  return {
    typeLabel: mock.typeLabel,
    bookmark: {
      titleId: `${sourceId}:${mock.id}`,
      sourceId: sourceId!,
      name: mock.name,
      coverUrl: BASIC_EXAMPLES[index % BASIC_EXAMPLES.length]!.title.coverUrl!,
      contentRating: mock.isAdult ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE,
      type: TITLE_TYPE.MANGA,
      folderId: mock.folderId,
      progress: mock.progress
        ? {
            chapterNumber: mock.progress.chapter,
            position: mock.progress.chapter,
            total: mock.progress.total,
          }
        : null,
      chaptersCount: mock.chaptersCount,
      newChaptersCount: mock.newChaptersCount,
      latestChapterNumber: mock.progress?.total ?? mock.chaptersCount,
      latestNewAt: mock.newChaptersCount > 0 ? '2026-11-05T08:00:00Z' : null,
      otherSources: otherSources.map((id) => ({ sourceId: id, titleId: `${id}:${mock.id}` })),
      availability: mock.availability,
    },
  };
};

export const BASIC_EXAMPLES_SET: BookmarkExample[] = MOCK_BOOKMARKS.slice(0, 3).map(toExample);

const SHORT_EXAMPLE = BASIC_EXAMPLES_SET[0]!;
const LONG_EXAMPLE = BASIC_EXAMPLES_SET[1]!;

export const NAME_EXAMPLES_SET: BookmarkExample[] = [
  SHORT_EXAMPLE,
  {
    ...SHORT_EXAMPLE,
    bookmark: {
      ...SHORT_EXAMPLE.bookmark,
      titleId: `${SHORT_EXAMPLE.bookmark.titleId}-two-lines`,
      name: 'Город на краю вечности',
      otherSources: [],
    },
  },
  {
    ...LONG_EXAMPLE,
    bookmark: {
      ...LONG_EXAMPLE.bookmark,
      name: 'Становление злодейки: как я случайно получила в мужья северного герцога, которого все боялись',
    },
  },
  {
    ...LONG_EXAMPLE,
    bookmark: {
      ...LONG_EXAMPLE.bookmark,
      titleId: `${LONG_EXAMPLE.bookmark.titleId}-ellipsis`,
      name: 'Я отправился в путешествие к далёким звёздам, чтобы найти затерянный город, но случайно стал хранителем бесконечной библиотеки, в которой каждая прочитанная история меняет судьбу целого мира',
    },
  },
  BASIC_EXAMPLES_SET[2]!,
];

export const EDGE_EXAMPLES_SET: BookmarkExample[] = [
  MOCK_BOOKMARKS[3]!,
  MOCK_BOOKMARKS[4]!,
  ...MOCK_UNAVAILABLE_BOOKMARKS,
].map(toExample);

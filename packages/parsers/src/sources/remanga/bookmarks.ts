import { BUILT_IN_BOOKMARK_FOLDER, type BuiltInBookmarkFolder } from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { ParseError } from '../../errors';
import type { RawBookmarkFolder, RawTitle } from '../../types';
import { SOURCE_ID } from '../catalog';
import { fetchRemangaSessionJson } from './auth';
import type {
  MangaJson,
  RemangaBookmarkFolderJson,
  RemangaBookmarkJson,
  RemangaPageJson,
  RemangaViewer,
} from './models';

const MAX_PAGES = 1000;

/** Тип папки, а не её id: пользовательские папки имеют собственные id. */
const getBuiltInFolder = (type: number): BuiltInBookmarkFolder | null => {
  switch (type) {
    case 1:
      return BUILT_IN_BOOKMARK_FOLDER.READING;
    case 2:
      return BUILT_IN_BOOKMARK_FOLDER.PLANNED;
    case 3:
      return BUILT_IN_BOOKMARK_FOLDER.COMPLETED;
    case 4:
      return BUILT_IN_BOOKMARK_FOLDER.DROPPED;
    case 5:
      return BUILT_IN_BOOKMARK_FOLDER.ON_HOLD;
    case 7:
      return BUILT_IN_BOOKMARK_FOLDER.FAVORITE;
    // 6 — «Не интересно», 8 — пользовательская; неизвестные типы тоже сохраняем как свои.
    default:
      return null;
  }
};

export const fetchRemangaBookmarks = async (
  ctx: ParserContext,
  parseManga: (title: MangaJson) => RawTitle,
): Promise<RawBookmarkFolder[]> => {
  const viewer = await fetchRemangaSessionJson<RemangaViewer>(ctx, '/api/v2/users/current/');
  if (!Number.isSafeInteger(viewer.id) || viewer.id <= 0) {
    throw new ParseError('ReManga current user is missing', SOURCE_ID.REMANGA);
  }
  const fetchPages = async <T>(path: string): Promise<T[]> => {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const separator = path.includes('?') ? '&' : '?';
      const json = await fetchRemangaSessionJson<RemangaPageJson<T>>(
        ctx,
        `${path}${separator}page=${page}`,
      );
      if (!Array.isArray(json.results))
        throw new ParseError('ReManga bookmarks page is missing results', SOURCE_ID.REMANGA);
      items.push(...json.results);
      if (!json.next) return items;
      if (json.results.length === 0) break;
    }
    throw new ParseError('ReManga bookmarks pagination did not finish', SOURCE_ID.REMANGA);
  };
  const base = `/api/v2/users/${viewer.id}`;
  const folders = await fetchPages<RemangaBookmarkFolderJson>(`${base}/user_bookmarks/`);
  const result: RawBookmarkFolder[] = [];
  for (const folder of folders) {
    if (
      !Number.isSafeInteger(folder.id) ||
      folder.id <= 0 ||
      typeof folder.name !== 'string' ||
      !Number.isInteger(folder.type)
    ) {
      throw new ParseError('ReManga bookmark folder is malformed', SOURCE_ID.REMANGA);
    }
    const items = await fetchPages<RemangaBookmarkJson>(
      `${base}/bookmarks/?type=${encodeURIComponent(folder.id)}`,
    );
    result.push({
      id: String(folder.id),
      name: folder.name,
      builtIn: getBuiltInFolder(folder.type),
      items: items.flatMap((item) => {
        // Удалённый тайтл не имеет страницы, на которую можно перенести закладку.
        if (item.title === null) return [];
        if (!item.title?.dir || !item.title.main_name)
          throw new ParseError('ReManga bookmark title is missing', SOURCE_ID.REMANGA);
        const title = parseManga({ ...item.title, cover: item.title.cover ?? {} });
        return [
          {
            id: title.id,
            url: title.url,
            title: title.title,
            coverUrl: title.coverUrl,
            contentRating: title.contentRating,
            type: title.type ?? null,
            // read_progress — количество прочитанных глав, не номер последней главы.
            lastChapterNumber: null,
            lastChapterVolume: null,
          },
        ];
      }),
    });
  }
  return result;
};

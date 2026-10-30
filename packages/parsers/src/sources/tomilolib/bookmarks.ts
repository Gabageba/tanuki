import {
  BUILT_IN_BOOKMARK_FOLDER,
  type BuiltInBookmarkFolder,
  type EnumLiteralsOf,
} from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { NotFoundError, ParseError } from '../../errors';
import type { RawBookmarkFolder, RawTitle } from '../../types';
import { SOURCE_ID } from '../catalog';
import { fetchTomiloLibSessionJson } from './auth';
import type {
  MangaJson,
  TomiloLibBookmarkGroup,
  TomiloLibHistoryPage,
  TomiloLibProfile,
  TomiloLibResponse,
} from './models';

// Значения внешнего API; пользовательские категории имеют вид group:<id>.
const CATEGORY = {
  READING: 'reading',
  PLANNED: 'planned',
  COMPLETED: 'completed',
  FAVORITES: 'favorites',
  DROPPED: 'dropped',
} as const;
type Category = EnumLiteralsOf<typeof CATEGORY>;
const MAX_HISTORY_PAGES = 1000;
const HISTORY_PAGE_SIZE = 100;

const getBuiltIn = (category: Category): BuiltInBookmarkFolder => {
  switch (category) {
    case CATEGORY.READING:
      return BUILT_IN_BOOKMARK_FOLDER.READING;
    case CATEGORY.PLANNED:
      return BUILT_IN_BOOKMARK_FOLDER.PLANNED;
    case CATEGORY.COMPLETED:
      return BUILT_IN_BOOKMARK_FOLDER.COMPLETED;
    case CATEGORY.FAVORITES:
      return BUILT_IN_BOOKMARK_FOLDER.FAVORITE;
    case CATEGORY.DROPPED:
      return BUILT_IN_BOOKMARK_FOLDER.DROPPED;
  }
};

const getCategoryName = (category: Category) => {
  switch (category) {
    case CATEGORY.READING:
      return 'Читаю';
    case CATEGORY.PLANNED:
      return 'В планах';
    case CATEGORY.COMPLETED:
      return 'Прочитано';
    case CATEGORY.FAVORITES:
      return 'Избранное';
    case CATEGORY.DROPPED:
      return 'Брошено';
  }
};

const malformed = (part: string) =>
  new ParseError(`TomiloLib ${part} is malformed`, SOURCE_ID.TOMILOLIB);

/** В отличие от counts, полная история содержит номера глав, в том числе дробные и нулевые. */
const fetchProgress = async (ctx: ParserContext) => {
  const result = new Map<string, number>();
  for (let page = 1; page <= MAX_HISTORY_PAGES; page += 1) {
    const json = await fetchTomiloLibSessionJson<TomiloLibHistoryPage>(
      ctx,
      `/users/profile/history?page=${page}&limit=${HISTORY_PAGE_SIZE}&light=false`,
    );
    const items = Array.isArray(json.data) ? json.data : json.data?.items;
    const pagination = Array.isArray(json.data) ? json.pagination : json.data?.pagination;
    if (!Array.isArray(items)) throw malformed('reading history');
    for (const item of items) {
      const id = typeof item.titleId === 'string' ? item.titleId : item.titleId?._id;
      if (!id || (item.chapters !== undefined && !Array.isArray(item.chapters)))
        throw malformed('reading history entry');
      const chapters = item.chapters?.length
        ? item.chapters
        : item.lastChapter
          ? [item.lastChapter]
          : [];
      for (const chapter of chapters) {
        const number = chapter.chapterNumber;
        if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) continue;
        result.set(id, Math.max(result.get(id) ?? 0, number));
      }
    }
    if (pagination?.pages !== undefined) {
      if (!Number.isSafeInteger(pagination.pages) || pagination.pages < 0)
        throw malformed('history pagination');
      if (page >= pagination.pages) return result;
      if (items.length === 0) throw malformed('history pagination');
    } else if (items.length < HISTORY_PAGE_SIZE) return result;
  }
  throw malformed('history pagination');
};

/** Профиль отдаёт все закладки без страниц — тот же список, который использует сайт. */
export const fetchTomiloLibBookmarks = async (
  ctx: ParserContext,
  parseManga: (info: MangaJson | null) => RawTitle | null,
): Promise<RawBookmarkFolder[]> => {
  const profile = await fetchTomiloLibSessionJson<TomiloLibResponse<TomiloLibProfile>>(
    ctx,
    '/users/profile',
  );
  const bookmarks = profile.data?.bookmarks;
  if (!Array.isArray(bookmarks)) throw malformed('bookmarks');
  const groups = await fetchTomiloLibSessionJson<TomiloLibResponse<TomiloLibBookmarkGroup[]>>(
    ctx,
    '/users/profile/bookmark-groups',
  );
  if (!Array.isArray(groups.data)) throw malformed('bookmark groups');
  const folders = new Map<string, RawBookmarkFolder>();
  for (const category of Object.values(CATEGORY)) {
    folders.set(category, {
      id: category,
      name: getCategoryName(category),
      builtIn: getBuiltIn(category),
      items: [],
    });
  }
  for (const group of groups.data) {
    if (
      typeof group.id !== 'string' ||
      !group.id.startsWith('group:') ||
      !group.id.slice(6).trim() ||
      typeof group.name !== 'string' ||
      !group.name.trim() ||
      folders.has(group.id)
    )
      throw malformed('bookmark group');
    folders.set(group.id, { id: group.id, name: group.name, builtIn: null, items: [] });
  }
  const progress = bookmarks.length > 0 ? await fetchProgress(ctx) : new Map<string, number>();
  const titles = new Map<string, RawTitle | null>();
  for (const raw of bookmarks) {
    const bookmark = typeof raw === 'string' ? { titleId: raw } : raw;
    // Удалённые тайтлы сайт возвращает с titleId: null.
    if (bookmark.titleId === null) continue;
    const populated = typeof bookmark.titleId === 'object' ? bookmark.titleId : null;
    const id = populated?._id ?? bookmark.titleId;
    if (typeof id !== 'string' || !id) throw malformed('bookmark title id');
    const folder = folders.get(bookmark.category ?? CATEGORY.READING);
    if (!folder) throw malformed('bookmark category');
    let title = titles.get(id);
    if (title === undefined) {
      title = parseManga({ ...bookmark.title, ...populated, _id: id });
      if (!title) {
        // Старые закладки могут хранить лишь id; сайт тоже догружает такие карточки по id.
        try {
          const json = await fetchTomiloLibSessionJson<TomiloLibResponse<MangaJson>>(
            ctx,
            `/titles/${encodeURIComponent(id)}?populateChapters=false`,
          );
          title = parseManga(json.data ?? null);
          if (!title) throw malformed('bookmark title');
        } catch (error) {
          if (!(error instanceof NotFoundError)) throw error;
          title = null;
        }
      }
      titles.set(id, title);
    }
    if (!title || folder.items.some((item) => item.id === title.id)) continue;
    folder.items.push({
      id: title.id,
      url: title.url,
      title: title.title,
      coverUrl: title.coverUrl,
      contentRating: title.contentRating,
      type: title.type ?? null,
      lastChapterNumber: progress.get(id) ?? null,
      lastChapterVolume: null,
    });
  }
  return [...folders.values()];
};

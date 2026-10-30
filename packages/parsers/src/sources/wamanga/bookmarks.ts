import { BUILT_IN_BOOKMARK_FOLDER, type BuiltInBookmarkFolder } from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { ParseError } from '../../errors';
import type { RawBookmarkFolder, RawTitle } from '../../types';
import { SOURCE_ID } from '../catalog';
import { fetchWaMangaSessionJson } from './auth';
import type { MangaJson, WaMangaLibraryEntry } from './models';

// External API values; favorite is an independent flag rather than a reading status.
const STATUS = {
  READING: 'reading',
  COMPLETED: 'completed',
  PLANNED: 'planned',
  ON_HOLD: 'on_hold',
  DROPPED: 'dropped',
  FAVORITE: 'favorite',
} as const;
const PAGE_SIZE = 50;
const MAX_OFFSET = 100000;

const malformed = (part: string) =>
  new ParseError(`WaManga ${part} is malformed`, SOURCE_ID.WAMANGA);

export const fetchWaMangaBookmarks = async (
  ctx: ParserContext,
  parseManga: (manga: MangaJson) => RawTitle,
): Promise<RawBookmarkFolder[]> => {
  const folders = new Map<string, RawBookmarkFolder>();
  const addFolder = (id: string, name: string, builtIn: BuiltInBookmarkFolder) =>
    folders.set(id, { id, name, builtIn, items: [] });
  // Tanuki has one folder per title: favorite wins when all folders are selected.
  addFolder(STATUS.FAVORITE, 'Избранное', BUILT_IN_BOOKMARK_FOLDER.FAVORITE);
  addFolder(STATUS.READING, 'Читаю', BUILT_IN_BOOKMARK_FOLDER.READING);
  addFolder(STATUS.COMPLETED, 'Прочитано', BUILT_IN_BOOKMARK_FOLDER.COMPLETED);
  addFolder(STATUS.PLANNED, 'В планах', BUILT_IN_BOOKMARK_FOLDER.PLANNED);
  addFolder(STATUS.ON_HOLD, 'Отложено', BUILT_IN_BOOKMARK_FOLDER.ON_HOLD);
  addFolder(STATUS.DROPPED, 'Брошено', BUILT_IN_BOOKMARK_FOLDER.DROPPED);
  const seen = new Set<string>();
  for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_SIZE) {
    const entries = await fetchWaMangaSessionJson<WaMangaLibraryEntry[]>(
      ctx,
      `/user/library?limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (!Array.isArray(entries) || entries.length > PAGE_SIZE) throw malformed('library page');
    let added = 0;
    for (const entry of entries) {
      if (
        !entry ||
        typeof entry.mangaId !== 'string' ||
        !entry.mangaId ||
        typeof entry.slug !== 'string' ||
        !entry.slug ||
        typeof entry.title !== 'string' ||
        !entry.title ||
        typeof entry.type !== 'string' ||
        !entry.type ||
        typeof entry.favorite !== 'boolean' ||
        (entry.status !== null && (entry.status === STATUS.FAVORITE || !folders.has(entry.status)))
      )
        throw malformed('library entry');
      if (seen.has(entry.mangaId)) continue;
      seen.add(entry.mangaId);
      added += 1;
      // History-only rows have neither a bookmark status nor a favorite flag.
      if (!entry.status && !entry.favorite) continue;
      const title = parseManga({
        id: entry.mangaId,
        slug: entry.slug,
        title: entry.title,
        type: entry.type.toLowerCase(),
        coverUrl: entry.coverUrl ?? undefined,
      });
      const number =
        typeof entry.chapterPosition === 'number' ||
        (typeof entry.chapterPosition === 'string' && entry.chapterPosition.trim() !== '')
          ? Number(entry.chapterPosition)
          : NaN;
      const bookmark = {
        id: title.id,
        url: title.url,
        title: title.title,
        coverUrl: title.coverUrl,
        // Library rows omit the age rating; don't invent one from the title type.
        contentRating: null,
        type: title.type ?? null,
        lastChapterNumber: Number.isFinite(number) && number >= 0 ? number : null,
        lastChapterVolume: null,
      };
      if (entry.favorite) folders.get(STATUS.FAVORITE)!.items.push(bookmark);
      if (entry.status) folders.get(entry.status)!.items.push(bookmark);
    }
    if (entries.length < PAGE_SIZE) return [...folders.values()];
    if (added === 0) break;
  }
  throw malformed('library pagination');
};

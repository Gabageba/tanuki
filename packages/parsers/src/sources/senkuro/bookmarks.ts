import {
  BUILT_IN_BOOKMARK_FOLDER,
  catalogEntryFor,
  type BuiltInBookmarkFolder,
} from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { ParseError, SourceAuthRequiredError, SourceTokenExpiredError } from '../../errors';
import type { RawBookmarkFolder, RawTitle } from '../../types';
import { fetchSenkuroAccountData, fetchSenkuroViewer, getSenkuroSessionToken } from './auth';
import type { SenkuroConfig } from './config';
import type { SenkuroBookmarkConnection, SenkuroBookmarkManga, SenkuroCollection } from './models';

const MAX_PAGES = 1000;
// Типы аргументов, статусы и поля — из публичного клиента сайта; схема проверена 2026-10-30.
const BOOKMARKS_QUERY = `query ImportBookmarks($userId: ID!, $after: String) {
  userBookmarks(userId: $userId, subjectType: MANGA, first: 20, after: $after,
    orderBy: { field: UPDATED_AT, direction: DESC }) {
    edges { node {
      collectionId number
      entity { __typename ... on Manga {
        id slug applicationId titles { lang content } type rating cover { original { url } }
      } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}`;

const getBuiltInFolder = (collection: SenkuroCollection): BuiltInBookmarkFolder | null => {
  if (!collection.system) return null;
  switch (collection.status) {
    case 'WATCHING':
      return BUILT_IN_BOOKMARK_FOLDER.READING;
    case 'PLANNING':
      return BUILT_IN_BOOKMARK_FOLDER.PLANNED;
    case 'COMPLETED':
      return BUILT_IN_BOOKMARK_FOLDER.COMPLETED;
    case 'FAVORITED':
      return BUILT_IN_BOOKMARK_FOLDER.FAVORITE;
    case 'PAUSED':
      return BUILT_IN_BOOKMARK_FOLDER.ON_HOLD;
    case 'DROPPED':
      return BUILT_IN_BOOKMARK_FOLDER.DROPPED;
    default:
      return null;
  }
};

export const fetchSenkuroBookmarks = async (
  cfg: SenkuroConfig,
  ctx: ParserContext,
  parseManga: (manga: SenkuroBookmarkManga) => RawTitle | null,
): Promise<RawBookmarkFolder[]> => {
  const account = currentSourceAccount(catalogEntryFor(cfg.id).authFamily);
  if (!account?.jar)
    throw new SourceAuthRequiredError('Bookmarks require the user’s own account', cfg.id);
  const token = await getSenkuroSessionToken(account.jar);
  if (!token) throw new SourceTokenExpiredError('Senkuro session is missing', cfg.id);
  const viewer = await fetchSenkuroViewer(ctx.http, cfg, ctx.domain, token);
  const folders = new Map<string, RawBookmarkFolder>();
  for (const collection of viewer.userBookmarkCollections) {
    if (collection.entityType !== 'MANGA') continue;
    if (
      !collection.id ||
      typeof collection.name !== 'string' ||
      typeof collection.system !== 'boolean'
    )
      throw new ParseError('Senkuro bookmark collection is malformed', cfg.id);
    folders.set(collection.id, {
      id: collection.id,
      name: collection.preference?.name || collection.name,
      builtIn: getBuiltInFolder(collection),
      items: [],
    });
  }
  const cursors = new Set<string>();
  let after: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { userBookmarks: connection }: { userBookmarks: SenkuroBookmarkConnection } =
      await fetchSenkuroAccountData<{ userBookmarks: SenkuroBookmarkConnection }>(
        ctx.http,
        cfg,
        ctx.domain,
        token,
        BOOKMARKS_QUERY,
        { userId: viewer.user!.id, after },
      );
    if (!Array.isArray(connection?.edges) || typeof connection.pageInfo?.hasNextPage !== 'boolean')
      throw new ParseError('Senkuro bookmarks page is malformed', cfg.id);
    for (const { node } of connection.edges) {
      // Удалённые тайтлы не имеют страницы; закладки соседнего каталога не переносятся.
      const manga = node?.entity;
      if (manga === null) continue;
      if (!manga || manga.__typename !== 'Manga' || !manga.applicationId)
        throw new ParseError('Senkuro bookmark manga is malformed', cfg.id);
      if (manga.applicationId !== cfg.appId) continue;
      const folder = folders.get(node.collectionId);
      const title = parseManga(manga);
      if (!folder || !title)
        throw new ParseError('Senkuro bookmark title or collection is missing', cfg.id);
      const number = node.number === null || node.number === '' ? NaN : Number(node.number);
      folder.items.push({
        id: title.id,
        url: title.url,
        title: title.title,
        coverUrl: title.coverUrl,
        contentRating: title.contentRating,
        type: title.type ?? null,
        lastChapterNumber: Number.isFinite(number) && number >= 0 ? number : null,
        lastChapterVolume: null,
      });
    }
    if (!connection.pageInfo.hasNextPage) return [...folders.values()];
    const cursor: string | null = connection.pageInfo.endCursor;
    if (!cursor || cursors.has(cursor) || connection.edges.length === 0) break;
    cursors.add(cursor);
    after = cursor;
  }
  throw new ParseError('Senkuro bookmarks pagination did not finish', cfg.id);
};

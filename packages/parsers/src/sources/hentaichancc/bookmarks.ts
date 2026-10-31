import { BUILT_IN_BOOKMARK_FOLDER, CONTENT_RATING, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import type { ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { generateUid } from '../../core/uid';
import { ParseError, SourceAuthRequiredError } from '../../errors';
import type { RawBookmark, RawBookmarkFolder } from '../../types';
import { SOURCE_ID } from '../catalog';
import { checkHentaichanCcResponse, fetchHentaichanCcViewer } from './auth';
import {
  API_BASE,
  PROFILE_ACTION,
  URL_DELIMITER,
  type ProfilePage,
  type ProfileManga,
} from './models';

const MAX_PAGES = 5000;
const PROGRESS_CONCURRENCY = 4;

const malformed = (part: string) =>
  new ParseError(`HentaiChan ${part} is malformed`, SOURCE_ID.HENTAICHAN_CC);

/** Action hashes change on deploy; read them from the current profile bundle. */
const discoverActions = async (ctx: ParserContext, profileUrl: string) => {
  const doc = await ctx.http.getHtml(profileUrl);
  const paths = [
    ...new Set(
      doc
        .$('script[src]')
        .toArray()
        .map((el) => doc.$(el).attr('src')!),
    ),
  ].reverse();
  const actions = new Map<string, string>();
  for (const path of paths) {
    // Never send the account session to a script on another origin.
    if (!path.startsWith('/_next/static/chunks/') || path.startsWith('//')) continue;
    const script = await ctx.http.get(new URL(path, profileUrl).href);
    for (const match of script
      .text()
      .matchAll(
        /createServerReference\)\("([a-f\d]+)",[^)]*,"(getProfileLikes|getProfileHistory)"\)/g,
      )) {
      actions.set(match[2]!, match[1]!);
    }
    if (actions.size === Object.keys(PROFILE_ACTION).length) return actions;
  }
  throw malformed('profile actions');
};

/** Only decode the action result referenced by root.a, not the page's RSC tree. */
const parseActionPage = (text: string): ProfilePage => {
  try {
    const rows = new Map(
      text.split('\n').flatMap((line) => {
        const match = /^([a-f\d]+):(.+)$/.exec(line);
        return match ? [[match[1]!, match[2]!] as const] : [];
      }),
    );
    const root = JSON.parse(rows.get('0') ?? 'null') as { a?: unknown } | null;
    const ref = typeof root?.a === 'string' ? /^\$@([a-f\d]+)$/.exec(root.a)?.[1] : null;
    const result = (ref ? JSON.parse(rows.get(ref) ?? 'null') : root?.a) as {
      data?: ProfilePage;
    } | null;
    const data = result?.data;
    if (!data || !Number.isSafeInteger(data.count) || data.count < 0 || !Array.isArray(data.manga))
      throw malformed('profile page');
    for (const item of data.manga) {
      if (
        !item ||
        !Number.isSafeInteger(item.id) ||
        item.id <= 0 ||
        typeof item.name !== 'string' ||
        !item.name.trim() ||
        typeof item.slug !== 'string' ||
        !item.slug.trim() ||
        (item.src !== null && typeof item.src !== 'string')
      )
        throw malformed('profile manga');
    }
    return data;
  } catch {
    throw malformed('profile action result');
  }
};

const fetchProfileItems = async (
  ctx: ParserContext,
  profileUrl: string,
  userId: string,
  action: string,
) => {
  const items = new Map<number, ProfileManga>();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await ctx.http.request({
      method: 'POST',
      url: profileUrl,
      headers: {
        'Next-Action': action,
        Accept: 'text/x-component',
        'Content-Type': 'text/plain;charset=UTF-8',
        Origin: `https://${ctx.domain}`,
      },
      body: JSON.stringify([{ userId, page, order: 'desc', search: '' }]),
    });
    checkHentaichanCcResponse(res);
    let data: ProfilePage;
    try {
      data = parseActionPage(res.text());
    } catch (error) {
      // Safe-action errors can be HTTP 200. Distinguish an expired session from a changed API.
      await fetchHentaichanCcViewer(ctx.http, ctx.domain);
      throw error;
    }
    const before = items.size;
    for (const item of data.manga) items.set(item.id, item);
    if (items.size >= data.count) return [...items.values()];
    if (items.size === before) throw malformed('profile pagination');
  }
  throw malformed('profile pagination');
};

const fetchProgress = async (
  ctx: ParserContext,
  id: number,
): Promise<Pick<RawBookmark, 'lastChapterNumber' | 'lastChapterVolume' | 'lastPageIndex'>> => {
  const res = await ctx.http.request({ url: `https://${ctx.domain}/api/manga/${id}/engagement` });
  checkHentaichanCcResponse(res);
  const result = res.json<{ success: boolean; data?: { historyPage: number } }>();
  const page = result?.data?.historyPage;
  if (
    result?.success !== true ||
    typeof page !== 'number' ||
    !Number.isSafeInteger(page) ||
    page < 0
  )
    throw malformed('reading progress');
  if (page === 0) return { lastChapterNumber: null, lastChapterVolume: null, lastPageIndex: null };
  // The site's page is one-based across the release. Tanuki needs a chapter plus zero-based index.
  // IDs in the pages relation are enough to count them; no images are downloaded.
  const query = new URLSearchParams({
    'filter[manga][_eq]': String(id),
    sort: 'id',
    fields: 'id,pages',
    limit: '-1',
  });
  const chapters = await ctx.http.getJson<{ data: { id: number; pages: number[] }[] }>(
    `${API_BASE}/items/chapters?${query}`,
  );
  if (
    !Array.isArray(chapters?.data) ||
    chapters.data.length === 0 ||
    chapters.data.some((chapter) => !chapter || !Array.isArray(chapter.pages))
  )
    throw malformed('progress chapters');
  let remaining = page - 1;
  let last: Pick<RawBookmark, 'lastChapterNumber' | 'lastChapterVolume' | 'lastPageIndex'> | null =
    null;
  for (const [index, chapter] of chapters.data.entries()) {
    if (chapter.pages.length === 0) continue;
    last = {
      lastChapterNumber: index + 1,
      lastChapterVolume: null,
      lastPageIndex: Math.min(remaining, chapter.pages.length - 1),
    };
    if (remaining < chapter.pages.length) return last;
    remaining -= chapter.pages.length;
  }
  if (!last) throw malformed('progress pages');
  return last;
};

export const fetchHentaichanCcBookmarks = async (
  ctx: ParserContext,
): Promise<RawBookmarkFolder[]> => {
  if (!currentSourceAccount(SOURCE_AUTH_FAMILY.HENTAICHAN_CC)?.jar)
    throw new SourceAuthRequiredError(
      'Import requires the user’s own account',
      SOURCE_ID.HENTAICHAN_CC,
    );
  const viewer = await fetchHentaichanCcViewer(ctx.http, ctx.domain);
  const profileUrl = `https://${ctx.domain}/profile/${viewer.id}`;
  const actions = await discoverActions(ctx, profileUrl);
  const likes = await fetchProfileItems(
    ctx,
    profileUrl,
    viewer.id,
    actions.get(PROFILE_ACTION.LIKES)!,
  );
  const history = await fetchProfileItems(
    ctx,
    profileUrl,
    viewer.id,
    actions.get(PROFILE_ACTION.HISTORY)!,
  );
  const unique = [...new Map([...likes, ...history].map((item) => [item.id, item])).values()];
  const bookmarks = new Map<number, RawBookmark>();
  for (let offset = 0; offset < unique.length; offset += PROGRESS_CONCURRENCY) {
    await Promise.all(
      unique.slice(offset, offset + PROGRESS_CONCURRENCY).map(async (item) => {
        const cover = item.src ? new URL(item.src, profileUrl) : null;
        if (cover && cover.protocol !== 'https:') throw malformed('cover URL');
        bookmarks.set(item.id, {
          id: generateUid(SOURCE_ID.HENTAICHAN_CC, item.id),
          url: [item.id, item.slug].join(URL_DELIMITER),
          title: item.name,
          coverUrl: cover?.href ?? null,
          contentRating: CONTENT_RATING.ADULT,
          type: null,
          ...(await fetchProgress(ctx, item.id)),
        });
      }),
    );
  }
  // The first selected folder wins for titles present in both lists.
  return [
    {
      id: 'likes',
      name: 'Лайки',
      builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
      items: likes.map(({ id }) => bookmarks.get(id)!),
    },
    {
      id: 'history',
      name: 'История',
      builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
      items: history.map(({ id }) => bookmarks.get(id)!),
    },
  ];
};

import { BUILT_IN_BOOKMARK_FOLDER, CONTENT_RATING, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { absUrl, textOrNull } from '../../core/html/selectors';
import { toAbsoluteUrl, toRelativeUrl } from '../../core/html/urls';
import type { ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { generateUid } from '../../core/uid';
import { ParseError, SourceAuthRequiredError, SourceTokenExpiredError } from '../../errors';
import type { RawBookmarkFolder } from '../../types';
import { assertMultpornSession, loginMultporn } from './auth';
import type { MultpornConfig } from './config';

const MAX_PAGES = 5000;

export const fetchMultpornBookmarks = async (
  cfg: MultpornConfig,
  ctx: ParserContext,
): Promise<RawBookmarkFolder[]> => {
  const account = currentSourceAccount(SOURCE_AUTH_FAMILY.MULTPORN);
  if (!account?.jar)
    throw new SourceAuthRequiredError('Import requires the user’s own account', cfg.id);
  const folder: RawBookmarkFolder = {
    id: 'bookmarks',
    name: 'Bookmarks',
    builtIn: BUILT_IN_BOOKMARK_FOLDER.READING,
    items: [],
  };
  const seen = new Set<string>();
  let didRelogin = false;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('/bookmarks', `https://${ctx.domain}`);
    url.search = new URLSearchParams({
      type: cfg.bookmarksType,
      sort_by: 'timestamp',
      sort_order: 'ASC',
      page: String(page),
    }).toString();
    let doc = await ctx.http.getHtml(url.href);
    try {
      assertMultpornSession(doc, cfg.id);
    } catch (error) {
      if (!(error instanceof SourceTokenExpiredError) || !account.credentials || didRelogin)
        throw error;
      didRelogin = true;
      if (!(await loginMultporn(ctx.http, ctx.domain, account.credentials))) throw error;
      account.onChange?.();
      doc = await ctx.http.getHtml(url.href);
      assertMultpornSession(doc, cfg.id);
    }
    const view = doc.$('#block-system-main .view-bookmarks').first();
    if (!view.length) throw new ParseError('MultPorn bookmarks view is missing', cfg.id);
    const rows = view.find(
      '.view-content .views-row, .view-content .views-view-grid td, .view-content .views-table > tbody > tr',
    );
    if (view.find('.view-content').children().length > 0 && rows.length === 0)
      throw new ParseError('MultPorn bookmark rows are malformed', cfg.id);
    let added = 0;
    for (const el of rows.toArray()) {
      const row = doc.$(el);
      // Bookmarks use a custom Views table field, unlike the catalog's title field.
      const link = row.find('.views-field-nothing > a[href], .views-field-title a[href]').first();
      const href = link.attr('href');
      if (!href) throw new ParseError('MultPorn bookmark title is missing', cfg.id);
      const relativeUrl = toRelativeUrl(toAbsoluteUrl(href, ctx.domain), ctx.domain);
      // Count all content types so a mixed page cannot hide later matching bookmarks.
      if (seen.has(relativeUrl)) continue;
      seen.add(relativeUrl);
      added += 1;
      if (!relativeUrl.startsWith(cfg.pathPrefix)) continue;
      const title = textOrNull(link);
      if (!title) throw new ParseError('MultPorn bookmark title is empty', cfg.id);
      folder.items.push({
        id: generateUid(cfg.id, relativeUrl),
        url: relativeUrl,
        title,
        coverUrl: absUrl(row.find('img[src]').first(), 'src', doc.baseUrl),
        contentRating: CONTENT_RATING.ADULT,
        type: null,
        lastChapterNumber: null,
        lastChapterVolume: null,
        lastPageIndex: null,
      });
    }
    const hasNext = view.find('.pager-next a').length > 0;
    if (added === 0 && (rows.length > 0 || hasNext))
      throw new ParseError('MultPorn bookmarks pagination stalled', cfg.id);
    if (!hasNext) return [folder];
  }
  throw new ParseError('MultPorn bookmarks pagination exceeded its limit', cfg.id);
};

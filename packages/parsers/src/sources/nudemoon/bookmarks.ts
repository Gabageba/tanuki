import { BUILT_IN_BOOKMARK_FOLDER, CONTENT_RATING, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { parseHtml, type Doc } from '../../core/html/dom';
import { absUrl, textOrNull } from '../../core/html/selectors';
import { toRelativeUrl } from '../../core/html/urls';
import { classifyResponse } from '../../core/http/classify';
import type { ParserContext } from '../../core/parser';
import { currentSourceAccount } from '../../core/source-accounts';
import { generateUid } from '../../core/uid';
import { ParseError, SourceAuthRequiredError, SourceTokenExpiredError } from '../../errors';
import type { RawBookmarkFolder } from '../../types';
import { loginNudeMoon } from './auth';
import { splitNudeMoonTitle } from './lib';
import { SOURCE_ID } from '../catalog';

export const fetchNudeMoonBookmarks = async (ctx: ParserContext): Promise<RawBookmarkFolder[]> => {
  const account = currentSourceAccount(SOURCE_AUTH_FAMILY.NUDEMOON);
  if (!account?.jar)
    throw new SourceAuthRequiredError('Import requires the user’s own account', SOURCE_ID.NUDEMOON);
  const jar = account.jar;
  const url = `https://${ctx.domain}/favorites?table`;
  const fetchPage = async (canRelogin: boolean): Promise<Doc> => {
    const res = await ctx.http.request({ url });
    const html = res.text();
    const error = classifyResponse(SOURCE_ID.NUDEMOON, res.status, res.url, res.headers, html);
    if (error) throw error;
    const doc = parseHtml(html, res.url);
    // A guest is redirected to /index.php; an invalid cookie can also yield the login form.
    if (new URL(res.url).pathname !== '/favorites' || doc.$('form[name="loginform"]').length) {
      if (
        canRelogin &&
        account.credentials &&
        (await loginNudeMoon(ctx.http, jar, ctx.domain, account.credentials, ctx.logger))
      ) {
        account.onChange?.();
        return fetchPage(false);
      }
      throw new SourceTokenExpiredError('Nude-Moon session expired', SOURCE_ID.NUDEMOON);
    }
    return doc;
  };
  const doc = await fetchPage(true);
  const table = doc.$('.main-body table.textbox').first();
  if (!doc.$('h1').text().includes('Избранное') || !table.length)
    throw new ParseError('Nude-Moon favorites table is missing', SOURCE_ID.NUDEMOON);
  const folder: RawBookmarkFolder = {
    id: 'favorites',
    name: 'Избранное',
    builtIn: BUILT_IN_BOOKMARK_FOLDER.FAVORITE,
    items: [],
  };
  const seen = new Set<string>();
  const cells = table.children('tbody').children('tr').children('td');
  if (!cells.length && (table.text().trim() || table.find('a, img').length))
    throw new ParseError('Nude-Moon favorites grid is malformed', SOURCE_ID.NUDEMOON);
  // The table is a grid: one bookmark per cell, two links to that title in each cell.
  for (const el of cells.toArray()) {
    const cell = doc.$(el);
    const link = cell
      .find('a[href]')
      .filter((_, a) => /^\/\d+-/.test(doc.$(a).attr('href') ?? ''))
      .first();
    const href = link.attr('href');
    const rawTitle = link.attr('title')?.trim() || textOrNull(link);
    if (!href || !rawTitle)
      throw new ParseError('Nude-Moon favorite title is missing', SOURCE_ID.NUDEMOON);
    const relativeUrl = toRelativeUrl(href, ctx.domain);
    if (seen.has(relativeUrl)) continue;
    seen.add(relativeUrl);
    folder.items.push({
      id: generateUid(SOURCE_ID.NUDEMOON, relativeUrl),
      url: relativeUrl,
      title: splitNudeMoonTitle(rawTitle).title,
      coverUrl:
        absUrl(cell.find('img').first(), 'data-src', doc.baseUrl) ??
        absUrl(cell.find('img').first(), 'src', doc.baseUrl),
      contentRating: CONTENT_RATING.ADULT,
      type: null,
      lastChapterNumber: null,
      lastChapterVolume: null,
      lastPageIndex: null,
    });
  }
  return [folder];
};

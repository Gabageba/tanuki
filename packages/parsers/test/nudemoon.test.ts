import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { CONTENT_RATING, TITLE_TYPE, SORT_ORDER, SOURCE_AUTH_FAMILY } from '@tanuki/contracts';
import { createNudeMoonParser } from '../src/sources/nudemoon';
import { SOURCE_ID } from '../src/sources/catalog';
import type { ParserContext } from '../src/core/parser';
import { runWithSourceAccounts } from '../src/core/source-accounts';
import { SourceAuthRequiredError } from '../src/errors';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'nude-moon.example';

const LIST_HTML = `<!doctype html><html><body>
  <table class="news_pic2">
    <tr><td>
      <a href="/12345-some-title" title="Альт Тайтл / Основной Тайтл"></a>
      <img class="news_pic2" data-src="/covers/12345.jpg" />
      <a href="/mangaka/someone">Some Author</a>
      <div class="tag-links"><a href="/tag/action">боевик</a></div>
      <div class="description">Краткое описание.</div>
      <div class='example_text'><!--<img src='/pda/images/ico/time.png'>5/09/2026 -->
      <img src='/pda/images/ico/view.png'><b>5 тыс. <img src='/pda/images/like.png'>66  <img src='/pda/images/ico/comments.png'>7</b></div>
      <span class='small2' style='float:right'>9 января 2024</span>
      <div class='tbl2'>Страниц: 16<!-- <span class='small2'>()</span>--></div>
    </td></tr>
  </table>
</body></html>`;

/** Mirrors the real mobile-skin details page: the title sits in `<h1>`, while every `<a title>`
 *  in the meta block is an author/series/translator link ("Показать всю мангу от ..."). */
const DETAILS_HTML = `<!doctype html><html><body>
  <table><tr><td class='bg_style1'><h1>Альт Тайтл / Основной Тайтл</h1></td></tr></table>
  <table class="news_pic2">
    <tr>
      <td><font class='small2'>Автор: </font><a title='Показать всю мангу от Some Author' href='/mangaka/someone'>Some Author</a><br>
        <font class='small2'> Серия: </font><a title='Показать всю мангу по Naruto' href='/seria/naruto'>Naruto</a><br>
        <font class='small2'> Перевод: </font><a title='Показать все переводы TeamA' href='/perevod/team-a'>TeamA</a>, <a title='Показать все переводы TeamB' href='/perevod/team-b'>TeamB</a></td>
      <td><img src="/pda/images/ico/time.png"><span class="small2">9 января 2024</span><br>
        <img src="/pda/images/ico/view.png"><span class="small2">1.7 млн.</span></td>
    </tr>
    <tr><td><div class='tag-links'><a href="/tag/комикс">комикс</a> <a href="/tag/action">боевик</a></div></td></tr>
    <tr><td><div class="description">Полное описание.</div></td></tr>
  </table>
  <img data-src="/covers/12345-full.jpg" />
  <img data-src="/covers/12345-p2.jpg" />
  <img data-src="/covers/12345-p3.jpg" />
  <span id="ilike"><span class="button"><font class="small2">поставить лайк!</font> 66</span></span>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <img data-src="/pages/001.jpg" />
  <img data-src="/pages/002.jpg" />
</body></html>`;

const TAGS_FORM_HTML = `<!doctype html><html><body>
  <form name="multitags" action="" method="POST">
    <table><tbody>
      <tr><td><label class="checkbox"><input type='checkbox' name='tags1' value='боевик '><div class="checkbox__text">боевик</div></label></td></tr>
      <tr><td><label class="checkbox"><input type='checkbox' name='tags2' value='ahegao '><div class="checkbox__text">ahegao</div></label></td></tr>
    </tbody></table>
  </form>
</body></html>`;

/** Same broken-but-consistent "browse by X" row markup on `/mangaka/`, `/seria/`, `/group/` and
 *  `/perevod/` — a bare `<tr>` per entity, name+count `<td>`s, no closing `</tr>` before the next
 *  one starts (mirrors the real site, see nudemoon fetchFilters comment). */
const entityListHtml = (
  routePath: string,
  entries: [slug: string, name: string, count: number][],
): string => {
  const rows = entries
    .map(
      ([slug, name, count], i) =>
        `<tr><td>${i + 1}. <b><a href='/${routePath}/${slug}' title ='${name}'>${name}</a></td>
        <td>${count}</b></td>`,
    )
    .join('');
  return `<!doctype html><html><body><table><tbody>${rows}</tbody></table></body></html>`;
};

const SERIES_HTML = entityListHtml('seria', [['naruto', 'Naruto', 257]]);
const AUTHOR_LIST_HTML = entityListHtml('mangaka', [['asanagi', 'Asanagi', 40]]);
const GROUP_HTML = entityListHtml('group', [['behind_moon', 'Behind Moon', 55]]);
const TRANSLATOR_HTML = entityListHtml('perevod', [['team-a', 'TeamA', 12]]);

const makeContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
    // FakeHttpClient ignores cookies/jars entirely, so reusing the same instance here still
    // exercises getDetails/getPages against the fixtures registered on `http`.
    createHttpClient: () => http,
  };
};

const setUpFixtures = (): FakeHttpClient => {
  const http = new FakeHttpClient();
  http.register((url) => url.endsWith('/read/12345/1'), { status: 200, body: PAGES_HTML });
  http.register((url) => url.endsWith('/read/12345'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.endsWith('/tags/'), { status: 200, body: TAGS_FORM_HTML });
  http.register((url) => url.includes('/tags/') && url.includes('rowstart='), {
    status: 200,
    body: LIST_HTML,
  });
  http.register((url) => url.includes('/seria/?letter=all'), { status: 200, body: SERIES_HTML });
  http.register((url) => url.includes('/mangaka/?letter=all'), {
    status: 200,
    body: AUTHOR_LIST_HTML,
  });
  http.register((url) => url.endsWith('/perevod/'), { status: 200, body: TRANSLATOR_HTML });
  http.register((url) => url.includes('/group/?letter=A'), { status: 200, body: GROUP_HTML });
  http.register((url) => url.includes('/group/?letter='), {
    status: 200,
    body: '<!doctype html><html><body></body></html>',
  });
  http.register((url) => url.includes('/all_manga'), { status: 200, body: LIST_HTML });
  http.register((url) => /\/(mangaka|seria|group|perevod)\/[^/?]+&/.test(url), {
    status: 200,
    body: LIST_HTML,
  });
  return http;
};

describe('Nude-Moon parser conformance', () => {
  const http = setUpFixtures();
  const parser = createNudeMoonParser(makeContext(http));

  it('getList: chapters null, rating -1, adult content rating, url relative', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe(SOURCE_ID.NUDEMOON);
    expect(item!.rating).toBe(-1);
    expect(item!.contentRating).toBe(CONTENT_RATING.ADULT);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    // format is "AltTitle / MainTitle"
    expect(item!.title).toBe('Основной Тайтл');
    expect(item!.altTitles).toEqual(['Альт Тайтл']);
    expect(item!.authors).toEqual(['Some Author']);
    expect(item!.tags.map((t) => t.title)).toEqual(['Боевик']);
    expect(item!.coverUrl).toBe(`https://${DOMAIN}/covers/12345.jpg`);
    expect(item!.pages).toBe(16);
    expect(item!.likes).toBe(66);
    expect(item!.year).toBe(2024);
    expect(item!.addedAt).toBe(new Date(2024, 0, 9).getTime());
    expect(item!.views).toBe(5_000);
    expect(item!.type).toBe(TITLE_TYPE.MANGA);
  });

  it('getDetails: single synthetic chapter with valid sentinels', async () => {
    const manga = await parser.getDetails('/read/12345');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(1);
    const chapter = manga.chapters![0]!;
    expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    expect(chapter.scanlator).toBe('TeamA, TeamB');
    expect(chapter.uploadDate).toBe(new Date(2024, 0, 9).getTime());
    expect(manga.title).toBe('Основной Тайтл');
    expect(manga.altTitles).toEqual(['Альт Тайтл']);
    expect(manga.authors).toEqual(['Some Author']);
    expect(manga.series).toEqual(['Naruto']);
    expect(manga.translators).toEqual(['TeamA', 'TeamB']);
    expect(manga.views).toBe(1_700_000);
    expect(manga.addedAt).toBe(new Date(2024, 0, 9).getTime());
    expect(manga.type).toBe(TITLE_TYPE.COMICS);
    expect(manga.description).toBe('Полное описание.');
    expect(manga.largeCoverUrl).toBe(`https://${DOMAIN}/covers/12345-full.jpg`);
    expect(manga.pages).toBe(3);
    expect(manga.likes).toBe(66);
    expect(manga.year).toBe(2024);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/read/12345');
    const pages = await parser.getPages(`${manga.chapters![0]!.url}/1`);
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/pages/001.jpg`);
  });

  it("getList: a viewer without a Nude-Moon account can't search — no request reaches the site", async () => {
    const before = http.requests.length;
    await expect(
      runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.NUDEMOON]: {} }, () =>
        parser.getList({ offset: 0, limit: 20, query: 'test' }),
      ),
    ).rejects.toBeInstanceOf(SourceAuthRequiredError);
    expect(http.requests).toHaveLength(before);
  });

  it('getList: searches through the account session, the query encoded in cp1251', async () => {
    const searchHttp = setUpFixtures();
    searchHttp.register((url) => url.includes('/search?'), { status: 200, body: LIST_HTML });
    const searchParser = createNudeMoonParser(makeContext(searchHttp));
    const jar = new CookieJar();
    await jar.setCookie('fusion_user=1.abc', `https://${DOMAIN}/`);

    const items = await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.NUDEMOON]: { jar } }, () =>
      searchParser.getList({ offset: 0, limit: 10, query: 'девушка' }),
    );

    expect(items.map((item) => item.url)).toEqual(['/12345-some-title']);
    expect(searchHttp.requests.at(-1)!.url).toBe(
      `https://${DOMAIN}/search?stext=%E4%E5%E2%F3%F8%EA%E0&rowstart=0`,
    );
  });

  it('getList: search starts from the rowstart window holding the offset', async () => {
    const searchHttp = setUpFixtures();
    searchHttp.register((url) => url.includes('/search?'), { status: 200, body: LIST_HTML });
    const searchParser = createNudeMoonParser(makeContext(searchHttp));
    const jar = new CookieJar();
    await jar.setCookie('fusion_user=1.abc', `https://${DOMAIN}/`);

    await runWithSourceAccounts({ [SOURCE_AUTH_FAMILY.NUDEMOON]: { jar } }, () =>
      searchParser.getList({ offset: 30, limit: 30, query: 'naruto' }),
    );

    expect(searchHttp.requests.at(-1)!.url).toBe(
      `https://${DOMAIN}/search?stext=naruto&rowstart=30`,
    );
  });

  it('getFilters: reads tags, series, authors, groups and translators off their own routes', async () => {
    const groups = await parser.getFilters!();
    const byId = Object.fromEntries(groups.map((g) => [g.id, g]));

    expect(byId.tag!.options.map((o) => o.key)).toEqual(['боевик', 'ahegao']);
    expect(byId.tag!.options.map((o) => o.title)).toEqual(['Боевик', 'Ahegao']);

    expect(byId.series!.options).toEqual([{ key: 'naruto', title: 'Naruto', count: 257 }]);
    expect(byId.author!.options).toEqual([{ key: 'asanagi', title: 'Asanagi', count: 40 }]);
    expect(byId.group!.options).toEqual([{ key: 'behind_moon', title: 'Behind Moon', count: 55 }]);
    expect(byId.translator!.options).toEqual([{ key: 'team-a', title: 'TeamA', count: 12 }]);

    // The five routes never combine on the source (see ROUTE_EXCLUSIVE_GROUP) — every group must
    // say so.
    for (const group of groups) {
      expect(group.exclusiveGroup).toBe('route');
    }
  });

  it('getFilters: series/author/group/translator narrow sortOrders, tag keeps the default', async () => {
    const groups = await parser.getFilters!();
    const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
    const entitySortOrders = [
      SORT_ORDER.POPULARITY,
      SORT_ORDER.RATING,
      SORT_ORDER.COMMENTS,
      SORT_ORDER.RELEASED,
    ];

    expect(byId.tag!.sortOrders).toBeUndefined();
    expect(byId.series!.sortOrders).toEqual(entitySortOrders);
    expect(byId.author!.sortOrders).toEqual(entitySortOrders);
    expect(byId.group!.sortOrders).toEqual(entitySortOrders);
    expect(byId.translator!.sortOrders).toEqual(entitySortOrders);
  });

  it('getList: a stale PAGES order on an entity route falls back to the date sort', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      order: SORT_ORDER.PAGES,
      filters: [{ groupId: 'author', key: 'asanagi' }],
    });
    const request = http.requests.findLast((r) => r.url.includes('/mangaka/'))!;
    expect(request.url).toContain('&date&');
    expect(request.url).not.toContain('&pages');
  });

  it('getList: an author filter selection routes through /mangaka/<slug>', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: 'author', key: 'asanagi' }],
    });
    expect(items).toHaveLength(1);
    const [request] = http.requests.filter((r) => r.url.includes('/mangaka/asanagi&'));
    expect(request!.url).toContain('rowstart=0');
  });

  it('getList: a tag filter selection routes through /tags/<key>_', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: 'tag', key: 'боевик' }],
    });
    expect(items).toHaveLength(1);
    const [request] = http.requests.filter(
      (r) => r.url.includes('/tags/') && !r.url.endsWith('/tags/'),
    );
    expect(request!.url).toContain(`${encodeURIComponent('боевик')}_`);
    expect(request!.url).toContain('rowstart=0');
  });
});

/** The site collapses multi-chapter series in `all_manga`, so consecutive `rowstart` windows
 *  can legitimately return an already-seen card (e.g. rowstart=0 -> [1,2], rowstart=30 -> [2,3]).
 *  Regression coverage for the bug where paging through the web UI showed repeated titles
 *  because dedup used to be scoped to a single getList() call instead of the whole scan. */
const rowRow = (id: number): string => {
  return `<table class="news_pic2"><tr><td>
    <a href="/${id}-title" title="Alt${id} / Title${id}"></a>
    <img class="news_pic2" data-src="/covers/${id}.jpg" />
  </td></tr></table>`;
};

describe('Nude-Moon parser: cross-page dedup', () => {
  it('does not repeat cards across sequential getList pages', async () => {
    const byRowstart: Record<number, number[]> = {
      0: [1, 2],
      30: [2, 3],
      60: [4, 5],
    };
    const http = new FakeHttpClient();
    for (const [rowstart, ids] of Object.entries(byRowstart)) {
      http.register((url) => url.includes(`rowstart=${rowstart}`), {
        status: 200,
        body: `<!doctype html><html><body>${ids.map(rowRow).join('')}</body></html>`,
      });
    }
    http.register((url) => url.includes('/all_manga'), {
      status: 200,
      body: '<!doctype html><html><body></body></html>',
    });

    const parser = createNudeMoonParser(makeContext(http));
    const page1 = await parser.getList({ offset: 0, limit: 2 });
    const page2 = await parser.getList({ offset: 2, limit: 2 });

    const ids1 = new Set(page1.map((m) => m.id));
    const ids2 = new Set(page2.map((m) => m.id));
    expect(ids1.size).toBe(2);
    expect(ids2.size).toBe(2);
    for (const id of ids1) {
      expect(ids2.has(id)).toBe(false);
    }
  });
});

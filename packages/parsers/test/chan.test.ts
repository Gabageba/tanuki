import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createChanParser } from '../src/sources/chan/engine';
import type { ChanConfig } from '../src/sources/chan/config';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'manga-chan.example';

const CFG: ChanConfig = {
  id: 'MANGACHAN',
  isNsfw: false,
  sortOrders: ['NEWEST', 'POPULARITY', 'ALPHABETICAL', 'RATING'],
  variant: 'default',
};

const LIST_HTML = `<!doctype html><html><body>
  <div class="main_fon">
    <div id="content">
      <div class="content_row">
        <div class="manga_row1"><h2><a href="/One-Piece.html">Ван-Пис (One Piece)</a></h2></div>
        <div class="manga_images">
          <a href="/One-Piece.html"><img src="/uploads/one-piece.jpg" /></a>
          Плюсиков: <font style="color:green;"><b>7</b></font>
        </div>
        <a href="/mangaka/oda">Oda Eiichiro</a>
        <div class="manga_row3">
          <div class="item">Статус (томов)</div>
          <div class="row3_left">
            <div class="item2">1 том, выпуск продолжается <span><b>89 глав</b>, перевод продолжается</span></div>
          </div>
        </div>
        <div class="genre"><a href="/tags/priklyucheniya">приключения</a></div>
      </div>
    </div>
  </div>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <div id="dle-content">
    <h1>Ван-Пис (One Piece)</h1>
    <span id="ratig-layer-1">plus widget</span> Плюсиков: <font style="color:green;"><b>12</b></font>
    <img id="cover" src="/uploads/one-piece-full.jpg" />
    <a href="/mangaka/oda">Oda Eiichiro</a>
    <div class="sidetags"><ul>
      <li class="sidetag"><a href="/tags/priklyucheniya">приключения</a></li>
      <li class="sidetag"><a href="/tags/komediya">комедия</a></li>
    </ul></div>
    <div id="description">Описание тайтла.<div class="share-buttons">social widget junk</div></div>
    <table class="table_cha">
      <tr><td>header1</td></tr>
      <tr><td>header2</td></tr>
      <tr><td><a href="/One-Piece/2.html">Глава 2</a></td><td class="date">2024-01-02</td></tr>
      <tr><td><a href="/One-Piece/1.html">Глава 1</a></td><td class="date">2024-01-01</td></tr>
    </table>
  </div>
</body></html>`;

const PAGES_HTML = `<!doctype html><html><body>
  <script>
    var pictures = "fullimg"; var arr = ["001.jpg","002.jpg","003.jpg"];
  </script>
</body></html>`;

const TAG_CLOUD_HTML = `<!doctype html><html><body>
  <div id="dle-content">
    <span class="news">
      <a href="https://manga-chan.example/tags/priklyucheniya/" class="clouds_medium" title="Найдено новостей: 120">приключения</a>,
      <a href="https://manga-chan.example/tags/komediya/" class="clouds_small" title="Найдено новостей: 45">комедия</a>
    </span>
  </div>
</body></html>`;

const TYPE_HTML = `<!doctype html><html><body>
  <div id="content">
    <div class="series_wrap"><a href=""><div class="series_name"><h2><a href="" title=""></a></h2></div></a></div>
    <div class="series_wrap"><a href="Манга"><div class="series_name"><h2><a href="Манга" title="Манга">Манга</a></h2></div></a></div>
    <div class="series_wrap"><a href="Манхва"><div class="series_name"><h2><a href="Манхва" title="Манхва">Манхва</a></h2></div></a></div>
  </div>
</body></html>`;

const STATUS_HTML = `<!doctype html><html><body>
  <div class="main_fon">
    <div id="side">
      <div class="only">
        <a href="/catalog/all_done">Перевод завершен</a>
        <a href="/catalog/ongoing">Онгоинг</a>
        <a href="/catalog">Весь каталог</a>
      </div>
    </div>
  </div>
</body></html>`;

const TAGS_LIST_HTML = `<!doctype html><html><body>
  <div class="main_fon">
    <div id="content">
      <div class="content_row">
        <div class="manga_row1"><h2><a href="/One-Piece.html">Ван-Пис (One Piece)</a></h2></div>
        <div class="manga_images"><a href="/One-Piece.html"><img src="/uploads/one-piece.jpg" /></a></div>
      </div>
    </div>
  </div>
</body></html>`;

const TYPE_LIST_HTML = TAGS_LIST_HTML;
const STATUS_LIST_HTML = TAGS_LIST_HTML;

const makeContext = (http: FakeHttpClient): ParserContext => {
  return {
    http,
    domain: DOMAIN,
    jar: new CookieJar(),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    credentials: {},
  };
};

const setUpFixtures = (): FakeHttpClient => {
  const http = new FakeHttpClient();
  http.register((url) => url.includes('offset=') && !url.includes('/One-Piece'), {
    status: 200,
    body: LIST_HTML,
  });
  http.register((url) => url.endsWith('/One-Piece.html'), { status: 200, body: DETAILS_HTML });
  http.register((url) => url.includes('/One-Piece/2.html'), { status: 200, body: PAGES_HTML });
  return http;
};

describe('Chan parser conformance', () => {
  const http = setUpFixtures();
  const parser = createChanParser(CFG, makeContext(http));

  it('getList: chapters null, rating -1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('MANGACHAN');
    expect(item!.rating).toBe(-1);
    expect(item!.likes).toBe(7);
    expect(item!.chaptersCount).toBe(89);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.title).toBe('One Piece');
    expect(item!.altTitles).toEqual(['Ван-Пис']);
    expect(item!.authors).toEqual(['Oda Eiichiro']);
    expect(item!.tags.map((t) => t.title)).toEqual(['Приключения']);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/One-Piece.html');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThan(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    // oldest-first ordering: chapter "1" comes before chapter "2"
    expect(manga.chapters![0]!.title).toBe('Глава 1');
    expect(manga.chapters![1]!.title).toBe('Глава 2');
    expect(manga.description).toBe('Описание тайтла.');
    expect(manga.tags.map((t) => t.title).sort()).toEqual(['Комедия', 'Приключения']);
    expect(manga.likes).toBe(12);
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/One-Piece.html');
    const chapter2 = manga.chapters!.find((c) => c.title === 'Глава 2')!;
    const pages = await parser.getPages(chapter2.url);
    expect(pages).toHaveLength(3);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe(`https://${DOMAIN}/001.jpg`);
  });
});

describe('Chan parser filters', () => {
  const http = new FakeHttpClient();
  // Order matters: the bare tag-cloud fetch must match before the broader tag-filtered-list rule.
  http.register((url) => url.endsWith('/tags/'), { status: 200, body: TAG_CLOUD_HTML });
  http.register((url) => url.includes('/tags/'), { status: 200, body: TAGS_LIST_HTML });
  http.register((url) => url.endsWith('/type/'), { status: 200, body: TYPE_HTML });
  http.register((url) => url.includes('/type/'), { status: 200, body: TYPE_LIST_HTML });
  http.register((url) => url.endsWith('/catalog'), { status: 200, body: STATUS_HTML });
  http.register((url) => url.includes('/catalog/'), { status: 200, body: STATUS_LIST_HTML });
  const parser = createChanParser(CFG, makeContext(http));

  it('getFilters: tag/type/status groups, all sharing one exclusiveGroup', async () => {
    const groups = await parser.getFilters!();
    expect(groups).toHaveLength(3);

    const tagGroup = groups.find((g) => g.id === 'tag')!;
    expect(tagGroup.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(tagGroup.options.map((o) => o.key)).toEqual(['priklyucheniya', 'komediya']);
    expect(tagGroup.options.map((o) => o.title)).toEqual(['Приключения', 'Комедия']);
    expect(tagGroup.options.map((o) => o.count)).toEqual([120, 45]);

    const typeGroup = groups.find((g) => g.id === 'type')!;
    expect(typeGroup.type).toBe('RADIO');
    expect(typeGroup.options.map((o) => o.key)).toEqual(['Манга', 'Манхва']);

    const statusGroup = groups.find((g) => g.id === 'status')!;
    expect(statusGroup.type).toBe('RADIO');
    // "Весь каталог" (/catalog, no second path segment) is a reset link, not a status option.
    expect(statusGroup.options.map((o) => o.key)).toEqual(['all_done', 'ongoing']);

    for (const group of groups) {
      expect(group.exclusiveGroup).toBe('route');
    }
  });

  it('getList with tag filters: builds /tags/<included>+-<excluded> with the sort n= param', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      order: 'RATING',
      filters: [
        { groupId: 'tag', key: 'komediya', exclude: true },
        { groupId: 'tag', key: 'priklyucheniya' },
      ],
    });
    expect(items).toHaveLength(1);
    const requestedUrl = http.requests.at(-1)!.url;
    expect(requestedUrl).toContain('/tags/priklyucheniya+-komediya');
    expect(requestedUrl).toContain('n=favdesc');
  });

  it('getList with a type filter: builds /type/<name>', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      order: 'ALPHABETICAL',
      filters: [{ groupId: 'type', key: 'Манга' }],
    });
    expect(items).toHaveLength(1);
    const requestedUrl = http.requests.at(-1)!.url;
    expect(requestedUrl).toContain('/type/');
    expect(decodeURIComponent(requestedUrl)).toContain('/type/Манга');
    expect(requestedUrl).toContain('n=abcasc');
  });

  it('getList with a status filter: builds /catalog/<status>', async () => {
    const items = await parser.getList({
      offset: 0,
      limit: 20,
      filters: [{ groupId: 'status', key: 'ongoing' }],
    });
    expect(items).toHaveLength(1);
    const requestedUrl = http.requests.at(-1)!.url;
    expect(requestedUrl).toContain('/catalog/ongoing');
  });
});

import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { createDesuParser } from '../src/sources/desu';
import type { ParserContext } from '../src/core/parser';
import { FakeHttpClient } from './support/fake-http';

const DOMAIN = 'desu.uno';

// Combined catalog + genre-filter fixture — both live at the same URL on the real site
// (the /manga/ catalog page embeds the genre filter widget inline).
const CATALOG_HTML = `<!doctype html><html><body>
  <div id="animeFilter">
    <ul class="catalog-kinds">
      <li><div class="filter-control kind-checkbox"><input class="filter-control-input" data-kind="manga" value="0"> <span class="filter-control-text">Манга</span></div></li>
      <li><div class="filter-control kind-checkbox"><input class="filter-control-input" data-kind="manhwa" value="0"> <span class="filter-control-text">Манхва</span></div></li>
    </ul>
    <div class="catalog-genres">
      <ul>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="12" data-genre-slug="action" data-genre-name="боевик" value="0" /> <span class="filter-control-text">Боевик</span> <span>(130)</span></div></li>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="34" data-genre-slug="fantasy" data-genre-name="фэнтези" value="0" /> <span class="filter-control-text">Фэнтези</span> <span>(3631)</span></div></li>
        <li style="width:100% !important;height:10px !important;"></li>
        <li><div class="filter-control genre-checkbox"><input data-genre-id="150" data-genre-slug="Artifacts" data-genre-name="артефакты" value="0" /> <span class="filter-control-text"><span style="padding-right:1px;color:rgb(150,150,150)">#</span>Артефакты</span> <span style="font-size:10px;color:rgb(150,150,150);padding-left:2px;">(477)</span></div></li>
      </ul>
    </div>
    <ul class="catalog-status">
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="ongoing" value="0"> <span class="filter-control-text">Выходит</span></div></li>
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="completed" value="0"> <span class="filter-control-text">Завершено</span></div></li>
      <li><div class="filter-control status-checkbox"><input class="filter-control-input" data-status="no18plus" value="0"> <span class="filter-control-text">Без 18+</span></div></li>
    </ul>
  </div>
  <ul>
    <li class="memberListItem">
      <h3><a class="animeTitle" href="/manga/solo-leveling.123">Solo Original Title</a></h3>
      <span class="dimmed oTitle">Поднятие уровня в одиночку</span>
      <a class="avatar"><span class="img" style="background-image:url('https://desu.uno/img/123-preview.jpg')"></span></a>
      <dl class="pairsInline"><dt>Жанры:</dt><dd>Боевик, Фэнтези</dd></dl>
      <dl class="pairsInline"><dt>Тип:</dt><dd>Манхва</dd><dt>Год:</dt><dd>2018</dd></dl>
      <dl class="pairsInline"><dt>Рейтинг:</dt><dd>8.5</dd></dl>
    </li>
  </ul>
</body></html>`;

const DETAILS_HTML = `<!doctype html><html><body>
  <h1><span class="name">Solo Leveling</span><span class="rus-name">Поднятие уровня в одиночку</span></h1>
  <div class="alternativeHeadline">Only I Level Up, 나 혼자만 레벨업</div>
  <div class="c-info-left">
    <div class="tagList">
      <a itemprop="genre" href="/manga/?genres=12">#Боевик</a>
      <a itemprop="genre" href="/manga/?genres=34">#Фэнтези</a>
    </div>
  </div>
  <div class="line-container">
    <div class="line"><span class="key">Статус:</span><span class="value"><span class="b-anime_status_tag ongoing"></span></span></div>
  </div>
  <div class="b-rate" data-score="8.7"></div>
  <div id="description"><div class="russian"><div class="prgrph">Первый абзац.</div><div class="prgrph">Второй абзац.</div></div></div>
  <div class="c-poster"><img itemprop="image" src="https://desu.uno/img/123-full.jpg" /></div>
  <ul class="chlist">
    <li>
      <h4><a href="/manga/solo-leveling.123/vol1/ch2/">Глава 2</a></h4>
      <i class="chDownload" data-chapters_id="9002"></i>
      <span class="date">Сегодня в 10:00</span>
    </li>
    <li>
      <h4><a href="/manga/solo-leveling.123/vol1/ch1/">Глава 1</a></h4>
      <i class="chDownload" data-chapters_id="9001"></i>
      <span class="date">Вчера в 09:30</span>
    </li>
  </ul>
</body></html>`;

// The reader page only bootstraps a chapter id + api base path now — the page list itself comes
// from a follow-up JSON call to `${apiBaseUrl}/chapters/${chapter.id}` (ClassicReaderApi.init
// replaced the old Reader.init(dir/prefix/pages) inline payload).
const PAGES_HTML = `<!doctype html><html><body>
  <script>
    window.MangaReader = {"manga":{"id":123,"name":"Solo Leveling"},"chapter":{"id":9001,"volume":"1","number":"1"},"apiBaseUrl":"/api/manga/123"};
    $(document).ready(function() {
        ClassicReaderApi.init(window.MangaReader);
    });
  </script>
</body></html>`;

const PAGES_API_JSON = JSON.stringify({
  chapter: {
    pages: [
      { page: 1, url: 'https://static.desu.uno/manga/123/vol1/ch1/001.jpg' },
      { page: 2, url: 'https://static.desu.uno/manga/123/vol1/ch1/002.jpg' },
      { page: 3, url: 'https://static.desu.uno/manga/123/vol1/ch1/003.jpg' },
    ],
  },
});

// Real XenForo search response shape — templateHtml embeds AniMangaSearchCard markup, not the
// blockLinksList/itemTitle classes an older site layout used.
const SEARCH_JSON = JSON.stringify({
  templateHtml: `
    <ul class="AniMangaSearchList" data-search-content-type="manga">
      <li class="AniMangaSearchCard">
        <a href="manga/naruto.29/" class="AniMangaSearchCard__link">
          <img src="https://static.desu.uno/data/manga/covers/x120/29.jpg" class="AniMangaSearchCard__cover" />
          <span class="AniMangaSearchCard__title">Наруто</span>
          <span class="AniMangaSearchCard__subtitle">Naruto</span>
        </a>
      </li>
    </ul>`,
});

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
  http.register((url) => url === `https://${DOMAIN}/manga/`, { status: 200, body: CATALOG_HTML });
  // Filtered/paginated catalog requests append a query string (?kinds=...&page=2 etc.) — same
  // fixture body, the assertions on filter params read `http.requests`, not this response.
  http.register((url) => url.startsWith(`https://${DOMAIN}/manga/?`), {
    status: 200,
    body: CATALOG_HTML,
  });
  http.register(
    (url) => url.startsWith(`https://${DOMAIN}/manga/solo-leveling.123`) && !url.includes('/vol'),
    { status: 200, body: DETAILS_HTML },
  );
  http.register((url) => url.includes('/vol1/ch1/'), { status: 200, body: PAGES_HTML });
  http.register((url) => url === `https://${DOMAIN}/api/manga/123/chapters/9001`, {
    status: 200,
    body: PAGES_API_JSON,
    contentType: 'application/json',
  });
  http.register((url) => url === `https://${DOMAIN}/manga/search/`, {
    status: 200,
    body: SEARCH_JSON,
    contentType: 'application/json',
  });
  return http;
};

describe('Desu parser conformance', () => {
  const http = setUpFixtures();
  const parser = createDesuParser(makeContext(http));

  it('getList: chapters null, rating in 0..1, url relative, id a safe integer', async () => {
    const items = await parser.getList({ offset: 0, limit: 20 });
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item!.chapters).toBeNull();
    expect(item!.source).toBe('DESUME');
    expect(item!.rating === -1 || (item!.rating >= 0 && item!.rating <= 1)).toBe(true);
    expect(item!.rating).toBeCloseTo(0.85, 5);
    expect(item!.url.startsWith('http')).toBe(false);
    expect(item!.publicUrl).toMatch(/^https?:\/\//);
    expect(Number.isSafeInteger(item!.id)).toBe(true);
    expect(item!.tags.map((t) => t.title).sort()).toEqual(['Боевик', 'Фэнтези']);
    expect(item!.type).toBe('MANHWA');
    expect(item!.year).toBe(2018);
  });

  it('getDetails: chapters populated with valid sentinels, ids unique', async () => {
    const manga = await parser.getDetails('/manga/solo-leveling.123');
    expect(manga.chapters).not.toBeNull();
    expect(manga.chapters).toHaveLength(2);
    for (const chapter of manga.chapters!) {
      expect(chapter.number).toBeGreaterThanOrEqual(0);
      expect(chapter.uploadDate === 0 || chapter.uploadDate > 1e12).toBe(true);
    }
    expect(new Set(manga.chapters!.map((c) => c.id)).size).toBe(manga.chapters!.length);
    expect(manga.state).toBe('ONGOING');
    expect(manga.rating).toBeCloseTo(0.87, 5);
    expect(manga.title).toBe('Поднятие уровня в одиночку');
    expect(manga.description).toBe('Первый абзац.\n\nВторой абзац.');
  });

  it('getList with query: parses AniMangaSearchCard results', async () => {
    const items = await parser.getList({ offset: 0, limit: 20, query: 'наруто' });
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toBe('Наруто');
    expect(items[0]!.altTitles).toEqual(['Naruto']);
    expect(items[0]!.url).toBe('/manga/naruto.29/');
  });

  it('getFilters: all five groups with their options and counts', async () => {
    const groups = await parser.getFilters!();
    expect(groups.map((g) => g.id)).toEqual(['kind', 'genre', 'tag', 'status', 'rating']);

    const kind = groups.find((g) => g.id === 'kind')!;
    expect(kind.type).toBe('CHECKBOX');
    expect(kind.options).toEqual([
      { key: 'manga', title: 'Манга', count: null },
      { key: 'manhwa', title: 'Манхва', count: null },
    ]);

    const genre = groups.find((g) => g.id === 'genre')!;
    expect(genre.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(genre.options).toEqual([
      { key: '12-action', title: 'Боевик', count: 130 },
      { key: '34-fantasy', title: 'Фэнтези', count: 3631 },
    ]);

    const tag = groups.find((g) => g.id === 'tag')!;
    expect(tag.title).toBe('Теги');
    expect(tag.type).toBe('SEARCHABLE_CHECKBOX_EXCLUDE');
    expect(tag.options).toEqual([{ key: '150-Artifacts', title: 'Артефакты', count: 477 }]);

    const status = groups.find((g) => g.id === 'status')!;
    expect(status.type).toBe('CHECKBOX');
    expect(status.options).toEqual([
      { key: 'ongoing', title: 'Выходит', count: null },
      { key: 'completed', title: 'Завершено', count: null },
    ]);

    const rating = groups.find((g) => g.id === 'rating')!;
    expect(rating.title).toBe('Возрастное ограничение');
    expect(rating.type).toBe('CHECKBOX');
    expect(rating.options).toEqual([{ key: 'no18plus', title: 'Без 18+', count: null }]);
  });

  it('getList with filters: kinds/status are plain lists, genre exclude packs "id-!slug"', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'kind', key: 'manga' },
        { groupId: 'status', key: 'ongoing' },
        { groupId: 'genre', key: '12-action' },
        { groupId: 'genre', key: '34-fantasy', exclude: true },
      ],
    });
    const catalogRequest = http.requests.find((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`));
    expect(catalogRequest).toBeDefined();
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('kinds')).toBe('manga');
    expect(url.searchParams.get('status')).toBe('ongoing');
    expect(url.searchParams.get('genres')).toBe('12-action,34-!fantasy');
  });

  it('getList with filters: "tag" group folds into the shared genres param', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'genre', key: '12-action' },
        { groupId: 'tag', key: '150-Artifacts' },
      ],
    });
    const catalogRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`))
      .at(-1);
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('genres')).toBe('12-action,150-Artifacts');
  });

  it('getList with filters: "rating" group folds into the shared status param', async () => {
    await parser.getList({
      offset: 0,
      limit: 20,
      filters: [
        { groupId: 'status', key: 'ongoing' },
        { groupId: 'rating', key: 'no18plus' },
      ],
    });
    const catalogRequest = http.requests
      .filter((r) => r.url.startsWith(`https://${DOMAIN}/manga/?`))
      .at(-1);
    const url = new URL(catalogRequest!.url);
    expect(url.searchParams.get('status')).toBe('ongoing,no18plus');
  });

  it('getPages: absolute, pre-resolved urls', async () => {
    const manga = await parser.getDetails('/manga/solo-leveling.123');
    const chapterUrl = manga.chapters!.find((c) => c.url.includes('ch1'))!.url;
    const pages = await parser.getPages(chapterUrl);
    expect(pages).toHaveLength(3);
    for (const page of pages) {
      expect(page.url).toMatch(/^https?:\/\//);
    }
    expect(pages[0]!.url).toBe('https://static.desu.uno/manga/123/vol1/ch1/001.jpg');
  });
});
